import type { DiagramValues } from "./svg";
import type { EntityMap } from "./config";

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

/** Wraps a value so clicking it opens the entity's Home Assistant history/more-info dialog. */
function entityLink(entityId: string | undefined, content: string): string {
  if (!entityId) return content;
  return `<g class="entityLink" tabindex="0" role="button" data-entity-link="${esc(entityId)}">${content}</g>`;
}

/** CSS class added to a value when it changed since the previous render, so it can briefly flash. */
function flashClass(key: keyof DiagramValues, changed: ReadonlySet<keyof DiagramValues> | undefined): string {
  return changed?.has(key) ? " valueFlash" : "";
}

function pumpGlyph(cx: number, cy: number, active: boolean, r = 9): string {
  return `
  <g class="pumpGlyph ${active ? "is-active" : ""}" transform="translate(${cx} ${cy})">
    <circle class="pumpRing" r="${r + 3}"/>
    <circle class="pumpBody" r="${r}"/>
    <path class="pumpBlade" d="M${(-r * 0.35).toFixed(1)} ${(-r * 0.55).toFixed(1)} L${(r * 0.55).toFixed(1)} 0 L${(-r * 0.35).toFixed(1)} ${(r * 0.55).toFixed(1)} Z"/>
  </g>`;
}

/** Indicator for the external electric heating element (not part of the ecoMAX controller). */
function heaterGlyph(cx: number, cy: number, active: boolean, r = 9): string {
  return `
  <g class="heaterGlyph ${active ? "is-active" : ""}" transform="translate(${cx} ${cy})">
    <title>Electric heater ${active ? "active" : "idle"}</title>
    <circle class="heaterRing" r="${r + 3}"/>
    <circle class="heaterBody" r="${r}"/>
    <path class="heaterBolt" d="M${(r * 0.2).toFixed(1)} ${(-r * 0.8).toFixed(1)} L${(-r * 0.5).toFixed(1)} ${(r * 0.1).toFixed(1)} L${(-r * 0.05).toFixed(1)} ${(r * 0.1).toFixed(1)} L${(-r * 0.2).toFixed(1)} ${(r * 0.8).toFixed(1)} L${(r * 0.5).toFixed(1)} ${(-r * 0.1).toFixed(1)} L${(r * 0.05).toFixed(1)} ${(-r * 0.1).toFixed(1)} Z"/>
  </g>`;
}

/** Mixing valve that blends the boiler's supply on its way to the heating circuit/DHW branches. */
function mixerGlyph(cx: number, cy: number, active: boolean, r = 11): string {
  return `
  <g class="mixerGlyph ${active ? "is-active" : ""}" transform="translate(${cx} ${cy})">
    <title>Mixing valve ${active ? "active" : "idle"}</title>
    <rect class="mixerRing" x="${-(r + 4)}" y="${-(r + 4)}" width="${(r + 4) * 2}" height="${(r + 4) * 2}" rx="${((r + 4) * 0.35).toFixed(1)}"/>
    <rect class="mixerBody" x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" rx="${(r * 0.35).toFixed(1)}" transform="rotate(45)"/>
    <path class="mixerArrow" d="M${(-r * 0.45).toFixed(1)} 0 H${(r * 0.45).toFixed(1)} M0 ${(-r * 0.45).toFixed(1)} V${(r * 0.45).toFixed(1)}"/>
  </g>`;
}

function junctionGlyph(cx: number, cy: number): string {
  return `<circle class="systemJunction" cx="${cx}" cy="${cy}" r="4"/>`;
}

