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

  heating_pump_running?: string;
  dhw_pump_running?: string;
  mixer_pump_running?: string;
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
};

export function assertConfig(config: unknown): asserts config is EcoMaxDiagramCardConfig {
  if (!config || typeof config !== "object") throw new Error("Invalid config");
  const c = config as Partial<EcoMaxDiagramCardConfig>;
  if (!c.type || typeof c.type !== "string") throw new Error("Missing `type`");
  if (!c.entities || typeof c.entities !== "object") throw new Error("Missing `entities`");
}


