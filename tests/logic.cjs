'use strict';
// The exported suite runs the actual production source with a minimal DOM/HA double.
// Browser geometry and hit testing are covered separately by browser.py.
async function run(source, baseline) {
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const same = (a, b, message) => assert(JSON.stringify(a) === JSON.stringify(b), message + ': ' + JSON.stringify(a));
  const passed = [];
  const check = (name, callback) => { callback(); passed.push(name); };
  class Classes {
    constructor(node) { this.node = node; }
    values() { return this.node.className.split(/\s+/).filter(Boolean); }
    contains(key) { return this.values().includes(key); }
    toggle(key, state) {
      const values = new Set(this.values());
      if (state ?? !values.has(key)) values.add(key); else values.delete(key);
      this.node.className = [...values].join(' '); return values.has(key);
    }
    add(key) { this.toggle(key, true); }
    remove(key) { this.toggle(key, false); }
  }
  class Node {
    constructor(tag = '') {
      this.tagName = tag; this.children = []; this.className = ''; this.classList = new Classes(this);
      this.attrs = {}; this.listeners = {}; this.isConnected = true; this.hidden = false;
      const vars = {};
      this.style = {setProperty: (k,v) => vars[k] = v, removeProperty: k => delete vars[k], getPropertyValue: k => vars[k] || ''};
    }
    append(...nodes) { this.children.push(...nodes); }
    replaceChildren(...nodes) { this.children = nodes; }
    attachShadow() { this.shadowRoot = new Node('shadow'); return this.shadowRoot; }
    addEventListener(type, cb) { (this.listeners[type] ||= []).push(cb); }
    removeEventListener(type, cb) { this.listeners[type] = (this.listeners[type] || []).filter(x => x !== cb); }
    dispatchEvent(e) { for (const cb of this.listeners[e.type] || []) cb(e); return true; }
    event(type, extra = {}) { this.dispatchEvent({type, detail:0, button:0, isPrimary:true, pointerType:'mouse', clientX:0,clientY:0,stopPropagation(){},preventDefault(){},composedPath:()=>[this],...extra}); }
    setAttribute(k,v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k]; }
    focus() { this.focused = true; }
    querySelectorAll(tag) { return this.children.flatMap(n => [...(n.tagName === tag ? [n] : []), ...n.querySelectorAll(tag)]); }
  }
  const registry = {};
  const customElements = {get: k => registry[k], define: (k,v) => registry[k] = v};
  const document = new Node('document');
  document.createElement = tag => registry[tag] ? new registry[tag]() : new Node(tag);
  const window = new Node('window'); window.customCards = [];
  const calls = [];
  const hass = (states = {}) => ({states, callService: (...args) => { calls.push(args); return Promise.resolve(); }});
  const requests = [];
  const fetch = (url, {signal}) => new Promise((resolve, reject) => requests.push({url,signal,resolve,reject}));
  class AbortController { constructor() { this.signal = {aborted:false}; } abort() { this.signal.aborted = true; } }
  class Event { constructor(type, options) { Object.assign(this, options, {type}); } }
  let now = 0, sequence = 0;
  const timers = new Map();
  const later = (callback, delay) => { timers.set(++sequence, {callback,at: now+delay}); return sequence; };
  const cancel = id => timers.delete(id);
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers].sort((a,b) => a[1].at-b[1].at).find(x=>x[1].at<=end);
      if (!next) break;
      now=next[1].at; timers.delete(next[0]); next[1].callback();
    }
    now=end;
  }
  const flush = async () => { for (let n=0;n<6;n++) await Promise.resolve(); };
  // Capture otherwise private helpers without changing any production method.
  const instrumented = source.replace("if (!customElements.get('circle-menu-card'))", "capture({angles,layout,matches,badgeValue,validate}); if (!customElements.get('circle-menu-card'))");
  let helpers;
  new Function('HTMLElement','document','customElements','window','console','getComputedStyle','setTimeout','clearTimeout','fetch','AbortController','CustomEvent','Event','capture',instrumented)(
    Node,document,customElements,window,{info(){},warn(){}},()=>({fontSize:'16px'}),later,cancel,fetch,AbortController,Event,Event,v=>helpers=v);
  const Card = registry['circle-menu-card'];
  const serviceItem = {icon:'mdi:lightbulb',action:{action:'call-service',service:'light.turn_on',service_data:{entity_id:'light.a'}}};
  const make = config => { const card = new Card(); card.setConfig(config); card.connectedCallback(); card.hass=hass(); return card; };
  const item = card => card._entries.find(e=>!e.outer).node;
  const main = card => card._button;
  check('register card and editor once',()=>{ assert(Card && registry['circle-menu-card-editor'],'registration'); same(window.customCards.length,1,'metadata'); });
  check('v1 geometry exact for every supported count',()=>{
    for(let n=1;n<=4;n++) {
      const expected = Array.from({length:n},(_,i)=>140/n*i-90+[47,6,-1,-7][n-1]);
      same(helpers.angles(n),expected,'legacy angles');
      const l=helpers.layout(n,{},112,48,true); same(l.radius,112,'legacy radius');
    }
  });
  check('dynamic spacing for 5–12 items',()=>{
    for(let n=5;n<=12;n++) { const l=helpers.layout(n,{},112,48,false); assert(2*l.radius*Math.sin((l.values[1]-l.values[0])*Math.PI/360)>=52-1e-7,'overlap'); }
  });
  check('legacy open and close, exact CSS coordinates and disk scale',()=>{
    const c=make({items:[serviceItem]});
    assert(!c._open && item(c).tabIndex===-1,'initial state');
    same(c._menu.style.getPropertyValue('--cm-inner-scale'),'5.5','scale');
    main(c).event('click'); assert(c._open && item(c).tabIndex===0,'open');
    same(item(c).style.getPropertyValue('--x'),(-112*Math.cos(-43*Math.PI/180))+'px','x');
    main(c).event('click'); assert(!c._open,'close'); c.disconnectedCallback();
  });
  check('auto and manual second rings maintain both hit targets',()=>{
    const c=make({items:[{action:{action:'expand'}}],secondary:{open:'manual',items:[serviceItem]}});
    const outer=c._entries.find(e=>e.outer).node;
    main(c).event('click'); assert(c._open&&!c._outer&&outer.tabIndex===-1,'manual');
    item(c).event('click'); assert(c._outer&&outer.tabIndex===0&&item(c).tabIndex===0,'both rings');
    item(c).event('click'); assert(!c._outer&&c._open,'collapse outer');
    c.setConfig({items:[serviceItem],secondary:{items:[serviceItem]}});
    main(c).event('click'); assert(c._outer,'auto');
    c.disconnectedCallback(); assert(!c._open&&!c._outer,'disconnect');
  });
  check('legacy service call and modern target',()=>{
    const c=make({items:[serviceItem,{action:{action:'perform-action',perform_action:'light.toggle',data:{brightness:100},target:{entity_id:'light.b'}}}]});
    main(c).event('click');
    c._entries[0].node.event('click'); c._entries[1].node.event('click');
    same(calls.slice(-2),[['light','turn_on',{entity_id:'light.a'}],['light','toggle',{brightness:100},{entity_id:'light.b'}]],'service calls');
    c.disconnectedCallback();
  });
  check('first hass update, duplicate entities and state overrides',()=>{
    const c=make({items:[serviceItem,{...serviceItem,states:{on:{icon:'mdi:lightbulb-on'}}}]});
    c.hass=hass({'light.a':{state:'on'}});
    assert(c._entries.every(e=>e.node.classList.contains('active')),'duplicate highlights');
    same(c._entries[1].icon.getAttribute('icon'),'mdi:lightbulb-on','dynamic icon');
    c.hass=hass({}); assert(c._entries.every(e=>!e.node.classList.contains('active')),'missing state');
    c.disconnectedCallback();
  });
  check('conditions and badges',()=>{
    const c=make({items:[{...serviceItem,conditions:[{entity:'light.a',state:'on'}],badge:{entities:['light.a','light.b']}}]});
    assert(item(c).hidden,'missing entity');
    c.hass=hass({'light.a':{state:'on'},'light.b':{state:'on'}});
    assert(!item(c).hidden,'visible'); same(c._entries[0].badge.textContent,'2','badge');
    c.disconnectedCallback();
  });
  check('double tap and long press suppress single tap',()=>{
    const c=make({tap_action:{action:'menu'},hold_action:{action:'menu'},double_tap_action:{action:'expand'},secondary:{open:'manual',items:[serviceItem]}});
    main(c).event('click',{detail:1}); assert(!c._open,'deferred tap');
    main(c).event('click',{detail:2}); assert(c._open&&c._outer,'double');
    main(c).event('pointerdown'); advance(500); assert(!c._open,'hold closed');
    main(c).event('pointerup'); main(c).event('click',{detail:1}); advance(300); assert(!c._open,'no phantom tap');
    c.disconnectedCallback();
  });
  check('opt-in swipe opens both rings without tap',()=>{
    const c=make({secondary:{open:'manual',swipe_to_expand:true,items:[serviceItem]}});
    main(c).event('pointerdown',{clientX:300,clientY:300});
    main(c).event('pointermove',{clientX:290,clientY:290});
    main(c).event('pointermove',{clientX:250,clientY:250});
    main(c).event('pointerup'); main(c).event('click',{detail:1});
    assert(c._open&&c._outer,'swipe'); c.disconnectedCallback();
  });
  check('auto-close timers and outside click lifecycle',()=>{
    const c=make({auto_close:100,items:[serviceItem]});
    main(c).event('click'); advance(99); assert(c._open,'not yet');
    advance(1); assert(!c._open,'auto-close');
    main(c).event('click'); document.event('click'); assert(!c._open,'outside');
    main(c).event('click'); c.disconnectedCallback(); assert(timers.size===0,'cleanup');
  });
  const c=make({json_config:'/first.json',items:[serviceItem]});
  const first=requests.at(-1);
  c.setConfig({json_config:'/second.json',items:[serviceItem]});
  const second=requests.at(-1);
  assert(first.signal.aborted,'cancel stale request');
  second.resolve({ok:true,json:async()=>({icon:'mdi:home',items:[]})}); await flush();
  first.resolve({ok:true,json:async()=>({icon:'mdi:wrong'})}); await flush();
  same(c._localConfig.icon,'mdi:home','latest config only'); same(c._entries.length,1,'inline override');
  c.disconnectedCallback(); passed.push('external JSON cancellation and precedence');
  const empty=make({json_config:'/empty.json'}); const req=requests.at(-1);
  req.resolve({ok:true,json:async()=>({})}); await flush();
  const n=requests.length; empty.connectedCallback(); same(requests.length,n,'no empty loop');
  empty.disconnectedCallback(); passed.push('empty external JSON is cached');
  const failed=make({json_config:'/missing.json'}); requests.at(-1).resolve({ok:false,status:404}); await flush();
  assert(!failed._errorNode.hidden,'visible error'); failed.disconnectedCallback(); passed.push('JSON failure displayed');
  check('reject malformed configuration',()=>{
    for(const cfg of [{items:{}},{position:'center'},{secondary:{open:'wrong'}},{items:[{action:{action:'unknown'}}]}]) {
      let thrown=false;try{helpers.validate(cfg)}catch{thrown=true} assert(thrown,'invalid config accepted');
    }
  });
  check('contextual outer rings switch independently and retain inner geometry',()=>{
    const a={icon:'mdi:lightbulb',secondary:{radius:190,menu_background_color:'#aabbcc',items:[{icon:'mdi:lamp',action:{action:'call-service',service:'light.turn_on',service_data:{entity_id:'light.a'}}}]}};
    const b={icon:'mdi:music',action:{action:'expand'},secondary:{radius:230,item_size:54,menu_background_color:'#123456',items:[{icon:'mdi:play',action:{action:'call-service',service:'media_player.media_play',service_data:{entity_id:'media_player.b'}}},{icon:'mdi:stop',action:{action:'none'}}]}};
    const c=make({items:[a,b,serviceItem],secondary:{items:[{icon:'mdi:home',action:{action:'none'}}]}});
    const inner=c._entries.filter(e=>!e.outer);
    const outer=c._entries.filter(e=>e.outer);
    const visible=()=>outer.filter(e=>!e.node.hidden).map(e=>e.icon.getAttribute('icon'));
    const coordinates=()=>inner.map(e=>[e.node.style.getPropertyValue('--x'),e.node.style.getPropertyValue('--y')]);
    main(c).event('click'); same(visible(),['mdi:home'],'default');
    const original=coordinates();
    inner[0].node.event('click'); same(visible(),['mdi:lamp'],'first own ring');
    assert(c._open&&c._outer,'both open'); same(c._menu.style.getPropertyValue('--cm-outer-color'),'#aabbcc','first color');
    const first=outer.find(e=>e.icon.getAttribute('icon')==='mdi:lamp');
    first.node.event('click'); same(calls.at(-1),['light','turn_on',{entity_id:'light.a'}],'first service');
    inner[1].node.event('click'); same(visible(),['mdi:play','mdi:stop'],'second own ring');
    same(coordinates(),original,'inner positions unchanged');
    same(c._menu.style.getPropertyValue('--cm-outer-color'),'#123456','second color');
    const count=calls.length; first.node.event('click'); same(calls.length,count,'inactive group cannot execute');
    outer.find(e=>e.icon.getAttribute('icon')==='mdi:play').node.event('click');
    same(calls.at(-1),['media_player','media_play',{entity_id:'media_player.b'}],'second service');
    same(inner[1].node.getAttribute('aria-expanded'),'true','selected');
    inner[1].node.event('click'); assert(c._open&&!c._outer,'toggle outer only');
    inner[0].node.event('click'); assert(c._outer,'reopen first');
    main(c).event('click'); main(c).event('click'); same(visible(),['mdi:home'],'reset to default');
    c.disconnectedCallback();
  });
  check('per-item rings need no global ring and support hold expand without replacing tap',()=>{
    const c=make({items:[{...serviceItem,hold_action:{action:'expand'},secondary:{items:[{icon:'mdi:home',action:{action:'none'}}]}}]});
    main(c).event('click'); assert(!c._outer,'no default ring');
    item(c).event('click'); same(calls.at(-1),['light','turn_on',{entity_id:'light.a'}],'original tap');
    item(c).event('pointerdown'); advance(500); assert(c._outer,'hold expands');
    item(c).event('pointerup'); item(c).event('click'); assert(c._outer,'no duplicate tap');
    c.disconnectedCallback();
  });
  check('hidden conditional parent closes its own ring',()=>{
    const c=make({items:[{conditions:[{entity:'light.a',state:'on'}],secondary:{items:[serviceItem]}}]});
    c.hass=hass({'light.a':{state:'on'}}); main(c).event('click'); item(c).event('click');
    assert(c._outer,'opened'); c.hass=hass({'light.a':{state:'off'}});
    assert(!c._outer&&c._entries.every(e=>e.node.hidden),'conditional parent and children hidden');
    c.disconnectedCallback();
  });
  check('validate item-specific outer ring and reject third level',()=>{
    helpers.validate({items:[{secondary:{items:[serviceItem]}}]});
    for(const cfg of [{items:[{secondary:[]}]},{items:[{secondary:{open:'auto'}}]},{items:[{secondary:{items:[{secondary:{items:[]}}]}}]},{secondary:{items:[{secondary:{items:[]}}]}}]) {
      let thrown=false;try{helpers.validate(cfg)}catch{thrown=true} assert(thrown,'invalid nested config accepted');
    }
  });
  return passed;
}
module.exports = run;
if (require.main === module) {
  const fs = require('node:fs');
  run(fs.readFileSync(require('node:path').join(__dirname,'../circle-menu-card.js'),'utf8')).then(results => {
    results.forEach(name => console.log('PASS',name)); console.log(results.length + ' passed');
  }).catch(error => { console.error(error); process.exitCode=1; });
}
