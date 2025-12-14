export type HassEntity = {
  state: string;
  attributes: Record<string, unknown>;
};

export type HomeAssistant = {
  states: Record<string, HassEntity | undefined>;
  localize?: (key: string, ...args: unknown[]) => string;
};

export type LovelaceCardEditor = HTMLElement;

export type LovelaceCard = HTMLElement & {
  setConfig(config: unknown): void;
  getCardSize?(): number;
  hass?: HomeAssistant;
};


