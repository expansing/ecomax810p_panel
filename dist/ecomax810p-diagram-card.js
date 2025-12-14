// ecoMAX810P Diagram Card (dependency-free build)
// Convenience copy of the HACS-loaded file at repo root:
//   ecomax810p-diagram-card.js
//
// Source of truth (for contributors): src/

const assertConfig = (config) => {
  if (!config || typeof config !== "object") throw new Error("Invalid config");
  if (!config.type || typeof config.type !== "string") throw new Error("Missing `type`");
  if (!config.entities || typeof config.entities !== "object") throw new Error("Missing `entities`");
};

const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const yesNo = (b) => (b ? "On" : "Off");

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
  const exhaustTemp = fmtTemp(numState(hass, entities.exhaust_temperature));
  const feederTemp = fmtTemp(numState(hass, entities.feeder_temperature));
  const o2 = fmtPct(numState(hass, entities.oxygen_level));

  const boilerLoad = fmtPct(numState(hass, entities.boiler_load));
  const fuelLevel = fmtPct(numState(hass, entities.fuel_level));
  const fanPower = fmtPct(numState(hass, entities.fan_power));
  const opMode = stateOf(hass, entities.state) ?? "---";

  const summerMode = stateOf(hass, entities.summer_mode) ?? "---";
  const mixerMode = stateOf(hass, entities.mixer_work_mode) ?? "---";
  const waterHeaterMode = stateOf(hass, entities.water_heater) ?? "---";

  return {
    outside,
    boilerNow,
    boilerTarget,
    mixerNow,
    mixerTarget,
    dhwNow,
    dhwTarget,
    exhaustTemp,
    feederTemp,
    o2,
    boilerLoad,
    fuelLevel,
    fanPower,
    opMode,
    summerMode,
    mixerMode,
    waterHeaterMode,
    alertOn: isOn(hass, entities.alert),
    heatingPump: isOn(hass, entities.heating_pump_running),
    dhwPump: isOn(hass, entities.dhw_pump_running),
    mixerPump: isOn(hass, entities.mixer_pump_running),
    circulationPump: isOn(hass, entities.circulation_pump_running),
    fanRunning: isOn(hass, entities.fan_running),
    exhaustFanRunning: isOn(hass, entities.exhaust_fan_running),
    feederRunning: isOn(hass, entities.feeder_running),
    lighterRunning: isOn(hass, entities.lighter_running)
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
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.8" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
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

  <g class="pill pill--purple pill--tiny" transform="translate(510 460)">
    <rect x="-70" y="-16" rx="16" ry="16" width="140" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">Flue ${v.exhaustTemp}</text>
  </g>
  <g class="pill pill--purple pill--tiny" transform="translate(510 505)">
    <rect x="-70" y="-16" rx="16" ry="16" width="140" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">Feeder ${v.feederTemp}</text>
  </g>
  <g class="pill pill--purple pill--tiny" transform="translate(510 550)">
    <rect x="-70" y="-16" rx="16" ry="16" width="140" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">O₂ ${v.o2}</text>
  </g>

  <g transform="translate(980 430)">
    <rect class="tank" x="-85" y="-140" width="170" height="280" rx="70"></rect>
    <rect class="tankFill" x="-80" y="-135" width="160" height="270" rx="65"></rect>
  </g>

  <path id="p_hot_main" class="pipeBase pipe--hot" d="M420 390 H720 V250" />
  <path id="p_cold_main" class="pipeBase pipe--cold" d="M420 500 H720 V610 H1030" />
  <path id="p_hot_mixer" class="pipeBase pipe--hot" d="M720 250 V180 H820" />
  <path id="p_cold_mixer" class="pipeBase pipe--cold" d="M820 180 V250" />
  <path id="p_hot_dhw" class="pipeBase pipe--hot" d="M720 420 H895" />
  <path id="p_cold_dhw" class="pipeBase pipe--cold" d="M1030 610 H895 V540" />

  <path id="d_hot_main" d="M420 390 H720 V250" fill="none" />
  <path id="d_cold_main" d="M1030 610 H720 V500 H420" fill="none" />
  <path id="d_hot_mixer" d="M720 250 V180 H820" fill="none" />
  <path id="d_cold_mixer" d="M820 250 V180" fill="none" />
  <path id="d_hot_dhw" d="M720 420 H895" fill="none" />
  <path id="d_cold_dhw" d="M895 540 V610 H1030" fill="none" />

  <g class="flowDots ${heatingActive ? "flow--active" : ""}">
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="0s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.15s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.30s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.45s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.60s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.75s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.90s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-1.05s"><mpath href="#d_hot_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-1.20s"><mpath href="#d_hot_main"/></animateMotion></circle>
  </g>
  <g class="flowDots ${heatingActive ? "flow--active" : ""}">
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="0s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.15s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.30s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.45s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.60s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.75s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-0.90s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-1.05s"><mpath href="#d_cold_main"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.35s" repeatCount="indefinite" begin="-1.20s"><mpath href="#d_cold_main"/></animateMotion></circle>
  </g>

  <g class="flowDots ${mixerActive ? "flow--active" : ""}">
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.17s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.34s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.51s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.68s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.85s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-1.02s"><mpath href="#d_hot_mixer"/></animateMotion></circle>
  </g>
  <g class="flowDots ${mixerActive ? "flow--active" : ""}">
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.17s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.34s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.51s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.68s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.85s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-1.02s"><mpath href="#d_cold_mixer"/></animateMotion></circle>
  </g>

  <g class="flowDots ${dhwActive ? "flow--active" : ""}">
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.17s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.34s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.51s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.68s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.85s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--hot" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-1.02s"><mpath href="#d_hot_dhw"/></animateMotion></circle>
  </g>
  <g class="flowDots ${dhwActive ? "flow--active" : ""}">
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="0s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.17s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.34s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.51s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.68s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-0.85s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
    <circle class="flowDot flowDot--cold" r="3.6"><animateMotion dur="1.2s" repeatCount="indefinite" begin="-1.02s"><mpath href="#d_cold_dhw"/></animateMotion></circle>
  </g>

  <g class="pump ${heatingActive ? "pump--active" : ""}" transform="translate(720 330)">
    <circle class="pumpBody" r="15"></circle>
    <path class="pumpIcon" d="M-6 0 L8 -8 L8 8 Z"></path>
  </g>
  <g class="pump ${dhwActive ? "pump--active" : ""}" transform="translate(880 420)">
    <circle class="pumpBody" r="15"></circle>
    <path class="pumpIcon" d="M-6 0 L8 -8 L8 8 Z"></path>
  </g>
  <g class="pump ${mixerActive ? "pump--active" : ""}" transform="translate(820 215)">
    <circle class="pumpBody" r="15"></circle>
    <path class="pumpIcon" d="M-6 0 L8 -8 L8 8 Z"></path>
  </g>

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

    <g transform="translate(0 205)">
      <text class="panelLabel" x="0" y="-18" text-anchor="middle">Modes</text>
      <text class="panelValue panelValueSmall" x="0" y="14" text-anchor="middle">${v.summerMode}</text>
      <text class="panelValue panelValueSmall" x="0" y="42" text-anchor="middle">${v.mixerMode}</text>
    </g>

    ${v.alertOn ? `<g transform="translate(0 200)"><text class="panelAlert" x="0" y="0" text-anchor="middle">ALERT</text></g>` : ""}
  </g>
</svg>
`.trim();
};

// New schematic (closer to the ecoMAX screen diagram)
const renderDiagramSvgV2 = (v, backgroundUrl) => {
  const heatingActive = v.heatingPump;
  const dhwActive = v.dhwPump;
  const mixerActive = v.mixerPump;

  const dots = (pathId, color, active, count = 10, dur = 1.25, r = 3.4) => {
    const beginStep = dur / count;
    const circles = Array.from({ length: count }).map((_, i) => {
      const begin = -(i * beginStep);
      return `
      <circle class="flowDot flowDot--${color}" r="${r}">
        <animateMotion dur="${dur}s" repeatCount="indefinite" begin="${begin}s">
          <mpath href="#${pathId}"/>
        </animateMotion>
      </circle>`;
    });
    return `
    <g class="flowDots ${active ? "flow--active" : ""}">
      ${circles.join("")}
    </g>`;
  };

  return `
<svg class="ecomax" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX boiler diagram">
  <defs>
    <linearGradient id="tankGradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,80,80,0.90)"/>
      <stop offset="55%" stop-color="rgba(80,160,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,170,255,0.90)"/>
    </linearGradient>
    <linearGradient id="panelGlow" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.0)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.4" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  ${backgroundUrl ? `<image href="${backgroundUrl}" x="0" y="0" width="1000" height="600" preserveAspectRatio="xMidYMid meet"></image>` : ""}
  ${backgroundUrl ? "" : `<rect x="30" y="70" width="940" height="470" rx="22" fill="url(#panelGlow)" opacity="0.9"></rect>`}

  <g class="pill pill--blue" transform="translate(500 95)">
    <rect x="-70" y="-16" rx="16" ry="16" width="140" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.outside}</text>
  </g>

  <g class="boiler" transform="translate(165 310)">
    <rect class="boilerBody" x="-70" y="-125" width="140" height="250" rx="10"></rect>
    <rect class="boilerDoor" x="-55" y="10" width="110" height="95" rx="8"></rect>
    <rect class="boilerScreen" x="-10" y="-105" width="46" height="28" rx="4"></rect>
    <circle class="boilerLed" cx="-36" cy="-92" r="7"></circle>
    <circle class="boilerKnob" cx="-36" cy="-66" r="6"></circle>
  </g>

  <g class="tankWrap" transform="translate(820 320)">
    <rect class="tank" x="-78" y="-150" width="156" height="300" rx="70"></rect>
    <rect class="tankFill" x="-72" y="-144" width="144" height="288" rx="66"></rect>
    <path class="coil" d="M-30 -80 h60 a18 18 0 0 1 0 36 h-60 a18 18 0 0 0 0 36 h60 a18 18 0 0 1 0 36 h-60 a18 18 0 0 0 0 36 h60" />
  </g>

  <g class="floor" transform="translate(790 160)">
    <rect class="floorPlate" x="-70" y="-46" width="140" height="92" rx="18"></rect>
    <path class="floorCoil" d="M-45 -20 h90 a14 14 0 0 1 0 28 h-90 a14 14 0 0 0 0 28 h90" />
  </g>

  <path class="pipeBase pipe--hot" d="M235 260 H520" />
  <path class="pipeBase pipe--cold" d="M520 430 H235" />

  <path class="pipeBase pipe--hot" d="M520 260 V175 H720" />
  <path class="pipeBase pipe--cold" d="M720 175 V260" />

  <path class="pipeBase pipe--hot" d="M520 310 H742" />
  <path class="pipeBase pipe--cold" d="M898 430 H742 V360" />

  <path class="pipeBase pipe--hot" d="M742 310 H770" />
  <path class="pipeBase pipe--cold" d="M770 430 H742" />

  <g class="mixer" transform="translate(520 310)">
    <rect class="mixerBox" x="-16" y="-16" width="32" height="32" rx="6"></rect>
    <path class="mixerX" d="M-10 -10 L10 10 M10 -10 L-10 10" />
  </g>

  <g class="pump ${heatingActive ? "pump--active" : ""}" transform="translate(390 260)">
    <circle class="pumpBody" r="15"></circle>
    <path class="pumpIcon" d="M-6 0 L8 -8 L8 8 Z"></path>
  </g>
  <g class="pump ${mixerActive ? "pump--active" : ""}" transform="translate(720 215)">
    <circle class="pumpBody" r="15"></circle>
    <path class="pumpIcon" d="M-6 0 L8 -8 L8 8 Z"></path>
  </g>
  <g class="pump ${dhwActive ? "pump--active" : ""}" transform="translate(742 310)">
    <circle class="pumpBody" r="15"></circle>
    <path class="pumpIcon" d="M-6 0 L8 -8 L8 8 Z"></path>
  </g>

  <path id="d_hot_boiler_to_mixer" d="M235 260 H520" fill="none" />
  <path id="d_cold_mixer_to_boiler" d="M520 430 H235" fill="none" />
  <path id="d_hot_mixer_to_floor" d="M520 260 V175 H720" fill="none" />
  <path id="d_cold_floor_to_mixer" d="M720 260 V175" fill="none" />
  <path id="d_hot_mixer_to_tank" d="M520 310 H770" fill="none" />
  <path id="d_cold_tank_to_mixer" d="M770 430 H742 V360 H520" fill="none" />

  ${dots("d_hot_boiler_to_mixer", "hot", heatingActive, 10, 1.05)}
  ${dots("d_cold_mixer_to_boiler", "cold", heatingActive, 10, 1.05)}
  ${dots("d_hot_mixer_to_floor", "hot", mixerActive, 9, 1.15)}
  ${dots("d_cold_floor_to_mixer", "cold", mixerActive, 9, 1.15)}
  ${dots("d_hot_mixer_to_tank", "hot", dhwActive, 9, 1.15)}
  ${dots("d_cold_tank_to_mixer", "cold", dhwActive, 9, 1.15)}

  <g class="pill pill--purple" transform="translate(270 235)">
    <rect x="-54" y="-18" rx="18" ry="18" width="108" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.boilerNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(270 275)">
    <rect x="-54" y="-16" rx="16" ry="16" width="108" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.boilerTarget}</text>
  </g>

  <g class="pill pill--purple" transform="translate(560 205)">
    <rect x="-46" y="-18" rx="18" ry="18" width="92" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.mixerNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(560 245)">
    <rect x="-46" y="-16" rx="16" ry="16" width="92" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.mixerTarget}</text>
  </g>

  <g class="pill pill--purple" transform="translate(820 260)">
    <rect x="-46" y="-18" rx="18" ry="18" width="92" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.dhwNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(820 300)">
    <rect x="-46" y="-16" rx="16" ry="16" width="92" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.dhwTarget}</text>
  </g>

  <g class="pill pill--purple pill--tiny" transform="translate(320 355)">
    <rect x="-62" y="-16" rx="16" ry="16" width="124" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">Flue ${v.exhaustTemp}</text>
  </g>
  <g class="pill pill--purple pill--tiny" transform="translate(320 400)">
    <rect x="-62" y="-16" rx="16" ry="16" width="124" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">Feeder ${v.feederTemp}</text>
  </g>
  <g class="pill pill--purple pill--tiny" transform="translate(320 445)">
    <rect x="-62" y="-16" rx="16" ry="16" width="124" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">O₂ ${v.o2}</text>
  </g>
