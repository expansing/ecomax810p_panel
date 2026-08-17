import type { DiagramValues } from "./svg";

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stateLabel(active: boolean): string {
  return active ? "Active" : "Idle";
}

const NODE_ICON_PATHS: Record<"flame" | "radiator" | "droplet", string> = {
  flame:
    "M13.5 0s.5 2.5-1 4.5S9 8 9 11a6 6 0 0 0 12 0c0-4.5-3-7-3-9.5 0 0-.5 2.5-2 4.5S13.5 0 13.5 0ZM12 24a8 8 0 0 1-8-8c0-4.5 2.5-7.5 4.5-10C8 10 12 11 12 16c0-3 2-4 3-6 0 0 5 3 5 6a8 8 0 0 1-8 8Z",
  radiator: "M4 4h16v3H4V4Zm0 5h2v11H4V9Zm4 0h2v11H8V9Zm4 0h2v11h-2V9Zm4 0h2v11h-2V9Z",
  droplet: "M12 2s7 8.5 7 13a7 7 0 1 1-14 0c0-4.5 7-13 7-13Z"
};

function nodeIcon(kind: keyof typeof NODE_ICON_PATHS, x: number, y: number, scale: number): string {
  return `<g class="nodeIcon" transform="translate(${x} ${y}) scale(${scale})"><path d="${NODE_ICON_PATHS[kind]}"/></g>`;
}

export function renderSystemDiagram(values: DiagramValues, compact = false): string {
  if (compact) return renderCompactSystemDiagram(values);

  const hotFlow = values.heatingPump || values.mixerPump;
  const dhwFlow = values.dhwPump;

  return `
<svg class="systemDiagram" viewBox="0 0 960 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX heating system status">
  <defs>
    <pattern id="systemGrid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" stroke-width="1" opacity=".06"/>
    </pattern>
  </defs>
  <rect class="systemSurface" width="960" height="350" rx="10"/>
  <rect class="systemGrid" width="960" height="350" rx="10"/>

  <g class="outsideReading" transform="translate(480 27)">
    <rect x="-76" y="-14" width="152" height="28" rx="4"/>
    <text text-anchor="middle" dominant-baseline="central">OUTSIDE ${esc(values.outside)}</text>
  </g>

  <path class="systemPipe systemPipe--hot ${hotFlow ? "is-active" : ""}" d="M286 185 H350 V112 H412"/>
  <path class="systemPipe systemPipe--return ${hotFlow ? "is-active" : ""}" d="M412 174 H350 V304 H286"/>
  <path class="systemPipe systemPipe--hot ${dhwFlow ? "is-active" : ""}" d="M286 214 H626 V242 H680"/>
  <path class="systemPipe systemPipe--return ${dhwFlow ? "is-active" : ""}" d="M680 304 H626 V334 H286"/>
  <circle class="flowJunction ${hotFlow ? "is-active" : ""}" cx="350" cy="185" r="7"/>
  <circle class="flowJunction ${dhwFlow ? "is-active" : ""}" cx="626" cy="214" r="7"/>

  <g class="systemNode systemNode--boiler" transform="translate(52 100)">
    <rect width="234" height="230" rx="8"/>
    ${nodeIcon("flame", 20, 16, 0.6)}
    <text class="nodeKicker" x="44" y="31">BOILER</text>
    <text class="nodeValue" x="20" y="82">${esc(values.boilerNow)}</text>
    <text class="nodeTarget" x="20" y="106">SETPOINT ${esc(values.boilerTarget)}</text>
    <line class="nodeRule" x1="20" y1="126" x2="214" y2="126"/>
    <text class="nodeLabel" x="20" y="154">OUTPUT</text>
    <text class="nodeDetail" x="20" y="179">${esc(values.boilerLoad)}</text>
    <text class="nodeLabel" x="120" y="154">FUEL</text>
    <text class="nodeDetail" x="120" y="179">${esc(values.fuelLevel)}</text>
    <text class="nodeCaption" x="20" y="211">HEATING PUMP · ${esc(stateLabel(values.heatingPump))}</text>
    <circle class="nodeIndicator ${values.heatingPump ? "is-active" : ""}" cx="207" cy="29" r="6"/>
  </g>

  <g class="systemNode systemNode--circuit" transform="translate(412 66)">
    <rect width="224" height="116" rx="8"/>
    ${nodeIcon("radiator", 20, 16, 0.6)}
    <text class="nodeKicker" x="44" y="31">HEATING CIRCUIT</text>
    <text class="nodeValue nodeValue--medium" x="20" y="74">${esc(values.mixerNow)}</text>
    <text class="nodeTarget" x="106" y="74">TARGET ${esc(values.mixerTarget)}</text>
    <text class="nodeCaption" x="20" y="98">${esc(stateLabel(values.mixerPump))} · ${esc(values.mixerMode)}</text>
    <circle class="nodeIndicator ${values.mixerPump ? "is-active" : ""}" cx="196" cy="29" r="6"/>
  </g>

  <g class="systemNode systemNode--dhw" transform="translate(680 216)">
    <rect width="228" height="116" rx="8"/>
    ${nodeIcon("droplet", 20, 16, 0.6)}
    <text class="nodeKicker" x="44" y="31">DOMESTIC HOT WATER</text>
    <text class="nodeValue nodeValue--medium" x="20" y="74">${esc(values.dhwNow)}</text>
    <text class="nodeTarget" x="106" y="74">TARGET ${esc(values.dhwTarget)}</text>
    <text class="nodeCaption" x="20" y="98">${esc(stateLabel(values.dhwPump))} · ${esc(values.waterHeaterMode)}</text>
    <circle class="nodeIndicator ${values.dhwPump ? "is-active" : ""}" cx="202" cy="29" r="6"/>
  </g>
</svg>`.trim();
}