export function renderSystemDiagram(
  values: DiagramValues,
  entities: EntityMap,
  compact = false,
  changed?: ReadonlySet<keyof DiagramValues>
): string {
  if (compact) return renderCompactSystemDiagram(values, entities, changed);

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
    ${entityLink(entities.outside_temperature, `<text class="${flashClass("outside", changed).trim()}" text-anchor="middle" dominant-baseline="central">OUTSIDE ${esc(values.outside)}</text>`)}
  </g>

  <path class="systemPipe systemPipe--hot ${hotFlow ? "is-active" : ""}" d="M390 235 V190 H415"/>
  <path class="systemPipe systemPipe--hot ${hotFlow ? "is-active" : ""}" d="M430 175 V160"/>
  <path class="systemPipe systemPipe--return ${hotFlow ? "is-active" : ""}" d="M500 160 V190 H445"/>
  <path class="systemPipe systemPipe--return ${hotFlow ? "is-active" : ""}" d="M430 205 V300 H286"/>
  <path class="systemPipe systemPipe--return ${dhwFlow ? "is-active" : ""}" d="M680 280 H620 V300 H430"/>
  ${entityLink(entities.mixer_work_mode, mixerGlyph(430, 190, hotFlow))}
  <path class="systemPipe systemPipe--hot ${hotFlow || dhwFlow ? "is-active" : ""}" d="M286 235 H680"/>
  ${junctionGlyph(390, 235)}
  ${junctionGlyph(430, 300)}

  <g class="systemNode systemNode--boiler" transform="translate(52 100)">
    <rect width="234" height="230" rx="8"/>
    ${nodeIcon("flame", 20, 16, 0.6)}
    <text class="nodeKicker" x="44" y="31">BOILER</text>
    ${entityLink(entities.boiler_temperature, `<text class="nodeValue${flashClass("boilerNow", changed)}" x="20" y="82">${esc(values.boilerNow)}</text>`)}
    ${entityLink(entities.boiler_target_temperature, `<text class="nodeTarget${flashClass("boilerTarget", changed)}" x="20" y="106">SETPOINT ${esc(values.boilerTarget)}</text>`)}
    <line class="nodeRule" x1="20" y1="126" x2="214" y2="126"/>
    <text class="nodeLabel" x="20" y="154">OUTPUT</text>
    ${entityLink(entities.boiler_load, `<text class="nodeDetail${flashClass("boilerLoad", changed)}" x="20" y="179">${esc(values.boilerLoad)}</text>`)}
    <text class="nodeLabel" x="120" y="154">FUEL</text>
    ${entityLink(entities.fuel_level, `<text class="nodeDetail${flashClass("fuelLevel", changed)}" x="120" y="179">${esc(values.fuelLevel)}</text>`)}
    <text class="nodeCaption" x="20" y="211">HEATING PUMP · ${esc(stateLabel(values.heatingPump))}</text>
    ${pumpGlyph(207, 29, values.heatingPump)}
  </g>

  <g class="systemNode systemNode--circuit" transform="translate(380 55)">
    <rect width="228" height="105" rx="8"/>
    ${nodeIcon("radiator", 20, 16, 0.6)}
    <text class="nodeKicker" x="44" y="31">HEATING CIRCUIT</text>
    ${entityLink(entities.mixer_temperature, `<text class="nodeValue nodeValue--medium${flashClass("mixerNow", changed)}" x="20" y="70">${esc(values.mixerNow)}</text>`)}
    ${entityLink(entities.mixer_target_temperature, `<text class="nodeTarget${flashClass("mixerTarget", changed)}" x="106" y="70">TARGET ${esc(values.mixerTarget)}</text>`)}
    <text class="nodeCaption" x="20" y="94">${esc(stateLabel(values.mixerPump))} · ${esc(values.mixerMode)}</text>
    ${pumpGlyph(200, 29, values.mixerPump)}
  </g>

  <g class="systemNode systemNode--dhw" transform="translate(680 190)">
    <rect width="228" height="105" rx="8"/>
    ${nodeIcon("droplet", 20, 16, 0.6)}
    <text class="nodeKicker" x="44" y="31">HOT WATER</text>
    ${entityLink(entities.dhw_temperature, `<text class="nodeValue nodeValue--medium${flashClass("dhwNow", changed)}" x="20" y="70">${esc(values.dhwNow)}</text>`)}
    ${entityLink(entities.dhw_target_temperature, `<text class="nodeTarget${flashClass("dhwTarget", changed)}" x="106" y="70">TARGET ${esc(values.dhwTarget)}</text>`)}
    <text class="nodeCaption" x="20" y="94">${esc(stateLabel(values.dhwPump))} · ${esc(values.waterHeaterMode)}</text>
    ${pumpGlyph(200, 29, values.dhwPump)}
    ${heaterGlyph(168, 29, values.dhwElectricHeaterOn)}
  </g>
</svg>`.trim();
}

function renderCompactSystemDiagram(
  values: DiagramValues,
  entities: EntityMap,
  changed?: ReadonlySet<keyof DiagramValues>
): string {
  const hotFlow = values.heatingPump || values.mixerPump;

  return `
<svg class="systemDiagram systemDiagram--compact" viewBox="0 0 360 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ecoMAX compact heating system status">
  <rect class="systemSurface" width="360" height="420" rx="10"/>
  <rect class="systemGrid" width="360" height="420" rx="10"/>
  <g class="outsideReading" transform="translate(120 14)">
    <rect width="120" height="24" rx="4"/>
    ${entityLink(entities.outside_temperature, `<text class="${flashClass("outside", changed).trim()}" x="60" y="16" text-anchor="middle">OUTSIDE ${esc(values.outside)}</text>`)}
  </g>
  <g class="compactNode compactNode--boiler" transform="translate(14 52)">
    <rect width="332" height="112" rx="8"/>
    ${nodeIcon("flame", 16, 12, 0.55)}
    <text class="nodeKicker" x="38" y="26">BOILER</text>
    ${entityLink(entities.boiler_temperature, `<text class="compactValue${flashClass("boilerNow", changed)}" x="16" y="65">${esc(values.boilerNow)}</text>`)}
    ${entityLink(entities.boiler_target_temperature, `<text class="nodeTarget${flashClass("boilerTarget", changed)}" x="116" y="65">SETPOINT ${esc(values.boilerTarget)}</text>`)}
    <text class="nodeCaption" x="16" y="95">${esc(values.boilerLoad)} OUTPUT · ${esc(values.fuelLevel)} FUEL · ${esc(stateLabel(values.heatingPump))}</text>
    ${pumpGlyph(308, 24, values.heatingPump, 5)}
  </g>
  <path class="compactPipe systemPipe--hot ${hotFlow ? "is-active" : ""}" d="M180 235 H112"/>
  <path class="compactPipe systemPipe--hot ${hotFlow ? "is-active" : ""}" d="M105 242 V285"/>
  <path class="compactPipe systemPipe--return ${hotFlow ? "is-active" : ""}" d="M55 285 V235 H98"/>
  <path class="compactPipe systemPipe--return ${hotFlow ? "is-active" : ""}" d="M105 228 H145 V265"/>
  <path class="compactPipe systemPipe--return ${hotFlow || values.dhwPump ? "is-active" : ""}" d="M145 265 V164"/>
  <path class="compactPipe systemPipe--return ${values.dhwPump ? "is-active" : ""}" d="M310 285 V265 H145"/>
  ${entityLink(entities.mixer_work_mode, mixerGlyph(105, 235, hotFlow))}
  <path class="compactPipe systemPipe--hot ${hotFlow || values.dhwPump ? "is-active" : ""}" d="M180 164 V235 H263 V285"/>
  ${junctionGlyph(180, 235)}
  ${junctionGlyph(145, 265)}
  <g class="compactNode compactNode--circuit" transform="translate(14 285)">
    <rect width="160" height="118" rx="8"/>
    ${nodeIcon("radiator", 15, 12, 0.55)}
    <text class="nodeKicker" x="37" y="26">HEATING</text>
    ${entityLink(entities.mixer_temperature, `<text class="compactValue${flashClass("mixerNow", changed)}" x="15" y="64">${esc(values.mixerNow)}</text>`)}
    ${entityLink(entities.mixer_target_temperature, `<text class="nodeTarget${flashClass("mixerTarget", changed)}" x="15" y="84">TARGET ${esc(values.mixerTarget)}</text>`)}
    <text class="nodeCaption" x="15" y="108">${esc(stateLabel(values.mixerPump))}</text>
    ${pumpGlyph(138, 24, values.mixerPump, 5)}
  </g>
  <g class="compactNode compactNode--dhw" transform="translate(186 285)">
    <rect width="160" height="118" rx="8"/>
    ${nodeIcon("droplet", 15, 12, 0.55)}
    <text class="nodeKicker" x="37" y="26">HOT WATER</text>
    ${entityLink(entities.dhw_temperature, `<text class="compactValue${flashClass("dhwNow", changed)}" x="15" y="64">${esc(values.dhwNow)}</text>`)}
    ${entityLink(entities.dhw_target_temperature, `<text class="nodeTarget${flashClass("dhwTarget", changed)}" x="15" y="84">TARGET ${esc(values.dhwTarget)}</text>`)}
    <text class="nodeCaption" x="15" y="108">${esc(stateLabel(values.dhwPump))}</text>
    ${pumpGlyph(138, 24, values.dhwPump, 5)}
    ${heaterGlyph(114, 24, values.dhwElectricHeaterOn, 5)}
  </g>
</svg>`.trim();
}