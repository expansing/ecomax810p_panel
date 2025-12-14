import type { HomeAssistant } from "./types";
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

export class EcoMax810pDiagramCard extends HTMLElement {
  private _hass?: HomeAssistant;
  private _config?: EcoMaxDiagramCardConfig;
  private _ro?: ResizeObserver;
  private _width = 0;

  public setConfig(config: EcoMaxDiagramCardConfig): void {
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

    const { title, entities, scale, show_left_panel } = this._config;
    const narrow = this._isNarrow();
    if (narrow) this.setAttribute("data-narrow", "");
    else this.removeAttribute("data-narrow");
    const v = computeValues(this._hass, entities);
    const svg = renderDiagramSvg(v);

    const headerAttr = title ? ` header="${esc(title)}"` : "";
    const wrapClass = show_left_panel ? "wrap" : "wrap noLeft";
    const scaleVal = Number.isFinite(scale ?? NaN) ? String(scale) : "1";
    // Shift diagram left when narrow (because the left panel is hidden).
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


