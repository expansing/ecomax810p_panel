# ecoMAX810P Diagram Card (Home Assistant Lovelace)

A custom Lovelace card that visualizes a **Plum ecoMAX 810P-L Touch** boiler + mixer loop in a single diagram, with **animated flow indicators** driven by Home Assistant entities.

![ecoMAX810P Diagram Card preview](docs/ecomax810p-diagram-card-preview.svg)

## Install (HACS)

1. HACS → **Frontend**
2. **Custom repositories**
3. Add this repository URL and select category **Lovelace**
4. Install **ecoMAX810P Diagram Card**
5. Restart Home Assistant (recommended)
6. Ensure the resource is added (HACS usually does this automatically):
   - `/hacsfiles/ecomax810p-diagram-card/ecomax810p-diagram-card.js`

If it’s not added automatically, add it manually in **Settings → Dashboards → Resources** as a **module**.

If you don’t see updates after upgrading:
- Remove any old resource entries (especially ones pointing to `dist/...`)
- Hard-refresh the browser (or clear site data for your Home Assistant URL)
- As a last resort, add a cache-buster to the resource URL, e.g. `.../ecomax810p-diagram-card.js?v=1`

## Usage

Add a manual card (or use the visual editor):

```yaml
type: custom:ecomax810p-diagram-card
title: ecoMAX810P
layout: auto
breakpoint: 700
show_diagnostics: true
extra_tiles:
  - entity: sensor.ecomax_810p_l_touch_connected_modules
    label: Modules
    icon: alert
    format: raw
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
- `layout` (optional, default `auto`): `auto` | `mobile` | `desktop`
- `breakpoint` (optional, default `700`): width in px used for `layout: auto`
- `show_diagnostics` (optional, default `true`): show the secondary diagnostics grid (fan output, flue/feeder temperature, O₂ level, circulation pump, lighter, operating modes). Primary values (boiler/heating/DHW temperatures, boiler load, fuel level, outdoor temperature) always appear once, on the system diagram.
- `extra_tiles` (optional): list of additional diagnostic tiles. Each item supports `entity`, optional `label`, optional `icon` (`thermo|fire|fan|pump|alert`), and optional `format` (`auto|raw|temp|pct|onoff`).
- `entities` (required): mapping of your ecoMAX entities (see example above)

The card automatically follows the active Home Assistant theme (light/dark).

## Development

- Source: `src/` (TypeScript)
- Built artifact committed for HACS: `ecomax810p-diagram-card.js`
- Run `npm install`, `npm run check`, and `npm run build` before submitting a change. Commit the regenerated root bundle with source changes.
- Build tooling is included (`rollup.config.mjs`), but Home Assistant only needs the root card file.


