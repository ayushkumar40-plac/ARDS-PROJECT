/* ============================================================================
 *  ARDS — Gait Speed & Pressure Data Collector
 *  ---------------------------------------------------------------------------
 *  Hardware : ESP32 (Classic BT) + HX711 load-cell amplifier + MPU6050 IMU
 *  Purpose  : Collect ground-reaction-force (pressure) and IMU data, detect
 *             stance/swing phases, count steps, and estimate gait speed.
 *  Output   : CSV telemetry lines over Bluetooth SPP + USB serial.
 *
 *  Line formats (newline-terminated):
 *    D,<ms>,<kg>,<ax>,<ay>,<az>,<gx>,<gy>,<gz>,<state>
 *        raw sample — force in kg, accel in m/s^2, gyro in deg/s,
 *        state: 0 = swing (foot off), 1 = stance (foot loaded)
 *    E,<ms>,<steps>,<cadence_spm>,<speed_mps>,<dist_m>,<stride_m>,<MODE>
 *        emitted on every accepted heel-strike (initial contact)
 *    S,<ms>,<steps>,<cadence_spm>,<speed_mps>,<dist_m>,<stance_pct>
 *        1 Hz session status
 *
 *  Commands (send over BT or USB, newline optional):
 *    T        tare the load cell (keep the foot OFF the sensor!)
 *    C <kg>   calibrate with a known weight, e.g.  "C 5.0"
 *    F        flip load-cell sign (if loaded readings are negative)
 *    H <m>    set user height for the stride model, e.g. "H 1.75"
 *    S <m>    override stride length directly, e.g. "S 0.65" (S 0 = auto)
 *    M <0|1>  speed mode: 0 = stride model (default), 1 = IMU/ZUPT (experimental)
 *    P        pause / resume raw "D" streaming (events & status keep flowing)
 *    R        reset session statistics
 *    ?        print configuration & status
 *
 *  Calibration is stored in flash (Preferences) and survives reboots.
 * ==========================================================================*/

#include <Arduino.h>
#include <Wire.h>
#include <HX711.h>
#include <Preferences.h>
#include "BluetoothSerial.h"

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error "Bluetooth Classic (SPP) requires an original ESP32 chip (not ESP32-S2/C3)."
#endif

/* ============================ USER SETTINGS ============================== */
#define PIN_HX_DOUT      16        // HX711 DOUT (DT)
#define PIN_HX_SCK       4         // HX711 SCK
#define PIN_I2C_SDA      21        // MPU6050 SDA
#define PIN_I2C_SCL      22        // MPU6050 SCL
#define PIN_LED          2         // onboard LED = ON while foot is loaded

#define MPU_ADDR         0x68      // AD0 -> GND (use 0x69 if AD0 -> VCC)

#define BT_NAME          "ESP32-GAIT"
#define SAMPLE_HZ        100       // main loop / IMU stream rate

/* Gait detection thresholds — tune to the user (kg measured on the cell).
 * Rough guide: stance threshold ≈ 3–5 % of the load seen on the cell while
 * standing on it. Hysteresis prevents phase flicker mid-stance. */
float stanceOnKg  = 2.0f;          // above this  -> stance  (initial contact)
float stanceOffKg = 1.2f;          // below this  -> swing    (toe off)

/* Stride-based speed model:  stride ≈ STRIDE_FACTOR × height  */
const float STRIDE_FACTOR = 0.413f;
float userHeightM     = 1.70f;
float strideOverrideM = 0.0f;      // 0 = auto from height

/* Speed mode: 0 = stride model (default), 1 = IMU/ZUPT (experimental) */
#define SPEED_MODE_STRIDE 0
#define SPEED_MODE_IMU    1
uint8_t speedMode = SPEED_MODE_STRIDE;

bool streamRaw = true;
/* ========================================================================= */

const uint32_t SAMPLE_PERIOD_US = 1000000UL / SAMPLE_HZ;
const float    SAMPLE_DT        = 1.0f / SAMPLE_HZ;
const float    G2MS2            = 9.80665f;
const float    DEG2RAD          = 0.017453292519943295f;
const float    ACCEL_LSB_PER_G  = 4096.0f;   // ±8 g  (ACCEL_CONFIG = 0x10)
const float    GYRO_LSB_PER_DPS = 65.5f;     // ±500 dps (GYRO_CONFIG = 0x08)

