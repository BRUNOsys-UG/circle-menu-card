#!/usr/bin/env python3
"""Browser regressions against v1, using real pointer hit-testing and a stub HA API."""
import os
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OLD = subprocess.check_output(["git", "show", "adee52fb1086c7f63b6f4a1b6408a972ace38cd3:circle-menu-card.js"], cwd=ROOT, text=True)
NEW = (ROOT / "circle-menu-card.js").read_text()
HTML = """<!doctype html><style>:root{--primary-color:#3498db;--text-primary-color:white;--accent-color:#ffc107}
body{margin:0;font-size:16px}ha-icon{display:inline-block;width:24px;height:24px}</style><main></main>"""
SETUP = """() => {window.calls=[];window.info=[];window.events=[];
window.make=(cfg)=>{document.querySelector('circle-menu-card')?.remove();
const card=document.createElement('circle-menu-card'); card.setConfig(cfg);
document.querySelector('main').append(card);card.hass={states:{'light.a':{state:'off'}},callService:(...args)=>{calls.push(args);return Promise.resolve()}};window.card=card;return card;};
document.addEventListener('hass-more-info',e=>info.push(e.detail.entityId));
window.addEventListener('location-changed',()=>events.push(location.pathname));}"""
ITEM = {"icon":"mdi:lightbulb","action":{"action":"call-service","service":"light.turn_on","service_data":{"entity_id":"light.a"}}}

def page_for(browser, source, width=390, height=740):
    page = browser.new_page(viewport={"width":width,"height":height}, reduced_motion="reduce")
    page.route("http://circle.test/",lambda route:route.fulfill(status=200,content_type="text/html",body=HTML))
    page.goto("http://circle.test/")
    page.add_script_tag(content=source)
    page.evaluate(SETUP)
    return page

def geometry(page, count, left, font):
    page.evaluate("(font)=>document.body.style.fontSize=font+'px'",font)
    page.evaluate("(cfg)=>window.make(cfg)",{"left":left,"icon":"mdi:menu","items":[ITEM]*count})
    page.locator("circle-menu-card .floating-btn").click()
    page.wait_for_timeout(450)
    return page.evaluate("""() => {const root=card.shadowRoot;const rect=n=>{let r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height]};
    const menu=root.querySelector('.circular-menu');return [rect(root.querySelector('.floating-btn')),...Array.from(root.querySelectorAll('.menu-item'),rect),getComputedStyle(menu,'::after').transform]}""")

def assert_geometry(a,b):
    assert len(a)==len(b),(a,b)
    for x,y in zip(a[:-1],b[:-1]):
        assert all(abs(i-j)<.25 for i,j in zip(x,y)),(x,y)
    assert a[-1]==b[-1],(a[-1],b[-1])

