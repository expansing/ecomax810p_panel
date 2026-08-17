import type { HassEntity, HomeAssistant } from "./types";
import { assertConfig, type EcoMaxDiagramCardConfig } from "./config";
import { computeValues, deriveStatus } from "./svg";
import { renderSystemDiagram } from "./system-diagram";

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
      layout: "auto",
      breakpoint: 700,
      show_diagnostics: true,
      entities: {}
    };
  }

  public setConfig(config: EcoMaxDiagramCardConfig): void {
    assertConfig(config);
    this._config = {
      layout: "auto",
      breakpoint: 700,
      show_diagnostics: true,
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

    const { title, entities, show_diagnostics, extra_tiles } = this._config;
    const narrow = this._isNarrow();
    if (narrow) this.setAttribute("data-narrow", "");
    else this.removeAttribute("data-narrow");
    const v = computeValues(this._hass, entities);
    const svg = renderSystemDiagram(v, narrow);
    const status = deriveStatus(v);

    const isDark = this._hass.themes?.darkMode === true;
    const wrapClass = ["cardShell", isDark ? "cardShell--dark" : ""].filter(Boolean).join(" ");
    const showDiagnostics = show_diagnostics !== false;

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

    const diagnosticsHtml = showDiagnostics
      ? `
  <div class="stats">
    ${tile("Fan output", v.fanPower, iconFan, v.fanRunning ? "tile--spin" : "")}
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

  ha-card{display:block;overflow:hidden;background:var(--ha-card-background,transparent)}
  .cardShell{padding:0;background:linear-gradient(145deg,#eff5f4 0%,#e3ecea 100%);color:#18302e;font-family:var(--paper-font-body1_-_font-family,system-ui)}

  .overview{min-height:86px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid rgba(20,67,62,.12)}
  .overviewEyebrow{margin:0 0 4px;color:#52716c;font-size:11px;font-weight:800;letter-spacing:0;text-transform:uppercase}
  .overviewTitle{margin:0;font-size:23px;line-height:1.1;letter-spacing:0;color:#163b37}
  .overviewStatus{display:flex;flex-direction:column;align-items:flex-end;gap:5px}
  .overviewState{padding:8px 11px;border-radius:5px;font-size:13px;font-weight:800;white-space:nowrap;display:flex;align-items:center;gap:8px}
  .overviewState::before{content:"";width:8px;height:8px;border-radius:50%;background:currentColor}
  .overviewState--active{background:#d7eee2;color:#17633c}
  .overviewState--idle{background:#e4ebe9;color:#52716c}
  .overviewState--warn{background:#fdecd2;color:#96650f}
  .overviewState--alert{background:#ffe0d9;color:#b6412d}
  .overviewState--unknown{background:#e7ebea;color:#6b7c78}
  .overviewServing{margin:0;font-size:11px;font-weight:700;color:#5c746f;white-space:nowrap}

  .diagramFrame{padding:16px 18px 4px}
  .svg{display:block;width:100%;overflow:visible}
  .svg svg{display:block;width:100%;height:auto}

  .systemSurface{fill:#f8fbfa;stroke:#d9e7e3;stroke-width:1}
  .systemGrid{fill:url(#systemGrid);color:#527b73}
  .outsideReading rect{fill:#e8f1ee;stroke:#c8dcd5;stroke-width:1}
  .outsideReading text{fill:#41665e;font-size:11px;font-weight:800;letter-spacing:0}
  .systemPipe{fill:none;stroke:#d3dfdc;stroke-width:8;stroke-linecap:round;stroke-linejoin:round}
  .systemPipe.is-active.systemPipe--hot{stroke:#d96d4f}.systemPipe.is-active.systemPipe--return{stroke:#4f99a7}
  .systemNode rect{fill:#fff;stroke:#d2e0dc;stroke-width:1.5}
  .systemNode--circuit rect{fill:#fffbf5;stroke:#efdabb}.systemNode--dhw rect{fill:#f4fbfc;stroke:#c5e0e5}
  .nodeIcon path{fill:#3f8f7e}
  .systemNode--circuit .nodeIcon path,.compactNode--circuit .nodeIcon path{fill:#b8842f}
  .systemNode--dhw .nodeIcon path,.compactNode--dhw .nodeIcon path{fill:#3f88a3}
  .nodeKicker{fill:#607b74;font-size:11px;font-weight:800;letter-spacing:0}.nodeValue{fill:#173d39;font-size:39px;font-weight:800}.nodeValue--medium{font-size:31px}
  .nodeTarget{fill:#56706b;font-size:11px;font-weight:800}.nodeCaption{fill:#52716c;font-size:11px;font-weight:800}.nodeLabel{fill:#68817c;font-size:10px;font-weight:800}.nodeDetail{fill:#234640;font-size:19px;font-weight:800}.nodeRule{stroke:#d8e5e1;stroke-width:1}
  .pumpGlyph .pumpRing{fill:none;stroke:transparent}
  .pumpGlyph.is-active .pumpRing{stroke:rgba(43,186,120,.3);stroke-width:3}
  .pumpGlyph .pumpBody{fill:#eef3f1;stroke:#c6dad4;stroke-width:1.5}
  .pumpGlyph.is-active .pumpBody{fill:#e4f6ec;stroke:#2bba78}
  .pumpGlyph .pumpBlade{fill:#aabcb8}
  .pumpGlyph.is-active .pumpBlade{fill:#1f9a5f}
  .compactNode rect{fill:#fff;stroke:#d2e0dc;stroke-width:1.5}.compactNode--circuit rect{fill:#fffbf5;stroke:#efdabb}.compactNode--dhw rect{fill:#f4fbfc;stroke:#c5e0e5}
  .compactValue{fill:#173d39;font-size:30px;font-weight:800}.compactPipe{fill:none;stroke-width:7;stroke-linecap:round;stroke:#d3dfdc}.compactPipe.is-active{stroke:#d96d4f}

  .stats{margin:0;padding:14px 18px 20px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;background:#edf4f2}
  .tile{min-height:66px;padding:9px 10px;gap:9px;display:flex;align-items:center;background:#fff;border:1px solid #d6e4df;border-radius:6px;box-shadow:none}
  .tileIcon{width:30px;height:30px;border-radius:5px;background:#e1efeb;display:grid;place-items:center;flex:0 0 auto}
  .tileIcon svg{width:17px;height:17px;fill:#1d6c61}
  .tileText{min-width:0}
  .tileValue{font-size:15px;font-weight:800;color:#1d3c38;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tileLabel{font-size:11px;font-weight:700;color:#5c746f;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tile--active{border-color:#9fd6c3;box-shadow:inset 3px 0 #2bba78}
  .tile--alert{border-color:#e99c8e;box-shadow:inset 3px 0 #db5d48}
  .tile--spin .tileIcon{background:#fff0dc}.tile--spin .tileIcon svg{fill:#c87327}

  .cardShell--dark{background:linear-gradient(145deg,#172622 0%,#101b19 100%);color:#e6f1ed}
  .cardShell--dark .overview{border-color:#2d4943;background:#192b27}.cardShell--dark .overviewEyebrow{color:#9cb8b0}.cardShell--dark .overviewTitle{color:#f0f8f5}
  .cardShell--dark .overviewServing{color:#9cb8b0}
  .cardShell--dark .overviewState--active{background:#173d2c;color:#8de0ac}
  .cardShell--dark .overviewState--idle{background:#20302c;color:#a9c0b9}
  .cardShell--dark .overviewState--warn{background:#4a3a1c;color:#f0c473}
  .cardShell--dark .overviewState--alert{background:#4a2824;color:#ffb1a3}
  .cardShell--dark .overviewState--unknown{background:#24312d;color:#8fa39d}
  .cardShell--dark .systemSurface{fill:#13211e;stroke:#2e4942}.cardShell--dark .systemGrid{color:#75988f}.cardShell--dark .outsideReading rect{fill:#20352f;stroke:#3d5d55}.cardShell--dark .outsideReading text{fill:#bad9d0}
  .cardShell--dark .systemPipe{stroke:#35514a}.cardShell--dark .systemPipe.is-active.systemPipe--hot,.cardShell--dark .compactPipe.is-active{stroke:#eb8062}.cardShell--dark .systemPipe.is-active.systemPipe--return{stroke:#63adba}
  .cardShell--dark .systemNode rect,.cardShell--dark .compactNode rect{fill:#1d302b;stroke:#38554e}.cardShell--dark .systemNode--circuit rect,.cardShell--dark .compactNode--circuit rect{fill:#332d23;stroke:#665537}.cardShell--dark .systemNode--dhw rect,.cardShell--dark .compactNode--dhw rect{fill:#1a3034;stroke:#365c64}
  .cardShell--dark .nodeIcon path{fill:#7fd0b8}.cardShell--dark .systemNode--circuit .nodeIcon path,.cardShell--dark .compactNode--circuit .nodeIcon path{fill:#e0b463}.cardShell--dark .systemNode--dhw .nodeIcon path,.cardShell--dark .compactNode--dhw .nodeIcon path{fill:#7fc4dd}
  .cardShell--dark .nodeKicker,.cardShell--dark .nodeTarget,.cardShell--dark .nodeCaption,.cardShell--dark .nodeLabel{fill:#aac4bd}.cardShell--dark .nodeValue,.cardShell--dark .compactValue,.cardShell--dark .nodeDetail{fill:#f1faf6}.cardShell--dark .nodeRule{stroke:#38554e}.cardShell--dark .compactPipe{stroke:#35514a}
  .cardShell--dark .pumpGlyph .pumpBody{fill:#1d302b;stroke:#38554e}.cardShell--dark .pumpGlyph.is-active .pumpBody{fill:#173d2c;stroke:#42c985}.cardShell--dark .pumpGlyph .pumpBlade{fill:#5c7770}.cardShell--dark .pumpGlyph.is-active .pumpBlade{fill:#5be79c}.cardShell--dark .pumpGlyph.is-active .pumpRing{stroke:rgba(66,201,133,.35)}
  .cardShell--dark .stats{background:#14231f}.cardShell--dark .tile{background:#1d302b;border-color:#38554e}.cardShell--dark .tileIcon{background:#29443d}.cardShell--dark .tileIcon svg{fill:#9de1ca}.cardShell--dark .tileValue{color:#f0f8f5}.cardShell--dark .tileLabel{color:#acc4bd}.cardShell--dark .tile--active{border-color:#478467;box-shadow:inset 3px 0 #42c985}.cardShell--dark .tile--alert{border-color:#aa5e53;box-shadow:inset 3px 0 #e57866}.cardShell--dark .tile--spin .tileIcon{background:#4a3823}.cardShell--dark .tile--spin .tileIcon svg{fill:#ffc875}

  :host([data-narrow]) .overview{min-height:76px;padding:14px 16px;gap:10px}
  :host([data-narrow]) .overviewTitle{font-size:19px}
  :host([data-narrow]) .overviewState{padding:7px 9px;font-size:12px}
  :host([data-narrow]) .diagramFrame{padding:12px 12px 2px}
  :host([data-narrow]) .stats{padding:10px 12px 14px;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
  :host([data-narrow]) .tile{min-height:58px;padding:8px}
</style>
<ha-card>
  <div class="${wrapClass}">
    <header class="overview">
      <div><p class="overviewEyebrow">Heating system</p><h2 class="overviewTitle">${esc(title ?? "ecoMAX810P")}</h2></div>
      <div class="overviewStatus">
        <div class="overviewState overviewState--${status.tone}">${esc(status.label)}</div>
        <p class="overviewServing">${esc(status.serving)}</p>
      </div>
    </header>
    <div class="diagramFrame"><div class="svg">${svg}</div></div>
    ${diagnosticsHtml}
  </div>
</ha-card>
    `.trim();
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ecomax810p-diagram-card",
  name: "ecoMAX810P Diagram Card",
  description: "Boiler, heating circuit, and domestic hot water operational overview"
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
        : key === "breakpoint"
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
    <label>Show diagnostics
      <select data-key="show_diagnostics">
        <option value="true" ${top.show_diagnostics !== false ? "selected" : ""}>true</option>
        <option value="false" ${top.show_diagnostics === false ? "selected" : ""}>false</option>
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
        if (key === "show_diagnostics") {
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