const float    FORCE_ALPHA     = 0.25f;      // pressure EMA smoothing
const uint32_t MIN_STEP_MS     = 250;        // debounce: max 240 steps/min
const uint32_t STEP_WINDOW_MS  = 30000;      // cadence/speed rolling window
const uint32_t GAIT_TIMEOUT_MS = 3000;       // idle -> gait inactive (IMU mode)

HX711           loadcell;
BluetoothSerial SerialBT;
Preferences     prefs;

/* ----------------------------- gait state ------------------------------- */
enum FootState : uint8_t { FOOT_SWING = 0, FOOT_STANCE = 1 };
FootState footState = FOOT_SWING;

float    forceKg       = 0.0f;              // latest raw cell reading (kg)
float    forceSmoothKg = 0.0f;              // EMA-filtered reading

uint32_t stepCount     = 0;
float    distanceM     = 0.0f;
float    cadenceSpm    = 0.0f;              // EMA of rolling cadence
float    speedMps      = 0.0f;              // EMA of per-step speed
uint32_t lastStepMs    = 0;
bool     sessionActive = false;

#define STEP_WIN 12
uint32_t stepTimes[STEP_WIN];
uint8_t  stepWinLen = 0;

/* last-second stance ratio (for status line) */
uint16_t stanceSamples = 0, totalSamples = 0;

/* --------------------------- MPU6050 state ------------------------------ */
float axMs2 = 0, ayMs2 = 0, azMs2 = 0;       // body-frame accel (m/s^2)
float gxDps = 0, gyDps = 0, gzDps = 0;       // body-frame gyro  (deg/s)

/* --------------------- IMU/ZUPT speed estimation ------------------------ */
/* Mahony attitude filter (body -> world); horizontal acceleration is
 * integrated only during swing, and velocity is zeroed at every stance
 * phase (zero-velocity update, ZUPT) using the load cell as ground truth. */
float q0 = 1.0f, q1 = 0.0f, q2 = 0.0f, q3 = 0.0f;
const float twoKp = 2.0f, twoKi = 0.0f;
float iFBx = 0, iFBy = 0, iFBz = 0;

float velX = 0, velY = 0, posX = 0, posY = 0; // world-frame state (m, m/s)
float lastPosX = 0, lastPosY = 0;             // position at last heel strike

/* ------------------------------ utilities ------------------------------- */
static float invSqrt(float x) {
  float halfx = 0.5f * x;
  float y = x;
  union { float f; uint32_t u; } i;
  i.f = y;
  i.u = 0x5f3759df - (i.u >> 1);
  y = i.f;
  return y * (1.5f - halfx * y * y);
}

void emitLine(const char *s) {
  Serial.print(s);
  SerialBT.print(s);
}

void emitLinef(const char *fmt, ...) {
  char buf[180];
  va_list args;
  va_start(args, fmt);
  vsnprintf(buf, sizeof(buf), fmt, args);
  va_end(args);
  emitLine(buf);
}

/* ------------------------------ MPU6050 --------------------------------- */
void mpuWrite(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();
}

bool mpuReadBurst(uint8_t *buf) {             // 14 bytes: accel + temp + gyro
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((uint8_t)MPU_ADDR, (uint8_t)14) != 14) return false;
  for (uint8_t i = 0; i < 14; i++) buf[i] = Wire.read();
  return true;
}

void mpuInit() {
  mpuWrite(0x6B, 0x80);  delay(100);          // device reset
  mpuWrite(0x6B, 0x01);                       // clock = PLL gyro-X
  mpuWrite(0x1A, 0x03);                       // DLPF 44 Hz
  mpuWrite(0x1B, 0x08);                       // gyro   ±500 dps
  mpuWrite(0x1C, 0x10);                       // accel  ±8 g
  mpuWrite(0x38, 0x00);                       // interrupts off

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x75);                           // WHO_AM_I (informational)
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MPU_ADDR, (uint8_t)1);
  uint8_t id = Wire.available() ? Wire.read() : 0;
  if (id != 0x68)
    Serial.printf("[MPU] WHO_AM_I=0x%02X (clone? continuing)\n", id);
}

