# ARDS — Gait Speed & Pressure Data Collector

ESP32 + **HX711 load cell** (pressure / ground reaction force) + **MPU6050**
(IMU), streaming live gait telemetry over **Bluetooth SPP** and USB.

```
firmware/gait_pressure_esp32/gait_pressure_esp32.ino   <- flash this to the ESP32
firmware/pc_logger/gait_logger.py                      <- PC-side CSV logger
```

## 1. Wiring

### HX711 ↔ ESP32
| HX711 | ESP32 | Notes |
|-------|-------|-------|
| VCC   | 3V3   | |
| GND   | GND   | |
| DT / DOUT | GPIO 16 | |
| SCK   | GPIO 4 | |

### Load cell ↔ HX711 (typical 4-wire colours)
| Load cell | HX711 |
|-----------|-------|
| Red   | E+ |
| Black | E– |
| White | A+ |
| Green | A– |

### MPU6050 ↔ ESP32
| MPU6050 | ESP32 |
|---------|-------|
| VCC | 3V3 |
| GND | GND |
| SDA | GPIO 21 |
| SCL | GPIO 22 |
| AD0 | GND (address 0x68) |

> **Tip:** the HX711 `RATE` pin decides the output rate — tie it **high (VCC)
> for 80 Hz** (recommended) or leave low for 10 Hz.

> **Board note:** Bluetooth SPP needs an **original ESP32** (WROOM/WROVER).
> ESP32-**S2/C3** have no Bluetooth Classic — ask for the BLE variant of this
> sketch if you have one.

## 2. Firmware build

1. Arduino IDE → Boards Manager → install **esp32 by Espressif Systems**.
2. Library Manager → install **HX711 by Bogdan Necula (bogde)**.
   *(No MPU6050 library is needed — the sketch talks raw I2C.)*
3. Open `gait_pressure_esp32.ino`, board = **ESP32 Dev Module**, Upload.

Open the Serial Monitor at **115200** — the node boots as Bluetooth device
**`ESP32-GAIT`**.

## 3. Calibration (one-time, saved to flash)

Send these over the Serial Monitor or a Bluetooth terminal:

1. **`T`** — tare. Nothing may be on the cell.
2. **`C 5.0`** — place a known 5 kg mass (any value works: `C 2.0`, `C 10`…).
   The scale factor is computed and stored.
3. Readings now report **kg**. If a load shows **negative** kg, send **`F`**
   to flip the sign (or swap the load-cell E+/E– wires).

Verify: your body weight should read correctly when you stand on the plate.

## 4. Gait session

| Command | Meaning |
|---------|---------|
| `H 1.75` | set user height → stride ≈ 0.413 × height (auto speed model) |
| `S 0.65` | override stride length in metres (`S 0` = back to auto) |
| `M 0` / `M 1` | speed model: stride (default) / IMU+ZUPT (experimental) |
| `P` | pause/resume raw `D` stream (events/status keep flowing) |
| `R` | reset session statistics |
| `?` | print full configuration/status |

The **onboard LED is on while the foot is loaded (stance)** — a quick way to
check the pressure thresholds. Tune `stanceOnKg` / `stanceOffKg` in the sketch
for the patient (start ≈ 3–5 % of the standing load on the cell).

## 5. Telemetry format

| Line | Meaning | Fields |
|------|---------|--------|
| `D,…` | raw @ 100 Hz | `ms, kg, ax, ay, az (m/s²), gx, gy, gz (°/s), state` — state `0`=swing, `1`=stance |
| `E,…` | heel strike | `ms, steps, cadence (spm), speed (m/s), distance (m), stride (m), model` |
| `S,…` | status @ 1 Hz | `ms, steps, cadence, speed, distance, stance %` |

**How speed is measured**

- **STRIDE (default):** heel strikes are detected when the smoothed load
  crosses `stanceOnKg` (hysteresis + 250 ms debounce). Speed = stride length
  ÷ step time, EMA-smoothed; distance accumulates stride per step.
- **IMU/ZUPT (experimental):** a Mahony filter tracks foot attitude; horizontal
  acceleration is integrated only during swing and velocity is zeroed at every
  stance (the load cell proves the foot is planted). Displacement per swing is
  the true step length — independent of height, but more sensitive to
  mounting/alignment.

## 6. Logging on the PC

```bash
pip install pyserial
# Windows — pair "ESP32-GAIT" first, then use its outgoing COM port:
python firmware/pc_logger/gait_logger.py --port COM7
# optional: --raw-decim 5 --duration 120 --out session1.csv
```

CSV columns: `type, rx_time, t_ms, kg, ax…gz, state, steps, cadence_spm,
speed_mps, dist_m, stride_m, mode, stance_pct` — ready for pandas / the ARDS
dashboard pipeline.

**Phone (quick test):** install *Serial Bluetooth Terminal*, connect to
`ESP32-GAIT`, send `?`, and watch the `D/E/S` lines live.