function renderCompactSystemDiagram(values: DiagramValues): string {
  return `
<svg class="systemDiagram systemDiagram--compact" viewBox="0 0 360 322" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX compact heating system status">
  <rect class="systemSurface" width="360" height="322" rx="10"/>
  <rect class="systemGrid" width="360" height="322" rx="10"/>
  <g class="outsideReading" transform="translate(120 14)">
    <rect width="120" height="24" rx="4"/>
    <text x="60" y="16" text-anchor="middle">OUTSIDE ${esc(values.outside)}</text>
  </g>
  <g class="compactNode compactNode--boiler" transform="translate(14 52)">
    <rect width="332" height="112" rx="8"/>
    ${nodeIcon("flame", 16, 12, 0.55)}
    <text class="nodeKicker" x="38" y="26">BOILER</text>
    <text class="compactValue" x="16" y="65">${esc(values.boilerNow)}</text>
    <text class="nodeTarget" x="116" y="65">SETPOINT ${esc(values.boilerTarget)}</text>
    <text class="nodeCaption" x="16" y="95">${esc(values.boilerLoad)} OUTPUT · ${esc(values.fuelLevel)} FUEL · ${esc(stateLabel(values.heatingPump))}</text>
    <circle class="nodeIndicator ${values.heatingPump ? "is-active" : ""}" cx="308" cy="24" r="5"/>
  </g>
  <path class="compactPipe systemPipe--hot ${values.mixerPump ? "is-active" : ""}" d="M97 164 V184"/>
  <path class="compactPipe systemPipe--hot ${values.dhwPump ? "is-active" : ""}" d="M263 164 V184"/>
  <g class="compactNode compactNode--circuit" transform="translate(14 184)">
    <rect width="160" height="126" rx="8"/>
    ${nodeIcon("radiator", 15, 12, 0.55)}
    <text class="nodeKicker" x="37" y="26">HEATING</text>
    <text class="compactValue" x="15" y="64">${esc(values.mixerNow)}</text>
    <text class="nodeTarget" x="15" y="84">TARGET ${esc(values.mixerTarget)}</text>
    <text class="nodeCaption" x="15" y="108">${esc(stateLabel(values.mixerPump))}</text>
    <circle class="nodeIndicator ${values.mixerPump ? "is-active" : ""}" cx="138" cy="24" r="5"/>
  </g>
  <g class="compactNode compactNode--dhw" transform="translate(186 184)">
    <rect width="160" height="126" rx="8"/>
    ${nodeIcon("droplet", 15, 12, 0.55)}
    <text class="nodeKicker" x="37" y="26">HOT WATER</text>
    <text class="compactValue" x="15" y="64">${esc(values.dhwNow)}</text>
    <text class="nodeTarget" x="15" y="84">TARGET ${esc(values.dhwTarget)}</text>
    <text class="nodeCaption" x="15" y="108">${esc(stateLabel(values.dhwPump))}</text>
    <circle class="nodeIndicator ${values.dhwPump ? "is-active" : ""}" cx="138" cy="24" r="5"/>
  </g>
</svg>`.trim();
}