/* Mahony AHRS update — gyro in rad/s, accel in m/s^2 (any consistent unit). */
void mahonyUpdate(float gx, float gy, float gz, float ax, float ay, float az, float dt) {
  float recipNorm;
  if (!((ax == 0.0f) && (ay == 0.0f) && (az == 0.0f))) {
    recipNorm = invSqrt(ax * ax + ay * ay + az * az);
    ax *= recipNorm; ay *= recipNorm; az *= recipNorm;

    float vx = q1 * q3 - q0 * q2;             // estimated gravity direction
    float vy = q0 * q1 + q2 * q3;
    float vz = q0 * q0 - 0.5f + q3 * q3;

    float ex = (ay * vz - az * vy);           // cross(measured, estimated)
    float ey = (az * vx - ax * vz);
    float ez = (ax * vy - ay * vx);

    if (twoKi > 0.0f) {
      iFBx += twoKi * ex * dt;
      iFBy += twoKi * ey * dt;
      iFBz += twoKi * ez * dt;
      gx += iFBx; gy += iFBy; gz += iFBz;
    }
    gx += twoKp * ex; gy += twoKp * ey; gz += twoKp * ez;
  }
  gx *= 0.5f * dt; gy *= 0.5f * dt; gz *= 0.5f * dt;
  float qa = q0, qb = q1, qc = q2;
  q0 += (-qb * gx - qc * gy - q3 * gz);
  q1 += ( qa * gx + qc * gz - q3 * gy);
  q2 += ( qa * gy - qb * gz + q3 * gx);
  q3 += ( qa * gz + qb * gy - qc * gx);
  recipNorm = invSqrt(q0 * q0 + q1 * q1 + q2 * q2 + q3 * q3);
  q0 *= recipNorm; q1 *= recipNorm; q2 *= recipNorm; q3 *= recipNorm;
}

/* Rotate body accel into the world frame (horizontal axes only — gravity is
 * purely vertical in the world frame, so horizontal channels are g-free). */
void worldHorizontalAccel(float &axw, float &ayw) {
  float r00 = 1.0f - 2.0f * (q2 * q2 + q3 * q3);
  float r01 = 2.0f * (q1 * q2 - q0 * q3);
  float r02 = 2.0f * (q1 * q3 + q0 * q2);
  float r10 = 2.0f * (q1 * q2 + q0 * q3);
  float r11 = 1.0f - 2.0f * (q1 * q1 + q3 * q3);
  float r12 = 2.0f * (q2 * q3 - q0 * q1);
  axw = r00 * axMs2 + r01 * ayMs2 + r02 * azMs2;
  ayw = r10 * axMs2 + r11 * ayMs2 + r12 * azMs2;
}

/* ------------------------------ gait logic ------------------------------ */
void pushStepTime(uint32_t tMs) {
  stepTimes[stepWinLen % STEP_WIN] = tMs;
  stepWinLen++;
}

/* Cadence (steps/min) from the rolling step-time window. */
float rollingCadence(uint32_t nowMs) {
  uint8_t n = 0;
  uint32_t oldest = nowMs;
  for (uint8_t i = 0; i < STEP_WIN && i < stepWinLen; i++) {
    uint32_t t = stepTimes[i];
    if (t != 0 && (nowMs - t) <= STEP_WINDOW_MS) {
      n++;
      if (t < oldest) oldest = t;
    }
  }
  if (n < 3) return 0.0f;                     // need a few steps to be stable
  return (float)n * 60000.0f / (float)(nowMs - oldest);
}

float effectiveStrideM();                     // stride length used for speed
void onHeelStrike(uint32_t nowMs);

void onHeelStrike(uint32_t nowMs) {
  if (stepCount > 0 && (nowMs - lastStepMs) < MIN_STEP_MS) return;  // debounce

  uint32_t dtStepMs = (stepCount == 0) ? 0 : (nowMs - lastStepMs);
  stepCount++;
  if (!sessionActive) { sessionActive = true; }
  pushStepTime(nowMs);

  float instantSpeed = 0.0f;
  float strideUsedM = 0.0f;

  if (speedMode == SPEED_MODE_IMU) {
    /* Displacement of the foot over the completed swing, from the
     * ZUPT-aided integration of world-frame horizontal acceleration. */
    float dx = posX - lastPosX;
    float dy = posY - lastPosY;
    float disp = sqrtf(dx * dx + dy * dy);
    lastPosX = posX;
    lastPosY = posY;
    if (stepCount > 1 && dtStepMs > 0) {
      instantSpeed = disp / ((float)dtStepMs / 1000.0f);
      distanceM += disp;
      strideUsedM = disp;
    }
  } else {
    /* Stride model: distance += stride length per step */
    strideUsedM = effectiveStrideM();
    if (stepCount > 1 && dtStepMs > 0) {
      instantSpeed = strideUsedM / ((float)dtStepMs / 1000.0f);
      distanceM += strideUsedM;
    }
  }

  /* Smooth cadence & speed (EMA) for stable telemetry */
  cadenceSpm = 0.4f * cadenceSpm + 0.6f * rollingCadence(nowMs);
  if (instantSpeed > 0.0f)
    speedMps = (speedMps == 0.0f) ? instantSpeed
                                  : 0.6f * speedMps + 0.4f * instantSpeed;
  if (speedMps > 5.0f) speedMps = 5.0f;       // sanity clamp (18 km/h)

  lastStepMs = nowMs;
  emitLinef("E,%lu,%lu,%.1f,%.2f,%.2f,%.3f,%s",
            (unsigned long)nowMs, (unsigned long)stepCount,
            cadenceSpm, speedMps, distanceM, strideUsedM,
            (speedMode == SPEED_MODE_IMU) ? "IMU" : "STRIDE");
}

