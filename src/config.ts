export type EntityMap = {
  state?: string;
  alert?: string;
  connection_status?: string;
  outside_temperature?: string;

  boiler_load?: string;
  fuel_level?: string;
  fan_power?: string;

  boiler_temperature?: string;
  boiler_target_temperature?: string;

  /** Writable `switch` entity that turns the boiler controller on/off. */
  boiler_switch?: string;
  /** Writable `number` entity for the target heating temperature (enables a +/- control). */
  boiler_target_temperature_control?: string;

  mixer_temperature?: string;
  mixer_target_temperature?: string;

  /** Writable `number` entity for the target mixer/heating-circuit temperature (enables a +/- control). */
  mixer_target_temperature_control?: string;

  dhw_temperature?: string;
  dhw_target_temperature?: string;

  /** External switch (e.g. a smart plug) for an electric heating element inside the DHW tank, separate from the boiler. */
  dhw_electric_heater?: string;

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
   * Card color scheme:
   * - `auto` (default): follow Home Assistant's active light/dark mode
   * - `light`: always render the light appearance
   * - `dark`: always render the dark appearance
   */
  theme?: "auto" | "light" | "dark";

  /**
   * Show the secondary diagnostics grid (fan output, flue/feeder temperature,
   * O₂ level, circulation pump, lighter, and operating modes). Primary values
   * (boiler/heating/DHW temperatures, boiler load, fuel level) are always
   * shown once on the system diagram. Default: true.
   */
  show_diagnostics?: boolean;

  /**
   * Show interactive controls (boiler power, target temperatures, summer/winter
   * mode, mixer work mode, DHW temperature) for any of the writable entities
   * that are configured. Controls for entities you haven't mapped are simply
   * omitted. Default: true.
   */
  show_controls?: boolean;

  /**
   * Subtle motion: flowing pipes while a circuit is pumping, a gentle glow pulse
   * on the pump/fan indicator while active, a pulse on an active status pill,
   * and a brief highlight when a displayed value changes. Default: true.
   */
  show_animations?: boolean;

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


