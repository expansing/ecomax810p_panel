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

  /**
   * Responsive layout:
   * - `auto` (default): switch based on card width
   * - `mobile`: force the compact system view
   * - `desktop`: force the full system view
   */
  layout?: "auto" | "mobile" | "desktop";

  /** Width breakpoint (px) used when `layout: auto`. Default: 700. */
  breakpoint?: number;

  /**
   * Show the secondary diagnostics grid (fan output, flue/feeder temperature,
   * O₂ level, circulation pump, lighter, and operating modes). Primary values
   * (boiler/heating/DHW temperatures, boiler load, fuel level) are always
   * shown once on the system diagram. Default: true.
   */
  show_diagnostics?: boolean;

  /**
   * Add any extra diagnostic tiles you want rendered alongside the built-in
   * diagnostics grid. Useful for exposing additional ecoMAX entities without
   * changing code.
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
};

export function assertConfig(config: unknown): asserts config is EcoMaxDiagramCardConfig {
  if (!config || typeof config !== "object") throw new Error("Invalid config");
  const c = config as Partial<EcoMaxDiagramCardConfig>;
  if (!c.type || typeof c.type !== "string") throw new Error("Missing `type`");
  if (!c.entities || typeof c.entities !== "object") throw new Error("Missing `entities`");
}


