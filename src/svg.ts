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

  // True moving-dot flow using SVG animateMotion.
  const dots = (pathId: string, color: "hot" | "cold", active: boolean, count = 10, dur = 1.25, r = 3.4) => {
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

  // Designer redraw: closer to ecoMAX schematic (boiler + mixer + floor coil + DHW tank).
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

  <!-- Subtle diagram panel (helps readability on dark dashboards) -->
  <rect x="30" y="70" width="940" height="470" rx="22" fill="url(#panelGlow)" opacity="0.9"></rect>

  <!-- Outdoor temp pill (top center) -->
  <g class="pill pill--blue" transform="translate(500 95)">
    <rect x="-70" y="-16" rx="16" ry="16" width="140" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.outside}</text>
  </g>

  <!-- Boiler (left) -->
  <g class="boiler" transform="translate(165 310)">
    <rect class="boilerBody" x="-70" y="-125" width="140" height="250" rx="10"></rect>
    <rect class="boilerDoor" x="-55" y="10" width="110" height="95" rx="8"></rect>
    <rect class="boilerScreen" x="-10" y="-105" width="46" height="28" rx="4"></rect>
    <circle class="boilerLed" cx="-36" cy="-92" r="7"></circle>
    <circle class="boilerKnob" cx="-36" cy="-66" r="6"></circle>
  </g>

  <!-- DHW tank (right) -->
  <g class="tankWrap" transform="translate(820 320)">
    <rect class="tank" x="-78" y="-150" width="156" height="300" rx="70"></rect>
    <rect class="tankFill" x="-72" y="-144" width="144" height="288" rx="66"></rect>
    <!-- Coil -->
    <path class="coil" d="M-30 -80 h60 a18 18 0 0 1 0 36 h-60 a18 18 0 0 0 0 36 h60 a18 18 0 0 1 0 36 h-60 a18 18 0 0 0 0 36 h60" />
  </g>

  <!-- Floor heating coil (top-right, like ecoMAX heated floor icon) -->
  <g class="floor" transform="translate(790 160)">
    <rect class="floorPlate" x="-70" y="-46" width="140" height="92" rx="18"></rect>
    <path class="floorCoil" d="M-45 -20 h90 a14 14 0 0 1 0 28 h-90 a14 14 0 0 0 0 28 h90" />
  </g>

  <!-- Pipe base geometry (ecoMAX-like right angles) -->
  <!-- Supply from boiler to mixer (hot) -->
  <path class="pipeBase pipe--hot" d="M235 260 H520" />
  <!-- Return to boiler (cold) -->
  <path class="pipeBase pipe--cold" d="M520 430 H235" />

  <!-- Vertical riser to floor (from mixer) -->
  <path class="pipeBase pipe--hot" d="M520 260 V175 H720" />
  <path class="pipeBase pipe--cold" d="M720 175 V260" />

  <!-- Branch to DHW tank -->
  <path class="pipeBase pipe--hot" d="M520 310 H742" />
  <path class="pipeBase pipe--cold" d="M898 430 H742 V360" />

  <!-- Inner tank connection lines -->
  <path class="pipeBase pipe--hot" d="M742 310 H770" />
  <path class="pipeBase pipe--cold" d="M770 430 H742" />

  <!-- Mixing valve symbol at junction -->
  <g class="mixer" transform="translate(520 310)">
    <rect class="mixerBox" x="-16" y="-16" width="32" height="32" rx="6"></rect>
    <path class="mixerX" d="M-10 -10 L10 10 M10 -10 L-10 10" />
  </g>

  <!-- Pumps (ecoMAX-style circles with play icon) -->
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

  <!-- Flow dot paths (direction) -->
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

  <!-- Temperature pills (placed like your screenshot) -->
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

  <!-- Local sensor pills (compact, under boiler) -->
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
}