</svg>
`.trim();
};

class EcoMax810pDiagramCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("ecomax810p-diagram-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:ecomax810p-diagram-card",
      title: "ecoMAX810P",
      show_left_panel: true,
      show_stats: true,
      compact_stats_on_mobile: true,
      layout: "auto",
      breakpoint: 700,
      scale: 1,
      diagram_offset_x: 0,
      diagram_offset_y: 0,
      entities: {}
    };
  }

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
      show_stats: true,
      compact_stats_on_mobile: true,
      diagram_offset_x: 0,
      diagram_offset_y: 0,
      background_url: undefined,
      ...config
    };
    this._render();
  }

  getCardSize() {
    return 8;
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

    const {
      title,
      entities,
      scale,
      show_left_panel,
      show_stats,
      compact_stats_on_mobile,
      diagram_offset_x,
      diagram_offset_y,
      extra_tiles,
      background_url
    } = this._config;
    const narrow = this._isNarrow();
    if (narrow) this.setAttribute("data-narrow", "");
    else this.removeAttribute("data-narrow");

    const v = computeValues(this._hass, entities);
    const svg = renderDiagramSvgV2(v, background_url);
    const headerAttr = title ? ` header="${esc(title)}"` : "";
    const wrapClass = show_left_panel ? "wrap" : "wrap noLeft";
    const scaleVal = Number.isFinite(scale) ? String(scale) : "1";
    const xOffsetVal = `${Number.isFinite(diagram_offset_x) ? diagram_offset_x : 0}px`;
    const yOffsetVal = `${Number.isFinite(diagram_offset_y) ? diagram_offset_y : 0}px`;

    const showStats = show_stats !== false;
    const compactStats = !!compact_stats_on_mobile && narrow;

    const tile = (label, value, icon, className = "") => `
      <div class="tile ${className}">
        <div class="tileIcon">${icon}</div>
        <div class="tileText">
          <div class="tileValue">${esc(value)}</div>
          <div class="tileLabel">${esc(label)}</div>
        </div>
      </div>
    `;

    const iconThermo = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a3 3 0 1 0 4 0ZM12 22a5 5 0 0 1-3-9V5a3 3 0 0 1 6 0v8a5 5 0 0 1-3 9Z"/></svg>`;
    const iconFire = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 0s.5 2.5-1 4.5S9 8 9 11a6 6 0 0 0 12 0c0-4.5-3-7-3-9.5 0 0-.5 2.5-2 4.5S13.5 0 13.5 0ZM12 24a8 8 0 0 1-8-8c0-4.5 2.5-7.5 4.5-10C8 10 12 11 12 16c0-3 2-4 3-6 0 0 5 3 5 6a8 8 0 0 1-8 8Z"/></svg>`;
    const iconFan = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 2c0 1.6-1.8 2.8-4.5 2.8-.7 0-1.4-.1-2.1-.2l.4.7c1.3 2.3 1.1 4.5-.3 5.3-1.4.8-3.4-.3-4.7-2.6-.3-.6-.6-1.2-.8-1.9l-.4.7C6.4 19.1 4.4 20.2 3 19.4c-1.4-.8-1.6-3-.3-5.3.3-.6.7-1.1 1.1-1.6H3.1C.8 12.5-1 11.3-1 9.7S.8 6.9 3.5 6.9c.7 0 1.4.1 2.1.2l-.4-.7C3.9 4.1 4.1 1.9 5.5 1.1c1.4-.8 3.4.3 4.7 2.6.3.6.6 1.2.8 1.9l.4-.7C12.6 3.4 14.6 2.3 16 3.1c1.4.8 1.6 3 .3 5.3-.3.6-.7 1.1-1.1 1.6h.7c2.3 0 4.1 1.2 4.1 2Z"/></svg>`;
    const iconPump = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 1 8 8 8 8 0 0 1-8-8Zm8-4 6 4-6 4V8Z"/></svg>`;
    const iconAlert = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 1 21h22L12 2Zm1 14h-2v-2h2v2Zm0-4h-2V8h2v4Z"/></svg>`;

    const iconByKey = {
      thermo: iconThermo,
      fire: iconFire,
      fan: iconFan,
      pump: iconPump,
      alert: iconAlert
    };

    const fmtAuto = (ent) => {
      if (!ent) return "---";
      const s = ent.state;
      if (s == null) return "---";
      const unit = typeof ent.attributes?.unit_of_measurement === "string" ? ent.attributes.unit_of_measurement : undefined;
      const n = Number(s);
      if (Number.isFinite(n) && unit === "°C") return `${Math.round(n)}°C`;
      if (Number.isFinite(n) && unit === "%") return `${Math.round(n)}%`;
      if (s === "on" || s === "off") return s === "on" ? "On" : "Off";
      return String(s);
    };

    const extraTilesHtml =
      Array.isArray(extra_tiles) && extra_tiles.length
        ? extra_tiles
            .map((t) => {
              const ent = this._hass?.states?.[t.entity];
              const label = t.label ?? t.entity;
              const icon = iconByKey[t.icon ?? "thermo"] ?? iconThermo;
              const raw = ent?.state ?? "---";
              const value =
                t.format === "raw"
                  ? raw
                  : t.format === "temp"
                    ? `${Math.round(Number(raw))}°C`
                    : t.format === "pct"
                      ? `${Math.round(Number(raw))}%`
                      : t.format === "onoff"
                        ? raw === "on"
                          ? "On"
                          : raw === "off"
                            ? "Off"
                            : raw
                        : fmtAuto(ent);
              return tile(label, value, icon);
            })
            .join("")
        : "";

    const statsHtml = showStats
      ? `
  <div class="stats ${compactStats ? "stats--compact" : ""}">
    ${tile("Operation", v.opMode, iconFire, v.alertOn ? "tile--alert" : "")}
    ${tile("Boiler output", v.boilerLoad, iconPump, v.heatingPump ? "tile--active" : "")}
    ${tile("Fuel level", v.fuelLevel, iconFire)}
    ${tile("Fan output", v.fanPower, iconFan, v.fanRunning ? "tile--spin" : "")}
    ${tile("Outdoor", v.outside, iconThermo)}
    ${tile("Boiler", `${v.boilerNow} / ${v.boilerTarget}`, iconThermo)}
    ${tile("Mixer", `${v.mixerNow} / ${v.mixerTarget}`, iconThermo, v.mixerPump ? "tile--active" : "")}
    ${tile("DHW", `${v.dhwNow} / ${v.dhwTarget}`, iconThermo, v.dhwPump ? "tile--active" : "")}
    ${tile("Flue temp", v.exhaustTemp, iconThermo, v.exhaustFanRunning ? "tile--active" : "")}
    ${tile("Feeder temp", v.feederTemp, iconThermo, v.feederRunning ? "tile--active" : "")}
    ${tile("O₂ level", v.o2, iconThermo)}
    ${tile("Circulation pump", yesNo(v.circulationPump), iconPump, v.circulationPump ? "tile--active" : "")}
    ${tile("Lighter", yesNo(v.lighterRunning), iconAlert, v.lighterRunning ? "tile--active" : "")}
    ${tile("Modes", `${v.summerMode} / ${v.mixerMode}`, iconAlert)}
    ${extraTilesHtml}
  </div>
`
      : "";

    this.shadowRoot.innerHTML = `
<style>
  :host{display:block}
  .wrap{padding:12px}
  .svg{width:100%;overflow:hidden;display:flex;justify-content:center}
  .svg svg{transform:translateX(var(--xOffset,0px)) translateY(var(--yOffset,0px)) scale(var(--scale,1));transform-origin:top left}
  .ecomax{width:100%;height:auto;font-family:var(--paper-font-body1_-_font-family,system-ui)}

  .device{fill:rgba(240,240,240,.95);stroke:rgba(120,120,120,.35);stroke-width:2}
  .deviceScreen{fill:rgba(40,40,40,.9)}
  .deviceIcon{fill:rgba(255,90,90,.9)}

  .tank{fill:rgba(245,245,245,.95);stroke:rgba(120,120,120,.35);stroke-width:2}
  .tankFill{fill:url(#tankGradient);opacity:.95}
  .coil{fill:none;stroke:rgba(255,255,255,.70);stroke-width:10;stroke-linecap:round;opacity:.55}

  .boilerBody{fill:rgba(245,245,245,.92);stroke:rgba(255,255,255,.35);stroke-width:2}
  .boilerDoor{fill:rgba(230,230,230,.92);stroke:rgba(0,0,0,.15);stroke-width:1}
  .boilerScreen{fill:rgba(24,24,24,.92)}
  .boilerLed{fill:rgba(255,80,80,.92)}
  .boilerKnob{fill:rgba(140,140,140,.85)}

  .floorPlate{fill:rgba(255,255,255,.06);stroke:rgba(255,255,255,.10);stroke-width:1}
  .floorCoil{fill:none;stroke:rgba(220,40,40,.85);stroke-width:10;stroke-linecap:round;stroke-linejoin:round}

  .mixerBox{fill:rgba(255,255,255,.10);stroke:rgba(255,255,255,.20);stroke-width:1}
  .mixerX{stroke:rgba(255,255,255,.80);stroke-width:2;stroke-linecap:round}

  .pipeBase{fill:none;stroke-width:10;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
  .pipe--hot{stroke:rgba(220,40,40,.92)}
  .pipe--cold{stroke:rgba(0,150,220,.92)}

  .flowDots{opacity:0;filter:url(#glow)}
  .flowDots.flow--active{opacity:1}
  .flowDot{opacity:.95}
  .flowDot--hot{fill:rgba(255,70,70,.95)}
  .flowDot--cold{fill:rgba(0,170,255,.95)}

  .pump .pumpBody{fill:rgba(255,255,255,.85);stroke:rgba(0,0,0,.18);stroke-width:2}
  .pump .pumpIcon{fill:rgba(30,30,30,.78)}
  .pump--active .pumpBody{filter:url(#glow);stroke:rgba(0,0,0,.08);animation:pulse 1.2s ease-in-out infinite}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}

  .pill rect{fill:rgba(78,78,120,.92);stroke:rgba(255,255,255,.25);stroke-width:1}
  .pill text{fill:rgba(255,255,255,.95);font-size:22px;font-weight:600}
  .pill--sub rect{opacity:.75}
  .pill--sub text{font-size:18px;opacity:.92}
  .pill--blue rect{fill:rgba(0,170,220,.92)}
  .pill--tiny rect{opacity:.88}
  .pill--tiny text{font-size:16px;opacity:.95}

  .leftPanel .panel{fill:rgba(255,255,255,.92);stroke:rgba(78,78,120,.6);stroke-width:3}
  .leftPanel .panelTitle{fill:rgba(78,78,120,.95);font-size:26px;font-weight:700}
  .leftPanel .panelLabel{fill:rgba(0,0,0,.72);font-size:16px;font-weight:600}
  .leftPanel .panelValue{fill:rgba(78,78,120,.95);font-size:24px;font-weight:800;text-transform:capitalize}
  .leftPanel .panelValueSmall{font-size:18px;font-weight:800}
  .leftPanel .panelAlert{fill:rgba(220,40,40,.95);font-size:22px;font-weight:900;letter-spacing:2px}

  :host([data-narrow]) .leftPanel{display:none}
  :host([data-narrow]) .pill text{font-size:18px}
  :host([data-narrow]) .pill--sub text{font-size:15px}

  .stats{
    margin-top:12px;
    display:grid;
    grid-template-columns:repeat(6,minmax(0,1fr));
    gap:10px;
  }
  :host([data-narrow]) .stats{grid-template-columns:repeat(2,minmax(0,1fr));}
  .stats--compact{gap:8px}

  .tile{
    background:var(--ha-card-background, rgba(20,20,20,.12));
    border:1px solid rgba(255,255,255,.08);
    border-radius:14px;
    padding:10px 12px;
    display:flex;
    gap:10px;
    align-items:center;
    box-shadow:0 6px 22px rgba(0,0,0,.18);
    backdrop-filter: blur(6px);
  }
  .tileIcon{
    width:34px;height:34px;border-radius:12px;
    background:rgba(0,170,220,.18);
    display:grid;place-items:center;
    flex:0 0 auto;
  }
  .tileIcon svg{width:20px;height:20px;fill:rgba(255,255,255,.85)}
  .tileText{min-width:0}
  .tileValue{font-size:18px;font-weight:800;color:var(--primary-text-color);line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tileLabel{font-size:12px;font-weight:700;opacity:.75;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  .tile--active{border-color:rgba(0,170,220,.35);box-shadow:0 6px 22px rgba(0,170,220,.12),0 6px 22px rgba(0,0,0,.18)}
  .tile--alert{border-color:rgba(220,40,40,.55);box-shadow:0 6px 22px rgba(220,40,40,.12),0 6px 22px rgba(0,0,0,.18);animation:alertPulse 1.2s ease-in-out infinite}
  @keyframes alertPulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}

  .tile--spin .tileIcon svg{animation:spin 1.1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
<ha-card${headerAttr}>
  <div class="${wrapClass}" style="--scale:${esc(scaleVal)};--xOffset:${esc(xOffsetVal)};--yOffset:${esc(yOffsetVal)};">
    <div class="svg">${svg}</div>
    ${statsHtml}
  </div>
</ha-card>
    `.trim();
  }
}

