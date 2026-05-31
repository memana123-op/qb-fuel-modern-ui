# qb-fuel

Modern QBCore fuel system for FiveM with a redesigned NUI fuel purchase panel, nozzle-based pump flow, vehicle fuel syncing, jerry can support, and LegacyFuel-compatible exports.

Resource path:

```text
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel
```

## Features

- QBCore fuel consumption and fuel sync.
- Pump nozzle pickup, attach, remove, and refuel flow.
- Redesigned dark-glass NUI fuel UI.
- Vehicle preview image support from `html/assets/vehicles/*.png`.
- Fuel type selection:
  - Diesel
  - Economic
  - Super
  - Super Plus
- Cash/bank payment toggle in NUI.
- Server-side money validation.
- Client-side and server-side liter validation.
- Jerry can purchase, refill, and vehicle refuel support.
- LegacyFuel export compatibility via `provide 'LegacyFuel'`.

## Dependencies

Required:

```text
qb-core
qb-target
```

Make sure `qb-core` starts before `qb-fuel`.

Recommended `server.cfg` order:

```cfg
ensure qb-core
ensure qb-target
ensure qb-fuel
```

## Configuration

Main config file:

```text
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\Config.lua
```

Important values:

```lua
Config.GlobalFuelConsumptionMultiplier = 4.5
Config.SyncFuelBetweenPlayers = true
Config.FuelSyncTime = 10

Config.MoneyType = 'cash'
Config.FuelPrice = 10

Config.FuelTypes = {
    diesel = 1.0,
    economic = 2.0,
    super = 3.0,
    ['super-plus'] = 2.0
}

Config.RefillTimePerLitre = 0.5
```

Fuel type price is calculated as:

```lua
finalPrice = litres * Config.FuelPrice * Config.FuelTypes[fuelType]
```

Example:

```text
10 litres of Super = 10 * 10 * 3.0 = $300
```

## NUI Fuel UI

NUI files:

```text
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\html\index.html
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\html\style.css
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\html\app.js
```

Vehicle images:

```text
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\html\assets\vehicles
```

The client sends the current vehicle model to NUI as `imageModel`. The UI then tries to load:

```text
html/assets/vehicles/MODELNAME.png
```

If the image is missing, it falls back to:

```text
html/assets/vehicles/adder.png
```

## Fuel Amount Behavior

The fuel gauge and fuel amount slider are intentionally separate:

- Gauge shows the current vehicle fuel.
- Slider shows how many litres the player wants to buy.
- Slider always starts from `0`.
- If the vehicle is full, the slider stays at `0` and purchase stays disabled.
- Total price updates from selected litres and selected fuel type.

This avoids the old bug where the slider started from half/full when the vehicle already had fuel.

## Usage

Pump flow:

1. Use `qb-target` on a fuel pump.
2. Select `Get Nozzle`.
3. Attach the nozzle to the vehicle.
4. The fuel UI opens.
5. Select fuel type and amount.
6. Choose cash or bank.
7. Press `Purchase`.

Jerry can flow:

1. Buy a jerry can from a pump target option.
2. Hold the petrol can weapon.
3. Use vehicle target to refuel from the can.

## Exports

Client exports:

| Name | Arguments | Return |
| --- | --- | --- |
| `GetFuel` | `vehicle` | `number` |
| `SetFuel` | `vehicle, number` | `void` |

Examples:

```lua
local fuel = exports['qb-fuel']:GetFuel(vehicle)
exports['qb-fuel']:SetFuel(vehicle, 75)
```

LegacyFuel compatibility:

```lua
local fuel = exports['LegacyFuel']:GetFuel(vehicle)
exports['LegacyFuel']:SetFuel(vehicle, 75)
```

## Security Notes

Do not trust NUI/client data for payment or fuel amount.

This resource validates:

- Player exists on the server.
- Litres are numeric and greater than `0`.
- Litres do not exceed allowed limits.
- Payment method is limited to `bank` or configured cash type.
- Player has enough money before fuel is applied.

Important files:

```text
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\client\main.lua
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\server\main.lua
```

## Optimization Notes

- No constant `0ms` NUI loops are used.
- The UI updates from NUI messages and pointer input only.
- Nozzle rope distance checks run every `500ms`.
- Nozzle attached cleanup checks run every `1000ms`.
- Blips are cleared on unload/resource stop to avoid duplicates.
- Target setup is guarded to avoid duplicated target registration after repeated init.

## Troubleshooting

### UI does not open

Check:

```text
ensure qb-core
ensure qb-target
ensure qb-fuel
```

Also confirm `qb-fuel` is running:

```text
refresh
restart qb-fuel
```

### Vehicle image is missing

Add the image here:

```text
C:\Users\Admin\FXServer\txData\QBCore_18885C.base\resources\[qb]\qb-fuel\html\assets\vehicles
```

File name should match the lower-case vehicle display model, for example:

```text
rhapsody.png
baller4.png
adder.png
```

### Slider starts from the wrong position

Restart the resource to clear old NUI cache:

```text
restart qb-fuel
```

If it still shows old CSS/JS, relog or restart the server.

### Purchase does nothing

Check:

- Vehicle has nozzle attached.
- Vehicle is not already full.
- Selected litre amount is greater than `0`.
- Player has enough cash/bank balance.
- Server console has no Lua errors.

## Development Preview

For local UI preview, a temporary browser preview can be served from:

```text
http://127.0.0.1:51873/preview-browser.html
```

This preview is for visual testing only. The real FiveM NUI page is:

```text
html/index.html
```