void resetSession() {
  stepCount = 0;
  distanceM = 0.0f;
  cadenceSpm = 0.0f;
  speedMps = 0.0f;
  lastStepMs = 0;
  sessionActive = false;
  stepWinLen = 0;
  memset(stepTimes, 0, sizeof(stepTimes));
  velX = velY = posX = posY = 0.0f;
  lastPosX = lastPosY = 0.0f;
  Serial.println("[SESSION] reset");
  SerialBT.println("[SESSION] reset");
}

/* --------------------------- sample processing -------------------------- */
float effectiveStrideM() {
  if (strideOverrideM > 0.0f) return strideOverrideM;
  return STRIDE_FACTOR * userHeightM;
}

void sampleOnce() {
  uint32_t nowMs = millis();
  uint8_t raw[14];

  /* --- IMU @ SAMPLE_HZ --- */
  if (mpuReadBurst(raw)) {
    int16_t axr = (int16_t)((raw[0]  << 8) | raw[1]);
    int16_t ayr = (int16_t)((raw[2]  << 8) | raw[3]);
    int16_t azr = (int16_t)((raw[4]  << 8) | raw[5]);
    int16_t gxr = (int16_t)((raw[8]  << 8) | raw[9]);
    int16_t gyr = (int16_t)((raw[10] << 8) | raw[11]);
    int16_t gzr = (int16_t)((raw[12] << 8) | raw[13]);

    axMs2 = ((float)axr / ACCEL_LSB_PER_G) * G2MS2;
    ayMs2 = ((float)ayr / ACCEL_LSB_PER_G) * G2MS2;
    azMs2 = ((float)azr / ACCEL_LSB_PER_G) * G2MS2;
    gxDps = (float)gxr / GYRO_LSB_PER_DPS;
    gyDps = (float)gyr / GYRO_LSB_PER_DPS;
    gzDps = (float)gzr / GYRO_LSB_PER_DPS;

    if (speedMode == SPEED_MODE_IMU) {
      /* 1) update attitude */
      mahonyUpdate(gxDps * DEG2RAD, gyDps * DEG2RAD, gzDps * DEG2RAD,
                   axMs2, ayMs2, azMs2, SAMPLE_DT);
      /* 2) world-frame horizontal acceleration */
      float axw, ayw;
      worldHorizontalAccel(axw, ayw);
      /* 3) ZUPT: foot planted during stance -> horizontal velocity = 0 */
      bool gaitActive = (stepCount >= 2) && (nowMs - lastStepMs) <= GAIT_TIMEOUT_MS;
      if (footState == FOOT_STANCE) {
        velX = 0.0f; velY = 0.0f;
      } else if (gaitActive) {
        velX += axw * SAMPLE_DT;
        velY += ayw * SAMPLE_DT;
      }
      posX += velX * SAMPLE_DT;
      posY += velY * SAMPLE_DT;
    }
  }

  /* --- load cell (HX711 runs at 10/80 Hz — reuse last value if not ready) */
  if (loadcell.is_ready()) {
    forceKg = loadcell.get_units(1);          // kg, using calibrated scale
  }
  forceSmoothKg += FORCE_ALPHA * (forceKg - forceSmoothKg);

  /* --- stance / swing state machine with hysteresis --- */
  if (footState == FOOT_SWING && forceSmoothKg > stanceOnKg) {
    footState = FOOT_STANCE;
    onHeelStrike(nowMs);                      // swing -> stance = initial contact
  } else if (footState == FOOT_STANCE && forceSmoothKg < stanceOffKg) {
    footState = FOOT_SWING;                   // toe-off
  }
  digitalWrite(PIN_LED, footState == FOOT_STANCE ? HIGH : LOW);

  stanceSamples  += (footState == FOOT_STANCE) ? 1 : 0;
  totalSamples++;

  /* --- raw telemetry --- */
  if (streamRaw) {
    emitLinef("D,%lu,%.3f,%.3f,%.3f,%.3f,%.2f,%.2f,%.2f,%d",
              (unsigned long)nowMs, forceSmoothKg,
              axMs2, ayMs2, azMs2, gxDps, gyDps, gzDps,
              (int)footState);
  }
}

