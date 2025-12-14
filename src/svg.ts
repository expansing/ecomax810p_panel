import type { EntityMap } from "./config";
import type { HomeAssistant } from "./types";

function stateOf(hass: HomeAssistant, entityId?: string): string | undefined {
  if (!entityId) return undefined;
  return hass.states[entityId]?.state;
}

function numState(hass: HomeAssistant, entityId?: string): number | undefined {
  const s = stateOf(hass, entityId);
  if (s == null) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function fmtTemp(n: number | undefined): string {
  if (n == null) return "---";
  return `${Math.round(n)}°C`;
}

function fmtPct(n: number | undefined): string {
  if (n == null) return "---";
  return `${Math.round(n)}%`;
}

function isOn(hass: HomeAssistant, entityId?: string): boolean {
  return stateOf(hass, entityId) === "on";
}

export type DiagramValues = {
  outside: string;
  boilerNow: string;
  boilerTarget: string;
  mixerNow: string;
  mixerTarget: string;
  dhwNow: string;
  dhwTarget: string;
  exhaustTemp: string;
  feederTemp: string;
  o2: string;
  boilerLoad: string;
  fuelLevel: string;
  fanPower: string;
  opMode: string;
  summerMode: string;
  mixerMode: string;
  waterHeaterMode: string;
  alertOn: boolean;
  heatingPump: boolean;
  dhwPump: boolean;
  mixerPump: boolean;
  circulationPump: boolean;
  fanRunning: boolean;
  exhaustFanRunning: boolean;
  feederRunning: boolean;
  lighterRunning: boolean;
};

export function computeValues(hass: HomeAssistant, entities: EntityMap): DiagramValues {
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
}

/**
 * Returns an SVG diagram inspired by the ecoMAX screen.
 * Layout is responsive via viewBox.
 */
export function renderDiagramSvg(v: DiagramValues): string {
  const heatingActive = v.heatingPump;
  const dhwActive = v.dhwPump;
  const mixerActive = v.mixerPump;

  // Pipe classes toggle animated moving-dot flow when active.
  // Note: we keep it pure SVG+CSS (no external assets) for easy HACS install.
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

  <!-- Outdoor temp pill -->
  <g class="pill pill--blue" transform="translate(610 55)">
    <rect x="-85" y="-18" rx="18" ry="18" width="170" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.outside}</text>
  </g>

  <!-- Boiler block -->
  <g transform="translate(350 410)">
    <rect class="device" x="-70" y="-110" width="140" height="220" rx="8"></rect>
    <rect class="deviceScreen" x="-18" y="-92" width="46" height="26" rx="3"></rect>
    <circle class="deviceIcon" cx="-40" cy="-80" r="10"></circle>
  </g>

  <!-- Local sensor pills near boiler -->
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

  <!-- Tank block -->
  <g transform="translate(980 430)">
    <rect class="tank" x="-85" y="-140" width="170" height="280" rx="70"></rect>
    <rect class="tankFill" x="-80" y="-135" width="160" height="270" rx="65"></rect>
  </g>

  <!-- Main heating loop pipes -->
  <path class="pipeBase pipe--hot" d="M420 390 H720 V250" />
  <path class="pipeFlow pipe--hot ${heatingActive ? "flow--active" : ""}" d="M420 390 H720 V250" />
  <path class="pipeBase pipe--cold" d="M420 500 H720 V610 H1030" />
  <path class="pipeFlow pipe--cold ${heatingActive ? "flow--active" : ""}" d="M420 500 H720 V610 H1030" />

  <!-- Mixer branch -->
  <path class="pipeBase pipe--hot" d="M720 250 V180 H820" />
  <path class="pipeFlow pipe--hot ${mixerActive ? "flow--active" : ""}" d="M720 250 V180 H820" />
  <path class="pipeBase pipe--cold" d="M820 180 V250" />
  <path class="pipeFlow pipe--cold ${mixerActive ? "flow--active" : ""}" d="M820 180 V250" />

  <!-- DHW branch to tank -->
  <path class="pipeBase pipe--hot" d="M720 420 H895" />
  <path class="pipeFlow pipe--hot ${dhwActive ? "flow--active" : ""}" d="M720 420 H895" />
  <path class="pipeBase pipe--cold" d="M1030 610 H895 V540" />
  <path class="pipeFlow pipe--cold ${dhwActive ? "flow--active" : ""}" d="M1030 610 H895 V540" />

  <!-- Pumps (pulse when active) -->
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

  <!-- Temperature pills -->
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

  <!-- Left panel -->
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
}


