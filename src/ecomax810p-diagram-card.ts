import type { HassEntity, HomeAssistant } from "./types";
import { assertConfig, type EcoMaxDiagramCardConfig } from "./config";
import { computeValues, renderDiagramSvg } from "./svg";

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function yesNo(b: boolean): string {
  return b ? "On" : "Off";
}

function entityState(entity?: HassEntity): string | undefined {
  return entity?.state;
}

function entityUnit(entity?: HassEntity): string | undefined {
  const u = entity?.attributes?.unit_of_measurement;
  return typeof u === "string" ? u : undefined;
}

function fmtAuto(entity?: HassEntity): string {
  if (!entity) return "---";
  const s = entityState(entity);
  if (s == null) return "---";
  const unit = entityUnit(entity);
  const n = Number(s);
  if (Number.isFinite(n) && unit === "°C") return `${Math.round(n)}°C`;
  if (Number.isFinite(n) && unit === "%") return `${Math.round(n)}%`;
  if (s === "on" || s === "off") return s === "on" ? "On" : "Off";
  return String(s);
}

export class EcoMax810pDiagramCard extends HTMLElement {
  private _hass?: HomeAssistant;
  private _config?: EcoMaxDiagramCardConfig;
  private _ro?: ResizeObserver;
  private _width = 0;

  public static getConfigElement(): HTMLElement {
    return document.createElement("ecomax810p-diagram-card-editor");
  }

  public static getStubConfig(): Partial<EcoMaxDiagramCardConfig> {
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

  public setConfig(config: EcoMaxDiagramCardConfig): void {
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
      ...config
    };
    this._render();
  }

  public getCardSize(): number {
    return 6;
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._render();
  }