/* 1 Hz session status */
void emitStatus() {
  float stancePct = (totalSamples > 0)
                    ? 100.0f * (float)stanceSamples / (float)totalSamples : 0.0f;
  emitLinef("S,%lu,%lu,%.1f,%.2f,%.2f,%.1f",
            (unsigned long)millis(), (unsigned long)stepCount,
            cadenceSpm, speedMps, distanceM, stancePct);
  stanceSamples = 0;
  totalSamples = 0;
}

/* --------------------------- calibration (flash) ------------------------ */
void loadCalibration() {
  prefs.begin("gait", true);                  // read-only
  long   off   = prefs.getLong("off", 0);
  float  scale = prefs.getFloat("sc", 1.0f);
  prefs.end();
  loadcell.set_offset(off);
  loadcell.set_scale(scale);
  Serial.printf("[HX711] loaded calibration: offset=%ld scale=%.2f\n", off, scale);
}

void saveCalibration() {
  prefs.begin("gait", false);
  prefs.putLong("off", loadcell.get_offset());
  prefs.putFloat("sc", loadcell.get_scale());
  prefs.end();
}

void doTare() {
  Serial.println("[HX711] taring — keep the foot OFF the sensor...");
  SerialBT.println("[HX711] taring — keep the foot OFF the sensor...");
  loadcell.tare(15);                          // average 15 readings
  saveCalibration();
  emitLinef("[HX711] done. offset=%ld", (long)loadcell.get_offset());
}

void doCalibrate(float knownKg) {
  if (knownKg <= 0.0f) {
    emitLine("[ERROR] usage: C <kg>  e.g. C 5.0");
    return;
  }
  emitLinef("[HX711] place %.1f kg on the cell...", knownKg);
  float oldScale = loadcell.get_scale();
  loadcell.set_scale(1.0f);                   // work in raw counts
  delay(300);
  float rawUnits = loadcell.get_units(20);    // averaged counts - offset
  if (fabsf(rawUnits) < 1.0f) {
    loadcell.set_scale(oldScale);
    emitLine("[ERROR] no load detected — calibration aborted");
    return;
  }
  float newScale = rawUnits / knownKg;
  loadcell.set_scale(newScale);
  saveCalibration();
  emitLinef("[HX711] done. scale=%.2f (verify reading in kg)", newScale);
}

/* ------------------------------ commands -------------------------------- */
String cmdBuf;

void handleCommand(String cmd) {
  cmd.trim();
  if (cmd.length() == 0) return;
  char c0 = toupper((int)cmd[0]);
  String arg = cmd.substring(1);
  arg.trim();

  switch (c0) {
    case 'T':                                 // tare (zero)
      doTare();
      break;
    case 'C':                                 // calibrate with known mass
      doCalibrate(arg.toFloat());
      break;
    case 'F':                                 // flip load-cell sign
      loadcell.set_scale(-loadcell.get_scale());
      saveCalibration();
      emitLinef("[HX711] sign flipped. scale=%.2f", loadcell.get_scale());
      break;
    case 'H': {                               // user height (stride model)
      float h = arg.toFloat();
      if (h > 0.5f && h < 2.5f) {
        userHeightM = h;
        strideOverrideM = 0.0f;
        emitLinef("[GAIT] height=%.2f m -> stride=%.3f m",
                  userHeightM, effectiveStrideM());
      } else emitLine("[ERROR] usage: H 1.75");
      break;
    }
    case 'S': {                               // stride override
      float s = arg.toFloat();
      if (s > 0.0f && s < 3.0f) {
        strideOverrideM = s;
        emitLinef("[GAIT] stride override=%.3f m", strideOverrideM);
      } else {
        strideOverrideM = 0.0f;
        emitLinef("[GAIT] stride=auto (%.3f m)", effectiveStrideM());
      }
      break;
    }
    case 'M':                                 // speed mode
      if (arg.toInt() == 1) { speedMode = SPEED_MODE_IMU; resetSession(); }
      else                  { speedMode = SPEED_MODE_STRIDE; }
      emitLinef("[GAIT] speed mode: %s",
                speedMode == SPEED_MODE_IMU ? "IMU/ZUPT (experimental)"
                                            : "STRIDE model");
      break;
    case 'P':                                 // toggle raw stream
      streamRaw = !streamRaw;
      emitLinef("[STREAM] raw D lines %s", streamRaw ? "ON" : "OFF");
      break;
    case 'R':                                 // reset session stats
      resetSession();
      break;
    case '?':                                 // status dump
      emitLinef("[CONFIG] h=%.2fm stride=%.3fm mode=%s thresholds=%.1f/%.1fkg "
                "raw=%d scale=%.2f offset=%ld",
                userHeightM, effectiveStrideM(),
                speedMode == SPEED_MODE_IMU ? "IMU" : "STRIDE",
                stanceOnKg, stanceOffKg, streamRaw ? 1 : 0,
                loadcell.get_scale(), (long)loadcell.get_offset());
      break;
    default:
      emitLine("[ERROR] unknown command (T C F H S M P R ?)");
      break;
  }
}

