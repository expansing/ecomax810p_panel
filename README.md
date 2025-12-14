# ecoMAX810P Diagram Card (Home Assistant Lovelace)

A custom Lovelace card that visualizes a **Plum ecoMAX 810P-L Touch** boiler + mixer loop in a single diagram, with **animated flow indicators** driven by Home Assistant entities.

## Install (HACS)

1. HACS → **Frontend**
2. **Custom repositories**
3. Add this repository URL and select category **Lovelace**
4. Install **ecoMAX810P Diagram Card**
5. Restart Home Assistant (recommended)
6. Ensure the resource is added (HACS usually does this automatically):
   - `/hacsfiles/ecomax810p-diagram-card/ecomax810p-diagram-card.js`

If it’s not added automatically, add it manually in **Settings → Dashboards → Resources** as a **module**.

## Usage

Add a manual card:

```yaml
type: custom:ecomax810p-diagram-card
title: ecoMAX810P
show_left_panel: true
scale: 1
layout: auto
breakpoint: 700
show_stats: true
compact_stats_on_mobile: true
entities:
  state: sensor.ecomax_810p_l_touch_state
  alert: binary_sensor.ecomax_810p_l_touch_alert
  outside_temperature: sensor.ecomax_810p_l_touch_outside_temperature

  boiler_load: sensor.ecomax_810p_l_touch_boiler_load
  fuel_level: sensor.ecomax_810p_l_touch_fuel_level
  fan_power: sensor.ecomax_810p_l_touch_fan_power

  boiler_temperature: sensor.ecomax_810p_l_touch_heating_temperature
  boiler_target_temperature: sensor.ecomax_810p_l_touch_heating_target_temperature

  mixer_temperature: sensor.ecomax_810p_l_touch_mixer_1_mixer_temperature
  mixer_target_temperature: sensor.ecomax_810p_l_touch_mixer_1_mixer_target_temperature

  dhw_temperature: sensor.ecomax_810p_l_touch_water_heater_temperature
  dhw_target_temperature: sensor.ecomax_810p_l_touch_water_heater_target_temperature

  exhaust_temperature: sensor.ecomax_810p_l_touch_exhaust_temperature
  feeder_temperature: sensor.ecomax_810p_l_touch_feeder_temperature
  oxygen_level: sensor.ecomax_810p_l_touch_oxygen_level

  summer_mode: select.ecomax_810p_l_touch_summer_mode
  mixer_work_mode: select.ecomax_810p_l_touch_mixer_1_work_mode
  water_heater: water_heater.ecomax_810p_l_touch_indirect_water_heater

  heating_pump_running: binary_sensor.ecomax_810p_l_touch_heating_pump
  dhw_pump_running: binary_sensor.ecomax_810p_l_touch_water_heater_pump
  mixer_pump_running: binary_sensor.ecomax_810p_l_touch_mixer_1_mixer_pump

  circulation_pump_running: binary_sensor.ecomax_810p_l_touch_circulation_pump
  fan_running: binary_sensor.ecomax_810p_l_touch_fan
  exhaust_fan_running: binary_sensor.ecomax_810p_l_touch_exhaust_fan
  feeder_running: binary_sensor.ecomax_810p_l_touch_feeder
  lighter_running: binary_sensor.ecomax_810p_l_touch_lighter
```

### Config options

- `title` (optional): card title
- `show_left_panel` (optional, default `true`): show/hide the left “tiles” panel
- `scale` (optional, default `1`): scales the diagram (use e.g. `0.9` or `1.1`)
- `layout` (optional, default `auto`): `auto` | `mobile` | `desktop`
- `breakpoint` (optional, default `700`): width in px used for `layout: auto`
- `show_stats` (optional, default `true`): show a responsive stats tile grid with lots of extra values
- `compact_stats_on_mobile` (optional, default `true`): reduce spacing on mobile layout
- `entities` (required): mapping of your ecoMAX entities (see example above)

## Development

- Source: `src/` (TypeScript)
- Built artifact committed for HACS: `dist/ecomax810p-diagram-card.js`
- Build tooling is included (`rollup.config.mjs`), but Home Assistant only needs the `dist/` file.


