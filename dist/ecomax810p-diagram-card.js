// ecoMAX810P Diagram Card (dependency-free build)
// This file is kept in dist/ for convenience; HACS loads the root file:
//   ecomax810p-diagram-card.js
// Source of truth: src/

const assertConfig = (config) => {
  if (!config || typeof config !== "object") throw new Error("Invalid config");
  if (!config.type || typeof config.type !== "string") throw new Error("Missing `type`");
  if (!config.entities || typeof config.entities !== "object") throw new Error("Missing `entities`");
};

const stateOf = (hass, entityId) => (entityId ? hass.states?.[entityId]?.state : undefined);
const numState = (hass, entityId) => {
  const s = stateOf(hass, entityId);
  if (s == null) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const fmtTemp = (n) => (n == null ? "---" : `${Math.round(n)}°C`);
const fmtPct = (n) => (n == null ? "---" : `${Math.round(n)}%`);
const isOn = (hass, entityId) => stateOf(hass, entityId) === "on";

const computeValues = (hass, entities) => {
  const outside = fmtTemp(numState(hass, entities.outside_temperature));
  const boilerNow = fmtTemp(numState(hass, entities.boiler_temperature));
  const boilerTarget = fmtTemp(numState(hass, entities.boiler_target_temperature));
  const mixerNow = fmtTemp(numState(hass, entities.mixer_temperature));
  const mixerTarget = fmtTemp(numState(hass, entities.mixer_target_temperature));
  const dhwNow = fmtTemp(numState(hass, entities.dhw_temperature));
  const dhwTarget = fmtTemp(numState(hass, entities.dhw_target_temperature));

  const boilerLoad = fmtPct(numState(hass, entities.boiler_load));
  const fuelLevel = fmtPct(numState(hass, entities.fuel_level));
  const fanPower = fmtPct(numState(hass, entities.fan_power));
  const opMode = stateOf(hass, entities.state) ?? "---";

  return {
    outside,
    boilerNow,
    boilerTarget,
    mixerNow,
    mixerTarget,
    dhwNow,
    dhwTarget,
    boilerLoad,
    fuelLevel,
    fanPower,
    opMode,
    alertOn: isOn(hass, entities.alert),
    heatingPump: isOn(hass, entities.heating_pump_running),
    dhwPump: isOn(hass, entities.dhw_pump_running),
    mixerPump: isOn(hass, entities.mixer_pump_running)
  };
};

const renderDiagramSvg = (v) => {
  const heatingActive = v.heatingPump;
  const dhwActive = v.dhwPump;
  const mixerActive = v.mixerPump;

  return `
<svg class="ecomax" viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX boiler diagram">
  <defs>
    <linearGradient id="tankGradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,80,80,0.85)"/>
      <stop offset="55%" stop-color="rgba(80,160,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,170,255,0.85)"/>
    </linearGradient>
  </defs>

  <g class="pill pill--blue" transform="translate(610 55)">
    <rect x="-85" y="-18" rx="18" ry="18" width="170" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.outside}</text>
  </g>

  <g transform="translate(350 410)">
    <rect class="device" x="-70" y="-110" width="140" height="220" rx="8"></rect>
    <rect class="deviceScreen" x="-18" y="-92" width="46" height="26" rx="3"></rect>
    <circle class="deviceIcon" cx="-40" cy="-80" r="10"></circle>
  </g>

  <g transform="translate(980 430)">
    <rect class="tank" x="-85" y="-140" width="170" height="280" rx="70"></rect>
    <rect class="tankFill" x="-80" y="-135" width="160" height="270" rx="65"></rect>
  </g>

  <path class="pipe pipe--hot ${heatingActive ? "pipe--active" : ""}" d="M420 390 H720 V250" />
  <path class="pipe pipe--cold ${heatingActive ? "pipe--active" : ""}" d="M420 500 H720 V610 H1030" />

  <path class="pipe pipe--hot ${mixerActive ? "pipe--active" : ""}" d="M720 250 V180 H820" />
  <path class="pipe pipe--cold ${mixerActive ? "pipe--active" : ""}" d="M820 180 V250" />

  <path class="pipe pipe--hot ${dhwActive ? "pipe--active" : ""}" d="M720 420 H860" />
  <path class="pipe pipe--hot ${dhwActive ? "pipe--active" : ""}" d="M860 420 H895" />
  <path class="pipe pipe--cold ${dhwActive ? "pipe--active" : ""}" d="M1030 610 H895 V540" />

  <g class="pill pill--purple" transform="translate(480 350)">
    <rect x="-60" y="-18" rx="18" ry="18" width="120" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.boilerNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(480 392)">
    <rect x="-60" y="-16" rx="16" ry="16" width="120" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.boilerTarget}</text>
  </g>

  <g class="pill pill--purple" transform="translate(770 245)">
    <rect x="-60" y="-18" rx="18" ry="18" width="120" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.mixerNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(770 287)">
    <rect x="-60" y="-16" rx="16" ry="16" width="120" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.mixerTarget}</text>
  </g>

  <g class="pill pill--purple" transform="translate(960 355)">
    <rect x="-60" y="-18" rx="18" ry="18" width="120" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.dhwNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(960 397)">
    <rect x="-60" y="-16" rx="16" ry="16" width="120" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.dhwTarget}</text>
  </g>

  <g class="leftPanel" transform="translate(140 220)">
    <rect class="panel" x="-130" y="-200" width="260" height="460" rx="10"></rect>
    <text class="panelTitle" x="0" y="-170" text-anchor="middle">ecoMAX810P</text>

    <g transform="translate(0 -110)">
      <text class="panelLabel" x="0" y="-18" text-anchor="middle">Operation mode</text>
      <text class="panelValue" x="0" y="18" text-anchor="middle">${v.opMode}</text>
    </g>

    <g transform="translate(0 -30)">
      <text class="panelLabel" x="0" y="-18" text-anchor="middle">Boiler output</text>
      <text class="panelValue" x="0" y="18" text-anchor="middle">${v.boilerLoad}</text>
    </g>

    <g transform="translate(0 50)">
      <text class="panelLabel" x="0" y="-18" text-anchor="middle">Fuel level</text>
      <text class="panelValue" x="0" y="18" text-anchor="middle">${v.fuelLevel}</text>
    </g>

    <g transform="translate(0 130)">
      <text class="panelLabel" x="0" y="-18" text-anchor="middle">Fan output</text>
      <text class="panelValue" x="0" y="18" text-anchor="middle">${v.fanPower}</text>
    </g>

    ${v.alertOn ? `<g transform="translate(0 200)"><text class="panelAlert" x="0" y="0" text-anchor="middle">ALERT</text></g>` : ""}
  </g>
</svg>
`.trim();
};

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

class EcoMax810pDiagramCard extends HTMLElement {
  constructor() {
    super();
    this._hass = undefined;
    this._config = undefined;
    this._ro = undefined;
    this._width = 0;
  }

  setConfig(config) {
    assertConfig(config);
    this._config = {
      show_left_panel: true,
      scale: 1,
      layout: "auto",
      breakpoint: 700,
      ...config
    };
    this._render();
  }

  getCardSize() {
    return 6;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._ro) {
      this._ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width ?? 0;
        if (Math.abs(w - this._width) < 1) return;
        this._width = w;
        this._render();
      });
      this._ro.observe(this);
    }
    this._render();
  }

  disconnectedCallback() {
    this._ro?.disconnect();
    this._ro = undefined;
  }

  _isNarrow() {
    const layout = this._config?.layout ?? "auto";
    if (layout === "mobile") return true;
    if (layout === "desktop") return false;
    const bp = this._config?.breakpoint ?? 700;
    const w = this._width || this.getBoundingClientRect().width || 0;
    return w > 0 ? w < bp : false;
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._config || !this._hass) {
      this.shadowRoot.innerHTML = `<style>:host{display:block}</style>`;
      return;
    }

    const { title, entities, scale, show_left_panel } = this._config;
    const narrow = this._isNarrow();
    if (narrow) this.setAttribute("data-narrow", "");
    else this.removeAttribute("data-narrow");

    const v = computeValues(this._hass, entities);
    const svg = renderDiagramSvg(v);
    const headerAttr = title ? ` header="${esc(title)}"` : "";
    const wrapClass = show_left_panel ? "wrap" : "wrap noLeft";
    const scaleVal = Number.isFinite(scale) ? String(scale) : "1";
    const xOffsetVal = narrow ? "-160px" : "0px";

    this.shadowRoot.innerHTML = `
<style>
  :host{display:block}
  .wrap{padding:12px}
  .svg{transform:translateX(var(--xOffset,0px)) scale(var(--scale,1));transform-origin:top left;width:100%;overflow:hidden}
  .ecomax{width:100%;height:auto;font-family:var(--paper-font-body1_-_font-family,system-ui)}

  .device{fill:rgba(240,240,240,.95);stroke:rgba(120,120,120,.35);stroke-width:2}
  .deviceScreen{fill:rgba(40,40,40,.9)}
  .deviceIcon{fill:rgba(255,90,90,.9)}

  .tank{fill:rgba(245,245,245,.95);stroke:rgba(120,120,120,.35);stroke-width:2}
  .tankFill{fill:url(#tankGradient);opacity:.95}

  .pipe{fill:none;stroke-width:8;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
  .pipe--hot{stroke:rgba(220,40,40,.95)}
  .pipe--cold{stroke:rgba(0,150,220,.95)}
  .pipe--active{stroke-dasharray:10 12;animation:dash .9s linear infinite;filter:drop-shadow(0 0 2px rgba(255,255,255,.35))}
  @keyframes dash{to{stroke-dashoffset:-44}}

  .pill rect{fill:rgba(78,78,120,.92);stroke:rgba(255,255,255,.25);stroke-width:1}
  .pill text{fill:rgba(255,255,255,.95);font-size:22px;font-weight:600}
  .pill--sub rect{opacity:.75}
  .pill--sub text{font-size:18px;opacity:.92}
  .pill--blue rect{fill:rgba(0,170,220,.92)}

  .leftPanel .panel{fill:rgba(255,255,255,.92);stroke:rgba(78,78,120,.6);stroke-width:3}
  .leftPanel .panelTitle{fill:rgba(78,78,120,.95);font-size:26px;font-weight:700}
  .leftPanel .panelLabel{fill:rgba(0,0,0,.72);font-size:16px;font-weight:600}
  .leftPanel .panelValue{fill:rgba(78,78,120,.95);font-size:24px;font-weight:800;text-transform:capitalize}
  .leftPanel .panelAlert{fill:rgba(220,40,40,.95);font-size:22px;font-weight:900;letter-spacing:2px}

  :host([data-narrow]) .leftPanel{display:none}
  :host([data-narrow]) .pill text{font-size:18px}
  :host([data-narrow]) .pill--sub text{font-size:15px}
</style>
<ha-card${headerAttr}>
  <div class="${wrapClass}" style="--scale:${esc(scaleVal)};--xOffset:${esc(xOffsetVal)};">
    <div class="svg">${svg}</div>
  </div>
</ha-card>
    `.trim();
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ecomax810p-diagram-card",
  name: "ecoMAX810P Diagram Card",
  description: "Boiler+mixer diagram with animated flow indicators"
});

if (!customElements.get("ecomax810p-diagram-card")) {
  customElements.define("ecomax810p-diagram-card", EcoMax810pDiagramCard);
}