def suite(browser, name):
    old=page_for(browser,OLD)
    new=page_for(browser,NEW)
    for font in (14,16):
        for count in range(1,5):
            for left in (False,True):
                assert_geometry(geometry(old,count,left,font),geometry(new,count,left,font))
    old.close()
    new.evaluate("()=>document.body.style.fontSize='16px'")
    new.evaluate("cfg=>window.make(cfg)",{"items":[ITEM]})
    assert new.locator("circle-menu-card .close").evaluate("n=>getComputedStyle(n).display")=="none"
    new.locator("circle-menu-card .floating-btn").click()
    new.locator("circle-menu-card .menu-item").click()
    assert new.evaluate("calls.at(-1)") == ["light","turn_on",{"entity_id":"light.a"}]
    new.mouse.click(20,20)
    assert not new.locator("circle-menu-card .circular-menu").evaluate("n=>n.classList.contains('active')")
    cfg={"items":[{"icon":"mdi:chevron-up","action":{"action":"expand"}},ITEM],
         "secondary":{"open":"manual","items":[{"icon":"mdi:home","action":{"action":"more-info","entity":"light.a"}}]}}
    new.evaluate("cfg=>window.make(cfg)",cfg)
    main=new.locator("circle-menu-card .floating-btn")
    main.click()
    outer=new.locator("circle-menu-card .cm-outer")
    assert outer.evaluate("n=>getComputedStyle(n).pointerEvents")=="none"
    inner=new.locator("circle-menu-card .menu-item:not(.cm-outer)")
    inner.first.click()
    new.wait_for_timeout(350)
    assert outer.evaluate("n=>getComputedStyle(n).pointerEvents")=="auto"
    outer.click()
    assert new.evaluate("info.at(-1)")=="light.a"
    inner.nth(1).click()
    assert new.evaluate("calls.at(-1)") == ["light","turn_on",{"entity_id":"light.a"}]
    main.click()
    assert not outer.evaluate("n=>n.getAttribute('aria-hidden')==='false'")
    # Both rings remain accessible in actual browser hit testing, not just class checks.
    for pos in ("bottom-left","bottom-right","top-left","top-right"):
        new.evaluate("cfg=>window.make(cfg)",{"position":pos,"items":[ITEM]*5,"secondary":{"items":[ITEM]*6}})
        new.locator("circle-menu-card .floating-btn").click()
        new.wait_for_timeout(350)
        buttons=new.locator("circle-menu-card .menu-item")
        assert buttons.count()==11
        for button in buttons.all():
            assert button.evaluate("""n=>{const r=n.getBoundingClientRect();let hit=n.getRootNode().elementFromPoint(r.x+r.width/2,r.y+r.height/2);return n===hit||n.contains(hit)}"""),(pos,button.bounding_box())
    new.evaluate("cfg=>window.make(cfg)",{"items":[ITEM,ITEM]})
    new.evaluate("()=>{card.hass={...card._hass,states:{'light.a':{state:'on'}}}}")
    assert new.locator("circle-menu-card .menu-item.active").count()==2
    new.evaluate("cfg=>window.make(cfg)",{"auto_close":100,"items":[ITEM]})
    new.locator("circle-menu-card .floating-btn").click()
    new.wait_for_timeout(200)
    assert not new.locator("circle-menu-card .circular-menu").evaluate("n=>n.classList.contains('active')")
    new.evaluate("cfg=>window.make(cfg)",{"secondary":{"open":"manual","swipe_to_expand":True,"items":[ITEM]}})
    r=new.locator("circle-menu-card .floating-btn").bounding_box()
    x,y=r["x"]+r["width"]/2,r["y"]+r["height"]/2
    new.mouse.move(x,y);new.mouse.down();new.mouse.move(x-55,y-55,steps=5);new.mouse.up()
    assert new.locator("circle-menu-card .circular-menu").evaluate("n=>n.classList.contains('cm-outer-open')")
    # Verify reordering retains field edits, including unknown keys.
    new.evaluate("""()=>{card.remove();const e=document.createElement('circle-menu-card-editor');
    e.setConfig({items:[{icon:'mdi:home',alt:'A',extra:'keep',action:{action:'none'}},{icon:'mdi:lightbulb',alt:'B',action:{action:'none'}}]});
    e.addEventListener('config-changed',ev=>window.edited=ev.detail.config);document.querySelector('main').append(e);window.editor=e;}""")
    panels=new.locator("circle-menu-card-editor details details")
    panels.first.locator("summary").click()
    label=panels.first.locator("label").filter(has_text="Label").locator("input")
    label.fill("Edited");label.press("Tab")
    panels.first.get_by_role("button",name="↓ Move down").click()
    assert new.evaluate("edited.items[1].alt")=="Edited"
    assert new.evaluate("edited.items[1].extra")=="keep"
    new.close()
    print("PASS",name,"v1 geometry (16 configurations), ring hit targets, legacy service, state, timer, swipe, editor")

if __name__=="__main__":
    with sync_playwright() as p:
        for name in os.getenv("BROWSERS","chromium,webkit").split(","):
            browser=getattr(p,name).launch()
            try:
                suite(browser,name)
            finally:
                browser.close()
