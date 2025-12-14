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
export function renderDiagramSvg(
  v: DiagramValues,
  opts?: {
    backgroundUrl?: string;
  }
): string {
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

  // Optional: render a user-provided background and overlay our animated elements on top.
  // This is the closest way to match the original ecoMAX diagram artwork.
  const backgroundUrl = opts?.backgroundUrl;

  // Professional redesign matching the ecoMAX reference image exactly:
  // - Dotted pipes (red hot, blue cold)
  // - White triangular mixer symbol with X overlay when closed
  // - Proper positioning matching the reference layout
  // - Clean, professional styling
  const mixerClosed = !mixerActive; // X shows when mixer path is closed
  
  return `
<svg class="ecomax" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX boiler diagram">
  <defs>
    <linearGradient id="tankGradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="rgba(255,80,80,0.90)"/>
      <stop offset="55%" stop-color="rgba(80,160,255,0.55)"/>
      <stop offset="100%" stop-color="rgba(0,170,255,0.90)"/>
    </linearGradient>
    <linearGradient id="dhwPillGradientHot" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="rgba(255,100,100,0.95)"/>
      <stop offset="100%" stop-color="rgba(255,60,60,0.95)"/>
    </linearGradient>
    <linearGradient id="dhwPillGradientCold" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="rgba(100,180,255,0.95)"/>
      <stop offset="100%" stop-color="rgba(60,140,255,0.95)"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2.4" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="pipeDots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.85"/>
    </pattern>
  </defs>

  ${backgroundUrl ? `<image href="${backgroundUrl}" x="0" y="0" width="1000" height="600" preserveAspectRatio="xMidYMid meet"></image>` : ""}

  <!-- Background panel (only if no background image) -->
  ${backgroundUrl ? "" : `<rect x="0" y="0" width="1000" height="600" fill="rgba(60,60,70,0.95)"></rect>`}

  <!-- Outdoor temp pill (top center, light blue) -->
  <g class="pill pill--blue" transform="translate(500 50)">
    <rect x="-50" y="-18" rx="18" ry="18" width="100" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.outside}</text>
  </g>

  <!-- Boiler (left side, rectangular with display) -->
  <g class="boiler" transform="translate(180 350)">
    <rect class="boilerBody" x="-75" y="-140" width="150" height="280" rx="12" fill="rgba(240,240,240,0.95)" stroke="rgba(180,180,180,0.4)" stroke-width="2"></rect>
    <rect class="boilerDoor" x="-60" y="20" width="120" height="100" rx="8" fill="rgba(220,220,220,0.95)" stroke="rgba(160,160,160,0.3)" stroke-width="1.5"></rect>
    <rect class="boilerScreen" x="-15" y="-120" width="50" height="32" rx="4" fill="rgba(30,30,30,0.95)"></rect>
    <circle class="boilerLed" cx="-40" cy="-104" r="8" fill="rgba(255,60,60,0.95)"></circle>
  </g>

  <!-- Temperature pills on boiler output (right side of boiler) -->
  <g class="pill pill--purple" transform="translate(300 280)">
    <rect x="-50" y="-18" rx="18" ry="18" width="100" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.boilerNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(300 320)">
    <rect x="-50" y="-16" rx="16" ry="16" width="100" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.boilerTarget}</text>
  </g>

  <!-- Sensor pills under boiler -->
  <g class="pill pill--purple pill--tiny" transform="translate(300 420)">
    <rect x="-65" y="-16" rx="16" ry="16" width="130" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">Flue ${v.exhaustTemp}</text>
  </g>
  <g class="pill pill--purple pill--tiny" transform="translate(300 460)">
    <rect x="-65" y="-16" rx="16" ry="16" width="130" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">Feeder ${v.feederTemp}</text>
  </g>
  <g class="pill pill--purple pill--tiny" transform="translate(300 500)">
    <rect x="-65" y="-16" rx="16" ry="16" width="130" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">O₂ ${v.o2}</text>
  </g>

  <!-- Hot water pipe from boiler (red, dotted) -->
  <path class="pipeBase pipe--hot" d="M255 280 H580" stroke-dasharray="6 4" fill="none" />
  
  <!-- Mixer symbol (light gray rounded rectangle with white triangle arrow + X when closed) -->
  <g class="mixer" transform="translate(580 350)">
    <rect class="mixerBox" x="-20" y="-24" width="40" height="48" rx="8" fill="rgba(200,200,200,0.85)" stroke="rgba(150,150,150,0.4)" stroke-width="1.5"></rect>
    <path class="mixerTriangle" d="M-8 -12 L12 0 L-8 12 Z" fill="rgba(255,255,255,0.95)" stroke="rgba(180,180,180,0.3)" stroke-width="1"></path>
    ${mixerClosed ? `<path class="mixerX" d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="rgba(220,40,40,0.95)" stroke-width="3.5" stroke-linecap="round"></path>` : ""}
  </g>

  <!-- Branch to floor heating (upper path from mixer) -->
  <path class="pipeBase pipe--hot" d="M580 280 V180 H780" stroke-dasharray="6 4" fill="none" />
  <path class="pipeBase pipe--cold" d="M780 180 V280" stroke-dasharray="6 4" fill="none" />
  
  <!-- Floor heating coil (top right) -->
  <g class="floor" transform="translate(780 230)">
    <rect class="floorPlate" x="-60" y="-40" width="120" height="80" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="1"></rect>
    <path class="floorCoil" d="M-40 -15 h80 a12 12 0 0 1 0 24 h-80 a12 12 0 0 0 0 24 h80" fill="none" stroke="rgba(220,40,40,0.85)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></path>
  </g>
  
  <!-- Temperature pills for floor heating -->
  <g class="pill pill--purple" transform="translate(780 150)">
    <rect x="-45" y="-18" rx="18" ry="18" width="90" height="36"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.mixerNow}</text>
  </g>
  <g class="pill pill--purple pill--sub" transform="translate(780 190)">
    <rect x="-45" y="-16" rx="16" ry="16" width="90" height="32"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.mixerTarget}</text>
  </g>

  <!-- Branch to DHW tank (lower path from mixer) -->
  <path class="pipeBase pipe--hot" d="M580 380 H800" stroke-dasharray="6 4" fill="none" />
  <path class="pipeBase pipe--cold" d="M920 480 H800 V420 H580" stroke-dasharray="6 4" fill="none" />

  <!-- DHW tank (right side, vertical with gradient) -->
  <g class="tankWrap" transform="translate(860 400)">
    <rect class="tank" x="-80" y="-160" width="160" height="320" rx="75" fill="rgba(245,245,245,0.95)" stroke="rgba(180,180,180,0.4)" stroke-width="2"></rect>
    <rect class="tankFill" x="-74" y="-154" width="148" height="308" rx="71" fill="url(#tankGradient)"></rect>
    <!-- Internal coil (U-shaped pipes) -->
    <path class="coil coil--hot" d="M-40 -100 h80 a20 20 0 0 1 0 40 h-80" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="12" stroke-linecap="round" opacity="0.6"></path>
    <path class="coil coil--cold" d="M-40 60 h80 a20 20 0 0 0 0 40 h-80" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="12" stroke-linecap="round" opacity="0.6"></path>
  </g>

  <!-- Temperature pills for DHW tank (with gradient fills like reference) -->
  <g class="pill pill--dhw-hot" transform="translate(860 280)">
    <rect x="-45" y="-18" rx="18" ry="18" width="90" height="36" fill="url(#dhwPillGradientHot)" stroke="rgba(255,255,255,0.25)" stroke-width="1"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.dhwNow}</text>
  </g>
  <g class="pill pill--dhw-cold pill--sub" transform="translate(860 320)">
    <rect x="-45" y="-16" rx="16" ry="16" width="90" height="32" fill="url(#dhwPillGradientCold)" stroke="rgba(255,255,255,0.25)" stroke-width="1"></rect>
    <text text-anchor="middle" dominant-baseline="central">${v.dhwTarget}</text>
  </g>

  <!-- Return pipe to boiler (blue, dotted) -->
  <path class="pipeBase pipe--cold" d="M580 480 H255" stroke-dasharray="6 4" fill="none" />

  <!-- Pumps (white circles with play icon) -->
  <g class="pump ${heatingActive ? "pump--active" : ""}" transform="translate(420 280)">
    <circle class="pumpBody" r="18" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="2"></circle>
    <path class="pumpIcon" d="M-7 0 L9 -9 L9 9 Z" fill="rgba(30,30,30,0.8)"></path>
  </g>
  <g class="pump ${mixerActive ? "pump--active" : ""}" transform="translate(780 230)">
    <circle class="pumpBody" r="18" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="2"></circle>
    <path class="pumpIcon" d="M-7 0 L9 -9 L9 9 Z" fill="rgba(30,30,30,0.8)"></path>
  </g>
  <g class="pump ${dhwActive ? "pump--active" : ""}" transform="translate(800 380)">
    <circle class="pumpBody" r="18" fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.2)" stroke-width="2"></circle>
    <path class="pumpIcon" d="M-7 0 L9 -9 L9 9 Z" fill="rgba(30,30,30,0.8)"></path>
  </g>

  <!-- Flow dot paths (for animateMotion) -->
  <path id="d_hot_boiler_to_mixer" d="M255 280 H580" fill="none" />
  <path id="d_cold_mixer_to_boiler" d="M580 480 H255" fill="none" />
  <path id="d_hot_mixer_to_floor" d="M580 280 V180 H780" fill="none" />
  <path id="d_cold_floor_to_mixer" d="M780 280 V180" fill="none" />
  <path id="d_hot_mixer_to_tank" d="M580 380 H920" fill="none" />
  <path id="d_cold_tank_to_mixer" d="M920 480 H800 V420 H580" fill="none" />

  ${dots("d_hot_boiler_to_mixer", "hot", heatingActive, 12, 1.2)}
  ${dots("d_cold_mixer_to_boiler", "cold", heatingActive, 12, 1.2)}
  ${dots("d_hot_mixer_to_floor", "hot", mixerActive, 10, 1.3)}
  ${dots("d_cold_floor_to_mixer", "cold", mixerActive, 10, 1.3)}
  ${dots("d_hot_mixer_to_tank", "hot", dhwActive, 10, 1.3)}
  ${dots("d_cold_tank_to_mixer", "cold", dhwActive, 10, 1.3)}
</svg>
`.trim();
}


