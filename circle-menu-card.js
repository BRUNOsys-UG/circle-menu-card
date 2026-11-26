/* Circle Menu Card v2 — dependency-free, backward-compatible Home Assistant card. */
(() => {
'use strict';
const VERSION = '2.0.0';
const POSITIVE_STATES = [true, 'true', 'on', 'open', 'active', 'detected', 'occupied', 'unlocked', 'home', 'above_horizon', 'ready'];
const POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
const ACTIONS = ['none', 'menu', 'expand', 'navigate', 'call-service', 'perform-action', 'toggle', 'more-info', 'url'];
const HA_ACTIONS = ['none', 'navigate', 'perform-action', 'toggle', 'more-info', 'url'];
const CSS_TEXT = `
        .circular-menu {
          position: fixed;
          bottom: 1em;
          right: 1em;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 1024;
        }
        .circular-menu .floating-btn {
          display: block;
          width: var(--cm-button-size, 3.5em);
          height: var(--cm-button-size, 3.5em);
          border-radius: 50%;
          background-color: var(--cm-button-color, var(--primary-color));
          box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.26);
          color: var(--cm-icon-color, var(--text-primary-color)) !important;
          text-align: center;
          line-height: 2.6;
          cursor: pointer;
          outline: 0;
        }
        .circular-menu.active .floating-btn {
          box-shadow: inset 0 0 3px rgba(0, 0, 0, 0.3);
        }
        .circular-menu .floating-btn:active {
          box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.4);
        }
        .circular-menu menu ha-icon, .circular-menu menu ha-icon ha-svg-icon {
          color: var(--cm-item-icon-color, inherit); fill: var(--cm-item-icon-color, var(--cm-icon-color, var(--text-primary-color)));
        }
        .circular-menu .floating-btn ha-icon {
          font-size: 1.3em;
          transition: transform .2s;
        }
        .circular-menu.active .floating-btn a {
          transform: rotate(-45deg);
        }
        .circular-menu:after {
          display: block;
          content: ' ';
          width: var(--cm-button-size, 3.5em);
          height: var(--cm-button-size, 3.5em);
          border-radius: 50%;
          position: absolute;
          top: 0;
          right: 0;
          z-index: -2;
          background-color: var(--cm-menu-color, var(--primary-color));
          transition: all .3s ease;
        }
        .circular-menu.active:after {
          transform: scale(var(--cm-inner-scale, 5.5));
          transition-timing-function: cubic-bezier(0.68, 1.55, 0.265, 1);
        }
        .circular-menu .items-wrapper {
          padding: 0;
          margin: 0;
        }
        .circular-menu .menu-item {
          position: absolute;
          top: .2em;
          right: .2em;
          z-index: -1;
          display: block;
          text-decoration: none;
          color: white;
          font-size: 1em;
          width: var(--cm-item-size, 3em);
          height: var(--cm-item-size, 3em);
          border-radius: 50%;
          text-align: center;
          line-height: 2.8;
          background-color: var(--cm-item-background, rgba(0, 0, 0, 0.1));
          transition: transform .3s ease, background .2s ease;
          cursor: pointer;
        }
        .circular-menu .menu-item:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
        .circular-menu .menu-item.active {
          background-color: var(--cm-active-color, var(--cm-item-active-color, var(--accent-color)));
        }
        .circular-menu.active .menu-item {
          transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .circular-menu.circular-menu-left {
          right: auto;
          left: 1em;
        }
        .circular-menu.circular-menu-left.active .floating-btn a {
          transform: rotate(45deg);
        }
        .circular-menu.active ha-icon {
          transition: all 3s ease;
        }
        .circular-menu.active .floating-btn ha-icon.icon {
          display: none;
        }
        .circular-menu.active .floating-btn ha-icon.close {
          display: block;
        }
        .circular-menu.active .menu-item { transform: translate(var(--x), var(--y)); }
      
        .circular-menu { bottom: var(--cm-offset-y, 1em); right: var(--cm-offset-x, 1em); }
        .circular-menu.circular-menu-left { left: var(--cm-offset-x, 1em); }
        .circular-menu.cm-top { bottom: auto; top: var(--cm-offset-y, 1em); }
        .circular-menu.cm-safe { bottom: max(var(--cm-offset-y, 1em), env(safe-area-inset-bottom)); right: max(var(--cm-offset-x, 1em), env(safe-area-inset-right)); }
        .circular-menu.cm-safe.circular-menu-left { right: auto; left: max(var(--cm-offset-x, 1em), env(safe-area-inset-left)); }
        .circular-menu.cm-safe.cm-top { bottom: auto; top: max(var(--cm-offset-y, 1em), env(safe-area-inset-top)); }
        .circular-menu .floating-btn { touch-action: manipulation; }
        .circular-menu .floating-btn ha-icon.close { display: none; }
        .circular-menu.active .floating-btn ha-icon.close { display: inline-block; }
        .circular-menu .floating-btn:focus-visible, .circular-menu .menu-item:focus-visible { outline: 2px solid var(--primary-text-color, currentColor); outline-offset: 2px; }
        .circular-menu .menu-item {
          top: var(--cm-item-offset, .2em); right: var(--cm-item-offset, .2em);
          visibility: hidden; pointer-events: none; touch-action: manipulation;
          transition: transform .3s ease, background .2s ease, visibility 0s .3s;
        }
        .circular-menu.active .menu-item:not([hidden]) {
          visibility: visible; pointer-events: auto;
          transition-delay: 0s; transform: translate(var(--x), var(--y));
        }
        .circular-menu .menu-item[hidden] { display: none; }
        .circular-menu::before {
          content: ''; display: block; position: absolute; top: 0; right: 0;
          width: var(--cm-button-size, 3.5em); height: var(--cm-button-size, 3.5em);
          border-radius: 50%; background: var(--cm-outer-color, var(--cm-menu-color, var(--primary-color)));
          z-index: -4; visibility: hidden; pointer-events: none;
          transition: transform .3s ease, visibility 0s .3s;
        }
        .circular-menu.active.cm-outer-open::before {
          visibility: visible; pointer-events: auto; transition-delay: 0s;
          transform: scale(var(--cm-outer-scale));
          transition-timing-function: cubic-bezier(0.68, 1.55, 0.265, 1);
        }
        .circular-menu .menu-item.cm-outer { z-index: -3; }
        .circular-menu.active:not(.cm-outer-open) .menu-item.cm-outer {
          visibility: hidden; pointer-events: none; transform: none; transition-delay: 0s, 0s, .3s;
        }
        .circular-menu .menu-item.cm-outer { background-color: var(--cm-item-background, rgba(0, 0, 0, 0.1)); }
        .circular-menu .menu-item.cm-outer:hover { background-color: rgba(0, 0, 0, 0.3); }
        .circular-menu .menu-item.cm-outer.active { background-color: var(--cm-active-color, var(--cm-item-active-color, var(--accent-color))); }
        .circular-menu .menu-item .cm-badge {
          position: absolute; top: -.25em; right: -.25em; border-radius: 1em; min-width: 1.3em;
          padding: 0 .25em; font-size: .7em; line-height: 1.4; text-align: center;
          color: var(--cm-badge-color, white); background: var(--cm-badge-background, var(--error-color, #db4437));
          box-sizing: border-box; pointer-events: none;
        }
        .circular-menu .cm-badge[hidden] { display: none; }
        .circular-menu.cm-custom-size .floating-btn,
        .circular-menu.cm-custom-size .menu-item { display: flex; align-items: center; justify-content: center; }
        .circular-menu.cm-custom-size .menu-item[hidden] { display: none; }
        .circular-menu.cm-custom-size.active .floating-btn ha-icon.close { display: inline-block; }
        .cm-error { position: fixed; bottom: 5em; right: 1em; max-width: min(24em, 85vw);
          background: var(--card-background-color, white); color: var(--error-color, #b00020);
          padding: .75em; border-radius: .5em; z-index: 1025; }
        .cm-error[hidden] { display: none; }
        @media (prefers-reduced-motion: reduce) {
          .circular-menu::before, .circular-menu::after, .circular-menu .menu-item,
          .circular-menu ha-icon { transition-duration: 0s !important; transition-delay: 0s !important; }
        }
`;
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = value => JSON.parse(JSON.stringify(value));
const list = value => Array.isArray(value) ? value : value == null ? [] : [value];
const positive = (value, fallback) => typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const emit = (target, type, detail) => target.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
function validate(config) {
  if (!record(config)) throw new Error('Circle Menu Card: configuration must be an object');
  if (config.position !== undefined && !POSITIONS.includes(config.position)) throw new Error('Invalid position');
  if (config.json_config !== undefined && typeof config.json_config !== 'string') throw new Error('json_config must be a URL');
  if (config.secondary !== undefined && !record(config.secondary)) throw new Error('secondary must be an object');
  if (config.secondary?.open !== undefined && !['auto', 'manual'].includes(config.secondary.open)) throw new Error('secondary.open must be auto or manual');
  for (const scope of [config, config.secondary].filter(Boolean)) {
    if (scope.items !== undefined && !Array.isArray(scope.items)) throw new Error('items must be an array');
    if (scope.positive_states !== undefined && !Array.isArray(scope.positive_states)) throw new Error('positive_states must be an array');
    for (const key of ['radius', 'item_size', 'button_size', 'opening_angle']) {
      if (scope[key] !== undefined && (!positive(scope[key], 0) || (key === 'opening_angle' && scope[key] > 180))) throw new Error('Invalid ' + key);
    }
    for (const item of scope.items || []) {
      if (!record(item)) throw new Error('Each menu item must be an object');
      if (item.positive_states !== undefined && !Array.isArray(item.positive_states)) throw new Error('Item positive_states must be an array');
      if (item.conditions !== undefined && !Array.isArray(item.conditions)) throw new Error('Item conditions must be an array');
      if (item.states !== undefined && !record(item.states)) throw new Error('Item states must be an object');
      for (const key of ['action', 'tap_action', 'hold_action', 'double_tap_action']) {
        if (item[key] !== undefined && (!record(item[key]) || !ACTIONS.includes(item[key].action))) throw new Error('Invalid item ' + key);
      }
    }
  }
  for (const key of ['tap_action', 'hold_action', 'double_tap_action']) {
    if (config[key] !== undefined && (!record(config[key]) || !ACTIONS.includes(config[key].action))) throw new Error('Invalid ' + key);
  }
  return config;
}
function angles(count, openingAngle) {
  if (!count) return [];
  // Preserve the exact v1 angles for every existing 1–4 item configuration.
  if (openingAngle === undefined && count <= 4) {
    const offset = [47, 6, -1, -7][count - 1];
    return Array.from({ length: count }, (_, i) => 140 / count * i - 90 + offset);
  }
  if (count === 1) return [-45];
  const span = openingAngle ?? 80;
  return Array.from({ length: count }, (_, i) => -45 - span / 2 + span * i / (count - 1));
}
function minimumRadius(values, diameter) {
  if (values.length < 2) return 0;
  const delta = Math.min(...values.slice(1).map((value, index) => Math.abs(value - values[index])));
  return (diameter + 4) / (2 * Math.sin(delta * Math.PI / 360));
}
function layout(count, scope, fallback, diameter, legacy) {
  const values = angles(count, scope.opening_angle);
  const requested = positive(scope.radius, fallback);
  const radius = legacy && scope.radius === undefined && scope.opening_angle === undefined && count <= 4
    ? fallback : Math.max(requested, minimumRadius(values, diameter));
  return { values, radius };
}
function entityIds(item) {
  const action = item.tap_action || item.action || {};
  return list(item.entity ?? action.entity ?? action.target?.entity_id ?? action.data?.entity_id ?? action.service_data?.entity_id)
    .filter(value => typeof value === 'string');
}
function matches(condition, states) {
  if (!record(condition)) return false;
  const type = condition.condition || 'state';
  if (type === 'and' || type === 'or' || type === 'not') {
    if (!Array.isArray(condition.conditions)) return false;
    const values = condition.conditions.map(child => matches(child, states));
    return type === 'and' ? values.every(Boolean) : type === 'or' ? values.some(Boolean) : !values.every(Boolean);
  }
  const ids = list(condition.entity);
  if (!ids.length) return false;
  return ids.every(id => {
    const state = states[id];
    if (!state) return false;
    const value = condition.attribute ? state.attributes?.[condition.attribute] : state.state;
    if (value === undefined) return false;
    if (type === 'state') {
      return (condition.state === undefined || list(condition.state).includes(value)) &&
        (condition.state_not === undefined || !list(condition.state_not).includes(value)) &&
        (condition.state !== undefined || condition.state_not !== undefined);
    }
    if (type === 'numeric_state') {
      const numeric = value === '' || value === null ? NaN : Number(value);
      return Number.isFinite(numeric) && (condition.above !== undefined || condition.below !== undefined) &&
        (condition.above === undefined || numeric > Number(condition.above)) &&
        (condition.below === undefined || numeric < Number(condition.below));
    }
    return false;
  });
}
function badgeValue(badge, states, defaults) {
  if (!record(badge)) return badge;
  if (Array.isArray(badge.entities)) {
    const positives = badge.positive_states || defaults;
    return badge.entities.filter(id => positives.includes(states[id]?.state)).length;
  }
  const state = states[badge.entity];
  return badge.entity ? (badge.attribute ? state?.attributes?.[badge.attribute] : state?.state) : badge.value;
}
function setVar(node, name, value) {
  if (value === undefined || value === null || value === '') node.style.removeProperty(name);
  else node.style.setProperty(name, String(value));
}
function length(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value + 'px' : undefined; }
function configureColors(node, config, mapping) {
  Object.entries(mapping).forEach(([key, variable]) => setVar(node, variable, config[key]));
}

class CircleMenuCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._localConfig = {};
    this._hass = null;
    this._entries = [];
    this._open = false;
    this._outer = false;
    this._timers = new Set();
    this._gestures = [];
    this._generation = 0;
    this._documentClick = event => {
      if (this._open && !event.composedPath().includes(this._menu)) this._close();
    };
    this._escape = event => {
      if (event.key === 'Escape' && this._open && event.composedPath().includes(this)) {
        this._close(); this._button?.focus(); event.stopPropagation();
      }
    };
    this._resize = () => this._layout();
  }
  connectedCallback() {
    document.addEventListener('click', this._documentClick);
    this.addEventListener('keydown', this._escape);
    window.addEventListener('resize', this._resize);
    if (this._config) {
      if (!this._menu) this._render();
      this._refresh();
      if (this._config.json_config && !this._loaded && !this._request) this._loadExternal();
    }
  }
  disconnectedCallback() {
    document.removeEventListener('click', this._documentClick);
    this.removeEventListener('keydown', this._escape);
    window.removeEventListener('resize', this._resize);
    this._cancelExternal();
    this._close();
    this._clearTimers();
  }
  setConfig(config) {
    validate(config);
    const next = clone(config);
    if (this._config && JSON.stringify(next) === JSON.stringify(this._config)) return;
    const previousUrl = this._config?.json_config;
    this._config = next;
    if (previousUrl !== next.json_config) {
      this._cancelExternal(); this._external = null; this._loaded = false;
    }
    this._localConfig = validate({ ...(this._external || {}), ...next });
    this._render();
    if (next.json_config && !this._loaded && !this._request) this._loadExternal();
  }
  _cancelExternal() {
    this._generation++;
    this._request?.abort();
    this._request = null;
  }
  async _loadExternal() {
    const generation = ++this._generation;
    const controller = new AbortController();
    this._request = controller;
    try {
      const response = await fetch(this._config.json_config, { signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const external = validate(await response.json());
      if (generation !== this._generation) return;
      const merged = validate({ ...external, ...this._config });
      this._external = external;
      this._localConfig = merged;
      this._loaded = true;
      this._render();
    } catch (error) {
      if (generation === this._generation && error.name !== 'AbortError') {
        this._error('Unable to load JSON configuration: ' + error.message);
      }
    } finally {
      if (generation === this._generation) this._request = null;
    }
  }
  _later(callback, delay) {
    const id = setTimeout(() => { this._timers.delete(id); callback(); }, delay);
    this._timers.add(id);
    return id;
  }
  _cancel(id) { if (id != null) { clearTimeout(id); this._timers.delete(id); } }
  _clearTimers() { this._timers.forEach(clearTimeout); this._timers.clear(); this._closeTimer = null; }
  _resetCloseTimer() {
    this._cancel(this._closeTimer); this._closeTimer = null;
    const delay = this._localConfig.auto_close;
    if (this._open && typeof delay === 'number' && delay > 0 && !this._hovering) {
      this._closeTimer = this._later(() => this._close(), delay);
    }
  }
  _close() {
    this._open = false; this._outer = false; this._hovering = false;
    this._cancel(this._closeTimer); this._closeTimer = null;
    for (const cancel of this._gestures) cancel(false);
    this._syncOpen();
  }
  _toggle() {
    if (this._open) { this._close(); return; }
    this._open = true;
    this._outer = Boolean(this._localConfig.secondary && this._localConfig.secondary.open !== 'manual');
    this._syncOpen(); this._resetCloseTimer();
  }
  _expand() {
    if (!this._localConfig.secondary) return;
    this._open = true; this._outer = !this._outer;
    this._syncOpen(); this._resetCloseTimer();
  }
  _syncOpen() {
    if (!this._menu) return;
    this._menu.classList.toggle('active', this._open);
    this._menu.classList.toggle('cm-outer-open', this._open && this._outer);
    this._button.setAttribute('aria-expanded', String(this._open));
    this._button.setAttribute('aria-label', this._open ? 'Close menu' : 'Open menu');
    for (const entry of this._entries) {
      const accessible = this._open && (!entry.outer || this._outer) && !entry.node.hidden;
      entry.node.tabIndex = accessible ? 0 : -1;
      entry.node.setAttribute('aria-hidden', String(!accessible));
    }
  }
  _render() {
    this._clearTimers();
    for (const cancel of this._gestures) cancel();
    this._gestures = []; this._open = false; this._outer = false; this._hovering = false;
    const config = this._localConfig;
    const style = element('style', null, CSS_TEXT);
    this._menu = element('div', 'circular-menu');
    this._menu.id = 'circularMenu';
    this._position = config.position || (config.left ? 'bottom-left' : 'bottom-right');
    this._menu.classList.toggle('circular-menu-left', this._position.endsWith('left'));
    this._menu.classList.toggle('cm-top', this._position.startsWith('top'));
    this._menu.classList.toggle('cm-safe', config.safe_area === true);
    this._menu.classList.toggle('cm-custom-size', config.button_size !== undefined || config.item_size !== undefined || config.secondary?.item_size !== undefined);
    configureColors(this._menu, config, {
      button_color: '--cm-button-color', icon_color: '--cm-icon-color',
      menu_background_color: '--cm-menu-color', item_active_color: '--cm-item-active-color',
      item_background_color: '--cm-item-background',
    });
    setVar(this._menu, '--cm-outer-color', config.secondary?.menu_background_color);
    setVar(this._menu, '--cm-offset-x', length(config.offset_x));
    setVar(this._menu, '--cm-offset-y', length(config.offset_y));
    setVar(this._menu, '--cm-button-size', length(config.button_size));
    this._button = element('a', 'floating-btn');
    this._button.setAttribute('role', 'button'); this._button.tabIndex = 0;
    if (config.secondary?.swipe_to_expand === true) this._button.style.touchAction = 'none';
    const icon = element('ha-icon', 'icon');
    icon.setAttribute('icon', config.icon || 'mdi:menu');
    const closeIcon = element('ha-icon', 'close');
    closeIcon.setAttribute('icon', config.close_icon || 'mdi:close');
    this._button.append(icon, closeIcon);
    this._wrapper = element('menu', 'items-wrapper');
    this._wrapper.setAttribute('aria-label', 'Menu actions');
    this._menu.append(this._button, this._wrapper);
    this._errorNode = element('div', 'cm-error');
    this._errorNode.setAttribute('role', 'alert'); this._errorNode.hidden = true;
    this.shadowRoot.replaceChildren(style, this._menu, this._errorNode);
    this._entries = [];
    for (const [scope, outer] of [[config.secondary, true], [config, false]]) {
      if (!scope) continue;
      (scope.items || []).forEach((item, index) => this._addItem(item, scope, outer, index));
    }
    this._bindGesture(this._button, config, action => this._runAction(action || { action: 'menu' }, config, true), config.secondary?.swipe_to_expand === true);
    this._wrapper.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse') return;
      this._hovering = true; this._resetCloseTimer();
    });
    this._wrapper.addEventListener('pointerleave', event => {
      if (event.pointerType !== 'mouse') return;
      this._hovering = false; this._resetCloseTimer();
    });
    this._menu.addEventListener('click', event => event.stopPropagation());
    this._refresh();
  }
  _addItem(item, scope, outer, index) {
    const node = element('div', 'menu-item' + (outer ? ' cm-outer' : ''));
    node.setAttribute('role', 'button');
    const icon = element('ha-icon');
    const badge = element('span', 'cm-badge'); badge.hidden = true;
    node.append(icon, badge);
    const entry = { node, icon, badge, item, scope, outer, index };
    this._entries.push(entry);
    this._wrapper.append(node);
    this._bindGesture(node, item, action => this._runAction(action, item, false));
  }
  _bindGesture(node, config, run, swipe = false) {
    let holdTimer = null, tapTimer = null, start = null, held = false, suppress = false;
    const tap = config.tap_action || config.action;
    const hold = config.hold_action;
    const double = config.double_tap_action;
    const cancelHold = () => { this._cancel(holdTimer); holdTimer = null; start = null; };
    const cancel = (reset = true) => {
      cancelHold(); this._cancel(tapTimer); tapTimer = null;
      if (reset) { held = false; suppress = false; }
    };
    this._gestures.push(cancel);
    node.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      cancelHold(); held = false; suppress = false; start = [event.clientX, event.clientY];
      if (swipe && node.setPointerCapture) { try { node.setPointerCapture(event.pointerId); } catch (_) { /* Synthetic pointer events have no active capture. */ } }
      if (hold && hold.action !== 'none') {
        holdTimer = this._later(() => {
          holdTimer = null; held = true;
          this._cancel(tapTimer); tapTimer = null;
          run(hold);
        }, 500);
      }
    });
    node.addEventListener('pointermove', event => {
      if (!start) return;
      const dx = event.clientX - start[0], dy = event.clientY - start[1];
      if (Math.hypot(dx, dy) <= 12) return;
      suppress = true;
      this._cancel(holdTimer); holdTimer = null;
      if (swipe) {
        const inwardX = dx * (this._position.endsWith('left') ? 1 : -1);
        const inwardY = dy * (this._position.startsWith('top') ? 1 : -1);
        if ((inwardX + inwardY) / Math.SQRT2 >= 30) {
          this._cancel(tapTimer); tapTimer = null; start = null;
          this._open = true; this._outer = true;
          this._syncOpen(); this._resetCloseTimer();
        }
      } else start = null;
    });
    node.addEventListener('pointerup', cancelHold);
    node.addEventListener('pointercancel', () => { suppress = true; cancelHold(); });
    node.addEventListener('pointerleave', cancelHold);
    if (hold && hold.action !== 'none') node.addEventListener('contextmenu', event => event.preventDefault());
    node.addEventListener('click', event => {
      event.stopPropagation();
      if (held || suppress) { held = false; suppress = false; return; }
      if (!double || double.action === 'none' || event.detail === 0) { run(tap); return; }
      if (tapTimer !== null) {
        this._cancel(tapTimer); tapTimer = null; run(double);
      } else {
        tapTimer = this._later(() => { tapTimer = null; run(tap); }, 260);
      }
    });
    node.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
        event.preventDefault(); event.stopPropagation(); run(tap);
      }
    });
  }
  async _runAction(action, item, main) {
    if (!action || !this.isConnected) return;
    if (action.action === 'none') return;
    if (!main) {
      const entry = this._entries.find(entry => entry.item === item);
      if (!entry || entry.node.hidden || !this._open || (entry.outer && !this._outer)) return;
    }
    try {
      if (action.confirmation) {
        const confirmation = action.confirmation;
        const exempt = record(confirmation) && list(confirmation.exemptions).some(value => value.user === this._hass?.user?.id);
        if (!exempt && !window.confirm(confirmation.text || 'Are you sure?')) return;
      }
      const feedback = item.haptic ?? this._localConfig.haptic;
      if (feedback) emit(this, 'haptic', feedback === true ? 'light' : feedback);
      switch (action.action) {
        case 'menu': this._toggle(); return;
        case 'expand': this._expand(); return;
        case 'navigate': {
          if (!action.navigation_path) throw new Error('navigation_path is required');
          const url = new URL(action.navigation_path, location.href);
          if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) throw new Error('Navigation must stay within Home Assistant');
          history[action.navigation_replace ? 'replaceState' : 'pushState'](null, '', action.navigation_path);
          window.dispatchEvent(new Event('location-changed', { bubbles: true, composed: true }));
          break;
        }
        case 'call-service':
        case 'perform-action': {
          const name = action.action === 'call-service' ? action.service : action.perform_action;
          if (typeof name !== 'string' || !/^[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+$/.test(name)) throw new Error('Invalid service/action name');
          if (!this._hass?.callService) throw new Error('Home Assistant is not connected');
          const [domain, service] = name.split('.');
          const data = action.action === 'call-service' ? action.service_data || action.data || {} : action.data || {};
          if (action.target !== undefined) await this._hass.callService(domain, service, data, action.target);
          else await this._hass.callService(domain, service, data);
          break;
        }
        case 'toggle': {
          const entity = action.entity ?? item.entity;
          if (!entity) throw new Error('An entity is required for toggle');
          if (!this._hass?.callService) throw new Error('Home Assistant is not connected');
          await this._hass.callService('homeassistant', 'toggle', { entity_id: entity });
          break;
        }
        case 'more-info': {
          const entityId = action.entity ?? item.entity;
          if (typeof entityId !== 'string') throw new Error('An entity is required for more-info');
          emit(this, 'hass-more-info', { entityId });
          break;
        }
        case 'url': {
          if (!action.url_path) throw new Error('url_path is required');
          const url = new URL(action.url_path, location.href);
          if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid URL protocol');
          window.open(url.href, '_blank', 'noopener,noreferrer');
          break;
        }
        default: throw new Error('Unsupported action: ' + action.action);
      }
      if (item.close_on_action ?? this._localConfig.close_on_action) this._close();
      else this._resetCloseTimer();
    } catch (error) {
      this._error(error.message || String(error));
      this._resetCloseTimer();
    }
  }
  _error(message) {
    if (this._errorNode) {
      this._errorNode.textContent = message; this._errorNode.hidden = false;
      this._cancel(this._errorTimer);
      this._errorTimer = this._later(() => { if (this._errorNode) this._errorNode.hidden = true; }, 6000);
    }
    console.warn('[Circle Menu Card]', message);
  }
  set hass(hass) { this._hass = hass; this._refresh(); }
  _refresh() {
    if (!this._menu) return;
    const states = this._hass?.states || {};
    for (const entry of this._entries) {
      const { item, scope, node, icon, badge } = entry;
      const ids = entityIds(item);
      const positives = item.positive_states || scope.positive_states || this._localConfig.positive_states || POSITIVE_STATES;
      const state = states[ids[0]]?.state;
      const override = state !== undefined && own(item.states || {}, state) && record(item.states[state]) ? item.states[state] : {};
      node.hidden = !(item.conditions || []).every(condition => matches(condition, states));
      node.classList.toggle('active', ids.some(id => positives.includes(states[id]?.state)));
      node.title = override.alt || item.alt || 'Item ' + (entry.index + 1);
      node.setAttribute('aria-label', node.title);
      icon.setAttribute('icon', override.icon || item.icon || states[ids[0]]?.attributes?.icon || 'mdi:circle-outline');
      setVar(node, '--cm-item-icon-color', override.icon_color ?? item.icon_color ?? (entry.outer ? scope.icon_color : undefined));
      setVar(node, '--cm-item-background', override.background_color ?? item.background_color ?? scope.item_background_color);
      setVar(node, '--cm-active-color', override.background_color ?? item.active_color ?? scope.item_active_color);
      const badgeConfig = own(override, 'badge') ? override.badge : item.badge;
      const value = badgeValue(badgeConfig, states, positives);
      badge.hidden = value === undefined || value === null || value === false || value === '' || (record(badgeConfig) && badgeConfig.hide_zero && Number(value) === 0);
      badge.textContent = badge.hidden ? '' : String(value);
      setVar(node, '--cm-badge-color', record(badgeConfig) ? badgeConfig.color : undefined);
      setVar(node, '--cm-badge-background', record(badgeConfig) ? badgeConfig.background_color : undefined);
    }
    this._layout(); this._syncOpen();
  }
  _layout() {
    if (!this._menu) return;
    const config = this._localConfig;
    const font = parseFloat(getComputedStyle(this._menu).fontSize) || 16;
    const button = positive(config.button_size, 3.5 * font);
    const diameter = positive(config.item_size, 3 * font);
    const outerDiameter = positive(config.secondary?.item_size, diameter);
    const inner = this._entries.filter(entry => !entry.outer && !entry.node.hidden);
    const outer = this._entries.filter(entry => entry.outer && !entry.node.hidden);
    const first = layout(inner.length, config, 7 * font, diameter, config.item_size === undefined);
    const innerMargin = Math.max(1.125 * font, button / 2 - diameter / 2);
    const firstEdge = Math.max(button / 2, first.radius + diameter / 2 + innerMargin);
    // Keep outer hit targets outside the inner disk, even with customized diameters.
    const outerMinimum = firstEdge + outerDiameter / 2 + 4;
    const outerScope = { opening_angle: 80, ...(config.secondary || {}) };
    const second = layout(outer.length, { ...outerScope, radius: Math.max(positive(outerScope.radius, 11.5 * font), outerMinimum) }, outerMinimum, outerDiameter, false);
    const secondEdge = second.radius + outerDiameter / 2 + innerMargin;
    setVar(this._menu, '--cm-inner-scale', firstEdge * 2 / button);
    setVar(this._menu, '--cm-outer-scale', secondEdge * 2 / button);
    for (const [entries, ring, size] of [[inner, first, diameter], [outer, second, outerDiameter]]) {
      entries.forEach((entry, index) => {
        const angle = ring.values[index] * Math.PI / 180;
        const x = ring.radius * Math.cos(angle) * (this._position.endsWith('left') ? 1 : -1);
        const y = ring.radius * Math.sin(angle) * (this._position.startsWith('top') ? -1 : 1);
        setVar(entry.node, '--x', x + 'px'); setVar(entry.node, '--y', y + 'px');
        if (config.button_size !== undefined || config.item_size !== undefined || entry.scope.item_size !== undefined) {
          setVar(entry.node, '--cm-item-size', size + 'px');
          setVar(entry.node, '--cm-item-offset', (button - size) / 2 - .05 * font + 'px');
        }
      });
    }
  }
  getCardSize() { return 0; }
  static getStubConfig() {
    return { left: false, icon: 'mdi:menu', items: [{ icon: 'mdi:lightbulb', alt: 'Light Control', action: { action: 'call-service', service: 'light.turn_on', service_data: { entity_id: 'light.living_room' } } }] };
  }
  static getConfigElement() { return document.createElement('circle-menu-card-editor'); }
}

class CircleMenuCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  set hass(hass) {
    this._hass = hass;
    for (const selector of this.shadowRoot.querySelectorAll('ha-selector')) selector.hass = hass;
  }
  setConfig(config) {
    if (this._config && JSON.stringify(config) === JSON.stringify(this._config)) return;
    this._config = clone(config);
    this._render();
  }
  connectedCallback() {
    if (this._config) this._render();
    if (!customElements.get('ha-selector')) {
      customElements.whenDefined('ha-selector').then(() => { if (this.isConnected && this._config) this._render(); });
    }
  }
  _change(path, value, rebuild = false) {
    const next = clone(this._config);
    let target = next;
    for (const key of path.slice(0, -1)) target = target[key];
    const key = path[path.length - 1];
    if (value === undefined || value === '') delete target[key]; else target[key] = value;
    try { validate(next); } catch (error) { this._error.textContent = error.message; return; }
    this._error.textContent = '';
    this._config = next;
    emit(this, 'config-changed', { config: clone(next) });
    if (rebuild) this._render();
  }
  _value(path) { return path.reduce((target, key) => target?.[key], this._config); }
  _field(parent, path, label, options = {}) {
    const value = this._value(path);
    const row = element('label', 'field');
    row.append(element('span', null, label));
    let input;
    if (options.selector && customElements.get('ha-selector')) {
      input = element('ha-selector');
      input.hass = this._hass; input.selector = options.selector;
      input.value = options.displayValue !== undefined ? options.displayValue : value; input.label = label;
      input.addEventListener('value-changed', event => {
        event.stopPropagation();
        this._change(path, event.detail.value, options.rebuild);
      });
    } else if (options.choices) {
      input = element('select');
      for (const [key, title] of options.choices) {
        const option = element('option', null, title); option.value = key; input.append(option);
      }
      input.value = value ?? options.defaultValue ?? '';
      input.addEventListener('change', () => this._change(path, input.value || undefined, options.rebuild));
    } else if (options.json) {
      input = element('textarea');
      input.rows = 3;
      input.value = value === undefined ? '' : JSON.stringify(value, null, 2);
      input.addEventListener('change', () => {
        try { this._change(path, input.value.trim() ? JSON.parse(input.value) : undefined, options.rebuild); }
        catch (error) { this._error.textContent = 'Invalid JSON: ' + error.message; }
      });
    } else {
      input = element('input');
      input.type = options.type || 'text';
      if (options.type === 'number') { input.min = '0'; input.step = 'any'; }
      if (options.type === 'checkbox') input.checked = value === true;
      else input.value = value ?? '';
      input.addEventListener('change', () => this._change(path, options.type === 'checkbox' ? input.checked : options.type === 'number' ? (input.value === '' ? undefined : Number(input.value)) : input.value, options.rebuild));
    }
    row.append(input);
    if (options.color) {
      const picker = element('input'); picker.type = 'color';
      picker.setAttribute('aria-label', label + ' color picker');
      picker.value = /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#3498db';
      picker.addEventListener('change', () => { input.value = picker.value; this._change(path, picker.value); });
      row.append(picker);
    }
    parent.append(row);
  }
  _button(parent, title, action) {
    const button = element('button', null, title); button.type = 'button'; button.addEventListener('click', action); parent.append(button);
  }
  _action(parent, path, label) {
    const value = this._value(path);
    const custom = value?.action === 'menu' || value?.action === 'expand';
    if (!custom && customElements.get('ha-selector')) {
      const displayValue = value?.action === 'call-service'
        ? { ...value, action: 'perform-action', perform_action: value.service, data: value.service_data || value.data }
        : value;
      this._field(parent, path, label, { selector: { ui_action: { actions: HA_ACTIONS } }, json: true, displayValue });
      this._button(parent, 'Use custom action', () => this._change(path, { action: 'expand' }, true));
    } else {
      this._field(parent, path, label + ' (JSON)', { json: true });
      if (customElements.get('ha-selector')) this._button(parent, 'Use Home Assistant action selector', () => this._change(path, { action: 'none' }, true));
    }
  }
  _items(parent, path) {
    const items = this._value(path) || [];
    items.forEach((item, index) => {
      const itemPath = [...path, index];
      const panel = element('details');
      panel.open = false;
      panel.append(element('summary', null, (index + 1) + '. ' + (item.alt || item.icon || 'Menu item')));
      this._field(panel, [...itemPath, 'icon'], 'Icon', { selector: { icon: {} } });
      this._field(panel, [...itemPath, 'alt'], 'Label');
      this._field(panel, [...itemPath, 'entity'], 'Entity', { selector: { entity: {} } });
      for (const key of ['icon_color', 'background_color', 'active_color']) this._field(panel, [...itemPath, key], key, { color: true });
      for (const key of ['close_on_action', 'haptic']) this._field(panel, [...itemPath, key], key + ' (JSON: true/false or blank to inherit)', { json: true });
      this._action(panel, [...itemPath, own(item, 'tap_action') ? 'tap_action' : 'action'], 'Tap action');
      this._action(panel, [...itemPath, 'hold_action'], 'Hold action');
      this._action(panel, [...itemPath, 'double_tap_action'], 'Double-tap action');
      for (const key of ['conditions', 'states', 'badge', 'positive_states']) this._field(panel, [...itemPath, key], key, { json: true });
      const actions = element('div', 'buttons');
      if (index > 0) this._button(actions, '↑ Move up', () => { const next = [...this._value(path)]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; this._change(path, next, true); });
      if (index < items.length - 1) this._button(actions, '↓ Move down', () => { const next = [...this._value(path)]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; this._change(path, next, true); });
      this._button(actions, 'Remove', () => this._change(path, this._value(path).filter((_, i) => i !== index), true));
      panel.append(actions); parent.append(panel);
    });
    this._button(parent, 'Add item', () => this._change(path, [...(this._value(path) || []), { icon: 'mdi:circle-outline', action: { action: 'none' } }], true));
  }
  _ring(parent, path, outer) {
    for (const key of ['menu_background_color', 'item_background_color', 'item_active_color', 'icon_color']) this._field(parent, [...path, key], key, { color: true });
    for (const key of ['radius', 'item_size', 'opening_angle']) this._field(parent, [...path, key], key + (key === 'opening_angle' ? ' (degrees)' : ' (px)'), { type: 'number' });
    this._field(parent, [...path, 'positive_states'], 'Positive states (JSON)', { json: true });
    this._items(parent, [...path, 'items']);
  }
  _render() {
    if (!this._config) return;
    const style = element('style', null, ':host{display:block}.field{display:grid;gap:4px;margin:8px 0}input,select,textarea,button{font:inherit;color:var(--primary-text-color);background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:6px;padding:8px;box-sizing:border-box;max-width:100%}input[type=checkbox]{width:auto;justify-self:start}textarea{width:100%}button{cursor:pointer}details{padding:10px;border:1px solid var(--divider-color);border-radius:8px;margin:8px 0}summary{cursor:pointer;font-weight:600}.buttons{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.error{color:var(--error-color)}');
    const root = element('div');
    this._error = element('div', 'error'); this._error.setAttribute('role', 'alert'); root.append(this._error);
    this._field(root, ['json_config'], 'External JSON URL');
    this._field(root, ['icon'], 'Main icon', { selector: { icon: {} } });
    this._field(root, ['close_icon'], 'Close icon', { selector: { icon: {} } });
    this._field(root, ['position'], 'Position', { choices: [['', 'Legacy left setting'], ...POSITIONS.map(value => [value, value])] });
    this._field(root, ['left'], 'Legacy left position', { type: 'checkbox' });
    for (const key of ['button_color']) this._field(root, [key], key, { color: true });
    for (const key of ['button_size', 'offset_x', 'offset_y', 'auto_close']) this._field(root, [key], key + (key === 'auto_close' ? ' (ms)' : ' (px)'), { type: 'number' });
    for (const key of ['safe_area', 'close_on_action', 'haptic']) this._field(root, [key], key, { type: 'checkbox' });
    const gestures = element('details'); gestures.append(element('summary', null, 'Main button actions'));
    for (const key of ['tap_action', 'hold_action', 'double_tap_action']) this._action(gestures, [key], key);
    root.append(gestures);
    const inner = element('details'); inner.open = true; inner.append(element('summary', null, 'Inner ring'));
    this._ring(inner, [], false); root.append(inner);
    const outer = element('details'); outer.open = Boolean(this._config.secondary); outer.append(element('summary', null, 'Outer ring'));
    if (this._config.secondary) {
      this._field(outer, ['secondary', 'open'], 'Opening mode', { choices: [['auto', 'Together with inner ring'], ['manual', 'Expand action']], defaultValue: 'auto' });
      this._field(outer, ['secondary', 'swipe_to_expand'], 'Swipe inward to open outer ring', { type: 'checkbox' });
      this._ring(outer, ['secondary'], true);
      this._button(outer, 'Remove outer ring', () => this._change(['secondary'], undefined, true));
    } else this._button(outer, 'Add outer ring', () => this._change(['secondary'], { open: 'auto', items: [] }, true));
    root.append(outer);
    this.shadowRoot.replaceChildren(style, root);
  }
}
if (!customElements.get('circle-menu-card')) customElements.define('circle-menu-card', CircleMenuCard);
if (!customElements.get('circle-menu-card-editor')) customElements.define('circle-menu-card-editor', CircleMenuCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === 'circle-menu-card')) window.customCards.push({
  type: 'circle-menu-card', name: 'Circle Menu Card',
  description: 'A customizable floating circular menu card with actions.', preview: false,
  documentationURL: 'https://github.com/BRUNOsys-UG/circle-menu-card'
});
console.info('%c  CIRCLE-MENU-CARD  \n%c   Version: ' + VERSION + '   ', 'color: white; background: #3498db; font-weight: bold; padding: 5px 0;', 'color: white; background: #333; font-weight: bold; padding: 5px 0;');
})();
