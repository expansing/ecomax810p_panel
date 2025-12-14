export type EntityMap = {
  state?: string;
  alert?: string;
  outside_temperature?: string;

  boiler_load?: string;
  fuel_level?: string;
  fan_power?: string;

  boiler_temperature?: string;
  boiler_target_temperature?: string;

  mixer_temperature?: string;
  mixer_target_temperature?: string;

  dhw_temperature?: string;
  dhw_target_temperature?: string;

  exhaust_temperature?: string;
  feeder_temperature?: string;
  oxygen_level?: string;

  summer_mode?: string;
  mixer_work_mode?: string;
  water_heater?: string;

  heating_pump_running?: string;
  dhw_pump_running?: string;
  mixer_pump_running?: string;

  circulation_pump_running?: string;
  fan_running?: string;
  exhaust_fan_running?: string;
  feeder_running?: string;
  lighter_running?: string;
};

export type EcoMaxDiagramCardConfig = {
  type: string;
  title?: string;
  entities: EntityMap;

  /** Scale the entire diagram. */
  scale?: number;

  /** Optional: show a compact left panel like the original screen. */
  show_left_panel?: boolean;

  /**
   * Responsive layout:
   * - `auto` (default): switch based on card width
   * - `mobile`: force mobile layout
   * - `desktop`: force desktop layout
   */
  layout?: "auto" | "mobile" | "desktop";

  /** Width breakpoint (px) used when `layout: auto`. Default: 700. */
  breakpoint?: number;

  /** Show a stats grid with lots of extra information (recommended). Default: true. */
  show_stats?: boolean;

  /** When `show_stats` is enabled, show compact tiles on narrow layout. Default: true. */
  compact_stats_on_mobile?: boolean;

  /**
   * Diagram offsets (px). Useful for pixel-perfect alignment across different layouts.
   * Default: 0/0.
   */
  diagram_offset_x?: number;
  diagram_offset_y?: number;

  /**
   * Add any extra tiles you want rendered in the stats grid.
   * Useful for “show everything” without changing code.
   */
  extra_tiles?: Array<{
    entity: string;
    label?: string;
    /**
     * Built-in icon key: `thermo` | `fire` | `fan` | `pump` | `alert`
     * (falls back to `thermo`).
     */
    icon?: "thermo" | "fire" | "fan" | "pump" | "alert";
    /** Value formatting. `auto` uses unit/device_class when available. */
    format?: "auto" | "raw" | "temp" | "pct" | "onoff";
  }>;

  /**
   * Optional diagram background image/SVG (served by HA), e.g.:
   * - `/local/ecomax/diagram.png`
   * - `/local/ecomax/diagram.svg`
   *
   * When set, the card renders this as the base layer and overlays animations + pills.
   */
  background_url?: string;
};

export function assertConfig(config: unknown): asserts config is EcoMaxDiagramCardConfig {
  if (!config || typeof config !== "object") throw new Error("Invalid config");
  const c = config as Partial<EcoMaxDiagramCardConfig>;
  if (!c.type || typeof c.type !== "string") throw new Error("Missing `type`");
  if (!c.entities || typeof c.entities !== "object") throw new Error("Missing `entities`");
}


