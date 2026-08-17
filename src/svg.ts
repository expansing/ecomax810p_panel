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

export type StatusTone = "alert" | "active" | "warn" | "idle" | "unknown";

export type SystemStatus = {
  label: string;
  tone: StatusTone;
  serving: string;
};

/** Derives a normalized operating status + "serving" summary from raw ecoMAX values. */
export function deriveStatus(v: DiagramValues): SystemStatus {
  const serving =
    v.mixerPump && v.dhwPump
      ? "Serving heating + hot water"
      : v.mixerPump
        ? "Serving heating circuit"
        : v.dhwPump
          ? "Serving domestic hot water"
          : "No active demand";

  if (v.alertOn) return { label: "Alarm active", tone: "alert", serving };

  const mode = v.opMode.toLowerCase();
  if (v.opMode === "---") return { label: "Unavailable", tone: "unknown", serving: "No data" };
  if (mode.includes("kindl") || mode.includes("ignit") || mode.includes("start"))
    return { label: "Ignition", tone: "warn", serving };
  if (mode.includes("stab")) return { label: "Stabilizing", tone: "warn", serving };
  if (mode.includes("off")) return { label: "Off", tone: "idle", serving: "No active demand" };
  if (mode.includes("stand")) return { label: "Standby", tone: "idle", serving };
  if (mode.includes("heat") || mode.includes("burn") || mode.includes("work"))
    return { label: v.opMode, tone: "active", serving };
  return { label: v.opMode, tone: "idle", serving };
}