class EcoMax810pDiagramCardEditor extends HTMLElement {
  constructor() {
    super();
    this._hass = undefined;
    this._config = undefined;
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  _fireChanged() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.currentTarget;
    const key = target?.dataset?.key;
    if (!key) return;
    const value = ev?.detail?.value ?? target?.value;
    this._config = {
      ...this._config,
      entities: {
        ...(this._config.entities ?? {}),
        [key]: value || undefined
      }
    };
    this._fireChanged();
  }

  _topValueChanged(ev) {
    if (!this._config) return;
    const target = ev.currentTarget;
    const key = target?.dataset?.key;
    if (!key) return;
    const raw = ev?.detail?.value ?? target?.value;
    const value =
      raw === "" || raw == null
        ? undefined
        : key === "breakpoint" || key === "scale" || key === "diagram_offset_x" || key === "diagram_offset_y"
          ? Number(raw)
          : raw;
    this._config = { ...this._config, [key]: value };
    this._fireChanged();
  }

  _addExtraTile() {
    if (!this._config) return;
    const tiles = Array.isArray(this._config.extra_tiles) ? [...this._config.extra_tiles] : [];
    tiles.push({ entity: "", label: "", icon: "thermo", format: "auto" });
    this._config = { ...this._config, extra_tiles: tiles };
    this._fireChanged();
    this._render();
  }