  get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  connectedCallback(): void {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._ro) {
      this._ro = new ResizeObserver((entries) => {
        const w = entries[0]?.contentRect?.width ?? 0;
        // Avoid thrashing: only rerender on meaningful changes.
        if (Math.abs(w - this._width) < 1) return;
        this._width = w;
        this._render();
      });
      this._ro.observe(this);
    }
    this._render();
  }

  disconnectedCallback(): void {
    this._ro?.disconnect();
    this._ro = undefined;
  }

  private _isNarrow(): boolean {
    const layout = this._config?.layout ?? "auto";
    if (layout === "mobile") return true;
    if (layout === "desktop") return false;
    const bp = this._config?.breakpoint ?? 700;
    return (this._width || this.getBoundingClientRect().width || 0) > 0
      ? (this._width || this.getBoundingClientRect().width) < bp
      : false;
  }

  private _render(): void {
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
    const svg = renderDiagramSvg(v, { backgroundUrl: background_url });

    const headerAttr = title ? ` header="${esc(title)}"` : "";
    const wrapClass = show_left_panel ? "wrap" : "wrap noLeft";
    const scaleVal = Number.isFinite(scale ?? NaN) ? String(scale) : "1";
    const xOffsetVal = `${Number.isFinite(diagram_offset_x ?? NaN) ? diagram_offset_x : 0}px`;
    const yOffsetVal = `${Number.isFinite(diagram_offset_y ?? NaN) ? diagram_offset_y : 0}px`;
    const showStats = show_stats !== false;
    const compactStats = !!compact_stats_on_mobile && narrow;

    const tile = (label: string, value: string, icon: string, className = ""): string => `
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

    const iconByKey: Record<string, string> = {
      thermo: iconThermo,
      fire: iconFire,
      fan: iconFan,
      pump: iconPump,
      alert: iconAlert
    };

    const extraTilesHtml =
      Array.isArray(extra_tiles) && extra_tiles.length
        ? extra_tiles
            .map((t) => {
              const ent = this._hass?.states?.[t.entity];
              const label = t.label ?? t.entity;
              const icon = iconByKey[t.icon ?? "thermo"] ?? iconThermo;
              const raw = entityState(ent) ?? "---";
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

  .mixerBox{filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}
  .mixerTriangle{filter:drop-shadow(0 1px 2px rgba(0,0,0,.15))}
  .mixerX{stroke-linecap:round}

  .pipeBase{fill:none;stroke-width:12;stroke-linecap:round;stroke-linejoin:round;opacity:.9}
  .pipe--hot{stroke:rgba(220,40,40,.95)}
  .pipe--cold{stroke:rgba(0,150,220,.95)}

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
  .leftPanel .panelAlert{fill:rgba(220,40,40,.95);font-size:22px;font-weight:900;letter-spacing:2px}

  :host([data-narrow]) .leftPanel{display:none}
  :host([data-narrow]) .pill text{font-size:18px}
  :host([data-narrow]) .pill--sub text{font-size:15px}

  /* Stats grid */
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

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ecomax810p-diagram-card",
  name: "ecoMAX810P Diagram Card",
  description: "Boiler+mixer diagram with animated flow indicators"
});

if (!customElements.get("ecomax810p-diagram-card")) {
  customElements.define("ecomax810p-diagram-card", EcoMax810pDiagramCard);
}

type EditorConfig = EcoMaxDiagramCardConfig;

class EcoMax810pDiagramCardEditor extends HTMLElement {
  private _hass?: HomeAssistant;
  private _config?: EditorConfig;

  set hass(hass: HomeAssistant) {
    this._hass = hass;
    this._render();
  }

  setConfig(config: EditorConfig): void {
    this._config = config;
    this._render();
  }

  private _valueChanged(ev: Event): void {
    if (!this._config) return;
    const target = ev.currentTarget as any;
    const key = target?.dataset?.key as string | undefined;
    if (!key) return;

    const value = (ev as CustomEvent)?.detail?.value ?? target?.value;

    const newConfig: EditorConfig = {
      ...this._config,
      entities: {
        ...(this._config.entities ?? {}),
        [key]: value || undefined
      }
    };

    this._config = newConfig;
    this._fireChanged();
  }

  private _topValueChanged(ev: Event): void {
    if (!this._config) return;
    const target = ev.currentTarget as any;
    const key = target?.dataset?.key as string | undefined;
    if (!key) return;

    const raw = (ev as CustomEvent)?.detail?.value ?? target?.value;
    const value =
      raw === "" || raw == null
        ? undefined
        : key === "breakpoint" || key === "scale" || key === "diagram_offset_x" || key === "diagram_offset_y"
          ? Number(raw)
          : raw;

    const newConfig: EditorConfig = { ...this._config, [key]: value } as EditorConfig;
    this._config = newConfig;
    this._fireChanged();
  }

  private _addExtraTile(): void {
    if (!this._config) return;
    const tiles = Array.isArray(this._config.extra_tiles) ? [...this._config.extra_tiles] : [];
    tiles.push({ entity: "", label: "", icon: "thermo", format: "auto" });
    this._config = { ...this._config, extra_tiles: tiles };
    this._fireChanged();
    this._render();
  }

  private _removeExtraTile(idx: number): void {
    if (!this._config) return;
    const tiles = Array.isArray(this._config.extra_tiles) ? [...this._config.extra_tiles] : [];
    tiles.splice(idx, 1);
    this._config = { ...this._config, extra_tiles: tiles };
    this._fireChanged();
    this._render();
  }

  private _extraTileChanged(ev: Event): void {
    if (!this._config) return;
    const target = ev.currentTarget as any;
    const idx = Number(target?.dataset?.idx);
    const key = target?.dataset?.key as string | undefined;
    if (!Number.isFinite(idx) || !key) return;

    const value = (ev as CustomEvent)?.detail?.value ?? target?.value;
    const tiles = Array.isArray(this._config.extra_tiles) ? [...this._config.extra_tiles] : [];
    const t = { ...(tiles[idx] ?? { entity: "" }) } as any;
    t[key] = value;
    tiles[idx] = t;
    this._config = { ...this._config, extra_tiles: tiles };
    this._fireChanged();
  }

  private _fireChanged(): void {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true
      })
    );
  }

  private _row(label: string, key: string): string {
    const value = (this._config?.entities as any)?.[key] ?? "";
    // ha-entity-picker exists in HA frontend; fallback to textfield if not.
    return `
      <div class="row">
        <div class="rowLabel">${esc(label)}</div>
        <ha-entity-picker data-key="${esc(key)}" .hass=${""} value="${esc(value)}"></ha-entity-picker>
      </div>
    `;
  }

  private _render(): void {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._config) {
      this.shadowRoot!.innerHTML = `<style>:host{display:block;padding:12px}</style><div>Configure ecoMAX810P card…</div>`;
      return;
    }

    // Build rows in HTML; then wire up hass/pickers after innerHTML.
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

    const top = this._config;
    const extraTiles = Array.isArray(top.extra_tiles) ? top.extra_tiles : [];

    this.shadowRoot!.innerHTML = `
<style>
  :host{display:block;padding:12px}
  .section{margin:10px 0 16px}
  .sectionTitle{font-weight:800;margin:8px 0}
  .row{display:grid;grid-template-columns:180px 1fr;gap:10px;align-items:center;margin:8px 0}
  .rowLabel{opacity:.85;font-weight:700}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .btn{margin-top:8px;padding:10px 12px;border-radius:10px;border:1px solid rgba(0,0,0,.2);cursor:pointer}
  .extraTile{border:1px solid rgba(0,0,0,.15);border-radius:12px;padding:10px;margin:10px 0}
  .extraTileHeader{display:flex;justify-content:space-between;align-items:center;font-weight:800}
  select,input{width:100%}
</style>

<div class="section">
  <div class="sectionTitle">Layout</div>
  <div class="grid2">
    <label>Background URL
      <input data-key="background_url" placeholder="/local/ecomax/diagram.png" value="${esc(String((top as any).background_url ?? ""))}"/>
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
      <select data-key="show_left_panel">
        <option value="true" ${top.show_left_panel !== false ? "selected" : ""}>true</option>
        <option value="false" ${top.show_left_panel === false ? "selected" : ""}>false</option>
      </select>
    </label>
    <label>Diagram offset X (px)
      <input data-key="diagram_offset_x" type="number" value="${esc(String(top.diagram_offset_x ?? 0))}"/>
    </label>
    <label>Diagram offset Y (px)
      <input data-key="diagram_offset_y" type="number" value="${esc(String(top.diagram_offset_y ?? 0))}"/>
    </label>
    <label>Show stats
      <select data-key="show_stats">
        <option value="true" ${top.show_stats !== false ? "selected" : ""}>true</option>
        <option value="false" ${top.show_stats === false ? "selected" : ""}>false</option>
      </select>
    </label>
    <label>Compact stats on mobile
      <select data-key="compact_stats_on_mobile">
        <option value="true" ${top.compact_stats_on_mobile !== false ? "selected" : ""}>true</option>
        <option value="false" ${top.compact_stats_on_mobile === false ? "selected" : ""}>false</option>
      </select>
    </label>
  </div>
</div>

<div class="section">
  <div class="sectionTitle">Entities</div>
  ${rows
    .map(([label, key]) => {
      const value = (top.entities as any)?.[key] ?? "";
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
  <div>Use this to add any additional entities from your ecoMAX integration without editing code.</div>
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

    // Wire up entity pickers + hass + filtering
    const pickers = Array.from(this.shadowRoot!.querySelectorAll("ha-entity-picker")) as any[];
    for (const p of pickers) {
      p.hass = this._hass;
      // Restrict to relevant domains for convenience
      p.includeDomains = ["sensor", "binary_sensor", "select", "water_heater", "number", "switch"];
      p.addEventListener("value-changed", (ev: Event) => {
        const idx = (p as any).dataset?.idx;
        if (idx != null) this._extraTileChanged(ev);
        else this._valueChanged(ev);
      });
    }

    // Wire other inputs/selects
    const inputs = Array.from(this.shadowRoot!.querySelectorAll("input[data-key],select[data-key]")) as any[];
    for (const el of inputs) {
      el.addEventListener("change", (ev: Event) => {
        const key = (el as any).dataset?.key;
        const raw = (el as any).value;
        if (key === "show_left_panel" || key === "show_stats" || key === "compact_stats_on_mobile") {
          (ev as any).detail = { value: raw === "true" };
        } else {
          (ev as any).detail = { value: raw };
        }
        this._topValueChanged(ev);
      });
    }

    const addBtn = this.shadowRoot!.querySelector("#addTile");
    addBtn?.addEventListener("click", () => this._addExtraTile());
    const removeBtns = Array.from(this.shadowRoot!.querySelectorAll("button[data-remove]")) as HTMLButtonElement[];
    for (const b of removeBtns) {
      b.addEventListener("click", () => this._removeExtraTile(Number((b as any).dataset?.remove)));
    }

    const extraControls = Array.from(this.shadowRoot!.querySelectorAll("[data-idx][data-key]:not(ha-entity-picker)")) as any[];
    for (const el of extraControls) {
      el.addEventListener("change", (ev: Event) => this._extraTileChanged(ev));
      el.addEventListener("input", (ev: Event) => this._extraTileChanged(ev));
    }
  }
}

if (!customElements.get("ecomax810p-diagram-card-editor")) {
  customElements.define("ecomax810p-diagram-card-editor", EcoMax810pDiagramCardEditor);
}