void pollCommand(Stream &s) {
  while (s.available()) {
    char c = (char)s.read();
    if (c == '\r') continue;
    if (c == '\n') {
      handleCommand(cmdBuf);
      cmdBuf = "";
    } else if (cmdBuf.length() < 31) {
      cmdBuf += c;
    }
  }
}

/* ------------------------------- setup ---------------------------------- */
uint32_t nextSampleUs = 0;
uint32_t lastStatusMs = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(400000);                      // 400 kHz fast-mode I2C
  mpuInit();

  loadcell.begin(PIN_HX_DOUT, PIN_HX_SCK);    // gain 128 (channel A)
  loadCalibration();

  SerialBT.begin(BT_NAME);                    // Bluetooth device name
  Serial.println();
  Serial.println("========================================");
  Serial.printf(" ARDS Gait Node ready as \"%s\"\n", BT_NAME);
  Serial.println(" Commands: T tare | C kg calibrate | F flip sign");
  Serial.println("            H m height | S m stride | M 0/1 mode");
  Serial.println("            P raw stream | R reset | ? status");
  Serial.println("========================================");

  /* Prime the attitude filter so the first steps aren't skewed */
  for (int i = 0; i < 200; i++) {
    uint8_t b[14];
    if (mpuReadBurst(b)) {
      float ax = ((float)((int16_t)((b[0] << 8) | b[1])) / ACCEL_LSB_PER_G) * G2MS2;
      float ay = ((float)((int16_t)((b[2] << 8) | b[3])) / ACCEL_LSB_PER_G) * G2MS2;
      float az = ((float)((int16_t)((b[4] << 8) | b[5])) / ACCEL_LSB_PER_G) * G2MS2;
      float gx = ((float)(int16_t)((b[8]  << 8) | b[9]))  / GYRO_LSB_PER_DPS * DEG2RAD;
      float gy = ((float)(int16_t)((b[10] << 8) | b[11])) / GYRO_LSB_PER_DPS * DEG2RAD;
      float gz = ((float)(int16_t)((b[12] << 8) | b[13])) / GYRO_LSB_PER_DPS * DEG2RAD;
      mahonyUpdate(gx, gy, gz, ax, ay, az, 0.005f);
    }
    delay(5);
  }

  nextSampleUs = micros() + SAMPLE_PERIOD_US;
  lastStatusMs = millis();
}

/* -------------------------------- loop ---------------------------------- */
void loop() {
  /* fixed-rate sampling with catch-up guard */
  uint32_t nowUs = micros();
  if ((int32_t)(nowUs - nextSampleUs) >= 0) {
    if ((int32_t)(nowUs - nextSampleUs) > (int32_t)(SAMPLE_PERIOD_US * 10))
      nextSampleUs = nowUs + SAMPLE_PERIOD_US;  // fell behind — resync
    else
      nextSampleUs += SAMPLE_PERIOD_US;
    sampleOnce();
  }

  /* commands from USB + Bluetooth */
  pollCommand(Serial);
  pollCommand(SerialBT);

  /* 1 Hz status */
  uint32_t nowMs = millis();
  if (nowMs - lastStatusMs >= 1000) {
    lastStatusMs = nowMs;
    emitStatus();
  }
}