  _removeExtraTile(idx) {
    if (!this._config) return;
    const tiles = Array.isArray(this._config.extra_tiles) ? [...this._config.extra_tiles] : [];
    tiles.splice(idx, 1);
    this._config = { ...this._config, extra_tiles: tiles };
    this._fireChanged();
    this._render();
  }

  _extraTileChanged(ev) {
    if (!this._config) return;
    const target = ev.currentTarget;
    const idx = Number(target?.dataset?.idx);
    const key = target?.dataset?.key;
    if (!Number.isFinite(idx) || !key) return;
    const value = ev?.detail?.value ?? target?.value;
    const tiles = Array.isArray(this._config.extra_tiles) ? [...this._config.extra_tiles] : [];
    const t = { ...(tiles[idx] ?? { entity: "" }) };
    t[key] = value;
    tiles[idx] = t;
    this._config = { ...this._config, extra_tiles: tiles };
    this._fireChanged();
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._config) {
      this.shadowRoot.innerHTML = `<style>:host{display:block;padding:12px}</style><div>Configure ecoMAX810P card…</div>`;
      return;
    }

    const top = this._config;
    const extraTiles = Array.isArray(top.extra_tiles) ? top.extra_tiles : [];
    const rows = [
      ["Operation state", "state"],
      ["Alert", "alert"],
      ["Outside temperature", "outside_temperature"],
      ["Boiler load", "boiler_load"],
      ["Fuel level", "fuel_level"],
      ["Fan power", "fan_power"],
      ["Boiler temperature", "boiler_temperature"],
      ["Boiler target temperature", "boiler_target_temperature"],
      ["Mixer temperature", "mixer_temperature"],
      ["Mixer target temperature", "mixer_target_temperature"],
      ["DHW temperature", "dhw_temperature"],
      ["DHW target temperature", "dhw_target_temperature"],
      ["Flue/exhaust temperature", "exhaust_temperature"],
      ["Feeder temperature", "feeder_temperature"],
      ["Oxygen level", "oxygen_level"],
      ["Summer mode", "summer_mode"],
      ["Mixer work mode", "mixer_work_mode"],
      ["Water heater", "water_heater"],
      ["Heating pump running", "heating_pump_running"],
      ["DHW pump running", "dhw_pump_running"],
      ["Mixer pump running", "mixer_pump_running"],
      ["Circulation pump running", "circulation_pump_running"],
      ["Fan running", "fan_running"],
      ["Exhaust fan running", "exhaust_fan_running"],
      ["Feeder running", "feeder_running"],
      ["Lighter running", "lighter_running"]
    ];

