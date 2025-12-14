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
  boilerLoad: string;
  fuelLevel: string;
  fanPower: string;
  opMode: string;
  alertOn: boolean;
  heatingPump: boolean;
  dhwPump: boolean;
  mixerPump: boolean;
};

export function computeValues(hass: HomeAssistant, entities: EntityMap): DiagramValues {
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
}

/**
 * Returns an SVG diagram inspired by the ecoMAX screen.
 * Layout is responsive via viewBox.
 */
export function renderDiagramSvg(v: DiagramValues): string {
  const heatingActive = v.heatingPump;
  const dhwActive = v.dhwPump;
  const mixerActive = v.mixerPump;

  // Pipe classes toggle animated dash offset when active.
  // Note: we keep it pure SVG+CSS (no external assets) for easy HACS install.
  return `
<svg class="ecomax" viewBox="0 0 1200 700" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX boiler diagram">
  <defs>
    <linearGradient id="tankGradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,80,80,0.85)"/>
      <stop offset="55%" stop-color="rgba(80,160,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,170,255,0.85)"/>
    </linearGradient>
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

  <!-- Tank block -->
  <g transform="translate(980 430)">
    <rect class="tank" x="-85" y="-140" width="170" height="280" rx="70"></rect>
    <rect class="tankFill" x="-80" y="-135" width="160" height="270" rx="65"></rect>
  </g>

  <!-- Main heating loop pipes -->
  <path class="pipe pipe--hot ${heatingActive ? "pipe--active" : ""}" d="M420 390 H720 V250" />
  <path class="pipe pipe--cold ${heatingActive ? "pipe--active" : ""}" d="M420 500 H720 V610 H1030" />

  <!-- Mixer branch -->
  <path class="pipe pipe--hot ${mixerActive ? "pipe--active" : ""}" d="M720 250 V180 H820" />
  <path class="pipe pipe--cold ${mixerActive ? "pipe--active" : ""}" d="M820 180 V250" />

  <!-- DHW branch to tank -->
  <path class="pipe pipe--hot ${dhwActive ? "pipe--active" : ""}" d="M720 420 H860" />
  <path class="pipe pipe--hot ${dhwActive ? "pipe--active" : ""}" d="M860 420 H895" />
  <path class="pipe pipe--cold ${dhwActive ? "pipe--active" : ""}" d="M1030 610 H895 V540" />

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

    ${v.alertOn ? `<g transform="translate(0 200)"><text class="panelAlert" x="0" y="0" text-anchor="middle">ALERT</text></g>` : ""}
  </g>
</svg>
`.trim();
}