    const boolSelect = (key, value) => `
      <select data-key="${key}">
        <option value="true" ${value !== false ? "selected" : ""}>true</option>
        <option value="false" ${value === false ? "selected" : ""}>false</option>
      </select>
    `;

    this.shadowRoot.innerHTML = `
<style>
  :host{display:block;padding:12px}
  .section{margin:10px 0 16px}
  .sectionTitle{font-weight:800;margin:8px 0}
  .row{display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:center;margin:8px 0}
  .rowLabel{opacity:.85;font-weight:700}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .btn{margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.2);cursor:pointer;background:var(--secondary-background-color, #f5f5f5)}
  .extraTile{border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:10px;margin:10px 0}
  .extraTileHeader{display:flex;justify-content:space-between;align-items:center;font-weight:800}
  select,input{width:100%}
</style>

<div class="section">
  <div class="sectionTitle">Layout</div>
  <div class="grid2">
    <label>Background URL
      <input data-key="background_url" placeholder="/local/ecomax/diagram.png" value="${esc(String(top.background_url ?? ""))}"/>
    </label>
    <label>Layout
      <select data-key="layout">
        <option value="auto" ${top.layout === "auto" ? "selected" : ""}>auto</option>
        <option value="mobile" ${top.layout === "mobile" ? "selected" : ""}>mobile</option>
        <option value="desktop" ${top.layout === "desktop" ? "selected" : ""}>desktop</option>
      </select>
    </label>
    <label>Breakpoint (px)
      <input data-key="breakpoint" type="number" value="${esc(String(top.breakpoint ?? 700))}"/>
    </label>
    <label>Scale
      <input data-key="scale" type="number" step="0.05" value="${esc(String(top.scale ?? 1))}"/>
    </label>
    <label>Show left panel
      ${boolSelect("show_left_panel", top.show_left_panel)}
    </label>
    <label>Diagram offset X (px)
      <input data-key="diagram_offset_x" type="number" value="${esc(String(top.diagram_offset_x ?? 0))}"/>
    </label>
    <label>Diagram offset Y (px)
      <input data-key="diagram_offset_y" type="number" value="${esc(String(top.diagram_offset_y ?? 0))}"/>
    </label>
    <label>Show stats
      ${boolSelect("show_stats", top.show_stats)}
    </label>
    <label>Compact stats on mobile
      ${boolSelect("compact_stats_on_mobile", top.compact_stats_on_mobile)}
    </label>
  </div>
</div>

<div class="section">
  <div class="sectionTitle">Entities</div>
  ${rows
    .map(([label, key]) => {
      const value = top.entities?.[key] ?? "";
      return `
        <div class="row">
          <div class="rowLabel">${esc(label)}</div>
          <ha-entity-picker data-key="${esc(key)}" value="${esc(value)}"></ha-entity-picker>
        </div>
      `;
    })
    .join("")}
</div>

<div class="section">
  <div class="sectionTitle">Extra tiles</div>
  <div>Use this to add any additional entities without editing code.</div>
  <button class="btn" id="addTile" type="button">Add extra tile</button>
  ${extraTiles
    .map((t, idx) => {
      return `
      <div class="extraTile">
        <div class="extraTileHeader">
          <div>Tile #${idx + 1}</div>
          <button class="btn" type="button" data-remove="${idx}">Remove</button>
        </div>
        <div class="row">
          <div class="rowLabel">Entity</div>
          <ha-entity-picker data-idx="${idx}" data-key="entity" value="${esc(t.entity ?? "")}"></ha-entity-picker>
        </div>
        <div class="grid2">
          <label>Label
            <input data-idx="${idx}" data-key="label" value="${esc(t.label ?? "")}"/>
          </label>
          <label>Icon
            <select data-idx="${idx}" data-key="icon">
              ${["thermo", "fire", "fan", "pump", "alert"]
                .map((k) => `<option value="${k}" ${(t.icon ?? "thermo") === k ? "selected" : ""}>${k}</option>`)
                .join("")}
            </select>
          </label>
          <label>Format
            <select data-idx="${idx}" data-key="format">
              ${["auto", "raw", "temp", "pct", "onoff"]
                .map((k) => `<option value="${k}" ${(t.format ?? "auto") === k ? "selected" : ""}>${k}</option>`)
                .join("")}
            </select>
          </label>
        </div>
      </div>
      `;
    })
    .join("")}
</div>
    `.trim();

    const pickers = Array.from(this.shadowRoot.querySelectorAll("ha-entity-picker"));
    for (const p of pickers) {
      p.hass = this._hass;
      p.includeDomains = ["sensor", "binary_sensor", "select", "water_heater", "number", "switch"];
      p.addEventListener("value-changed", (ev) => {
        const idx = p.dataset?.idx;
        if (idx != null) this._extraTileChanged(ev);
        else this._valueChanged(ev);
      });
    }

    const topControls = Array.from(this.shadowRoot.querySelectorAll("input[data-key],select[data-key]"));
    for (const el of topControls) {
      el.addEventListener("change", (ev) => {
        const key = el.dataset?.key;
        const raw = el.value;
        if (key === "show_left_panel" || key === "show_stats" || key === "compact_stats_on_mobile") {
          ev.detail = { value: raw === "true" };
        } else {
          ev.detail = { value: raw };
        }
        this._topValueChanged(ev);
      });
    }

    this.shadowRoot.querySelector("#addTile")?.addEventListener("click", () => this._addExtraTile());
    for (const b of Array.from(this.shadowRoot.querySelectorAll("button[data-remove]"))) {
      b.addEventListener("click", () => this._removeExtraTile(Number(b.dataset?.remove)));
    }
    for (const el of Array.from(this.shadowRoot.querySelectorAll("[data-idx][data-key]:not(ha-entity-picker)"))) {
      el.addEventListener("change", (ev) => this._extraTileChanged(ev));
      el.addEventListener("input", (ev) => this._extraTileChanged(ev));
    }
  }
}

if (!customElements.get("ecomax810p-diagram-card-editor")) {
  customElements.define("ecomax810p-diagram-card-editor", EcoMax810pDiagramCardEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ecomax810p-diagram-card",
  name: "ecoMAX810P Diagram Card",
  description: "Boiler+mixer diagram with animated flow indicators + stats tiles"
});

if (!customElements.get("ecomax810p-diagram-card")) {
  customElements.define("ecomax810p-diagram-card", EcoMax810pDiagramCard);
}


