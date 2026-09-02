#!/usr/bin/env python3
"""
ARDS — Gait Data Logger (PC receiver)
-------------------------------------
Reads the CSV telemetry stream from the ESP32 gait node (HX711 + MPU6050)
over a Bluetooth SPP serial port (or USB) and logs it to CSV.

CSV columns (union of all line types, blank where not applicable):
    type, rx_time, t_ms, kg, ax, ay, az, gx, gy, gz, state,
    steps, cadence_spm, speed_mps, dist_m, stride_m, mode, stance_pct

    D = raw sample (force + IMU + foot state)
    E = heel-strike event (step count, cadence, speed, distance)
    S = 1 Hz session status

Usage:
    # Windows: pair "ESP32-GAIT" in Bluetooth settings first, then find the
    # outgoing COM port in Device Manager (e.g. COM7):
    python gait_logger.py --port COM7

    # Linux: bind the SPP channel first
    #   sudo rfcomm bind 0 AA:BB:CC:DD:EE:FF 1
    python gait_logger.py --port /dev/rfcomm0

    # Log raw D lines only every Nth sample (CSV stays light):
    python gait_logger.py --port COM7 --raw-decim 5

    # Stop after N seconds (default: run until Ctrl+C):
    python gait_logger.py --port COM7 --duration 120

Requires:  pip install pyserial
"""

import argparse
import csv
import re
import signal
import sys
import time
from datetime import datetime
from pathlib import Path

try:
    import serial
except ImportError:
    sys.exit("pyserial is required:  pip install pyserial")

FIELDS = ["type", "rx_time", "t_ms", "kg", "ax", "ay", "az", "gx", "gy", "gz",
          "state", "steps", "cadence_spm", "speed_mps", "dist_m", "stride_m",
          "mode", "stance_pct"]

LINE_RE = re.compile(r"^([DES]),(.+)$")


def parse_line(line: str):
    """Convert one telemetry line into a dict (or None if not telemetry)."""
    line = line.strip()
    if not line:
        return None
    m = LINE_RE.match(line)
    if not m:
        return None                      # [INFO]/[ERROR] banners etc.
    tag, rest = m.group(1), m.group(2).split(",")
    row = {k: "" for k in FIELDS}
    row["type"] = tag
    row["rx_time"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    try:
        if tag == "D":                   # D,ms,kg,ax,ay,az,gx,gy,gz,state
            (row["t_ms"], row["kg"], row["ax"], row["ay"], row["az"],
             row["gx"], row["gy"], row["gz"], row["state"]) = rest[:9]
        elif tag == "E":                 # E,ms,steps,cadence,speed,dist,stride,mode
            (row["t_ms"], row["steps"], row["cadence_spm"], row["speed_mps"],
             row["dist_m"], row["stride_m"], row["mode"]) = rest[:7]
        elif tag == "S":                 # S,ms,steps,cadence,speed,dist,stancePct
            (row["t_ms"], row["steps"], row["cadence_spm"], row["speed_mps"],
             row["dist_m"], row["stance_pct"]) = rest[:6]
    except (ValueError, IndexError):
        return None
    return row


def main() -> None:
    ap = argparse.ArgumentParser(description="ARDS gait data logger")
    ap.add_argument("--port", required=True,
                    help="serial port, e.g. COM7 (Windows) or /dev/rfcomm0 (Linux)")
    ap.add_argument("--baud", type=int, default=115200)
    ap.add_argument("--out", default=None,
                    help="output CSV path (default: gait_session_<timestamp>.csv)")
    ap.add_argument("--duration", type=int, default=0,
                    help="stop after N seconds (0 = until Ctrl+C)")
    ap.add_argument("--raw-decim", type=int, default=1,
                    help="log every Nth raw D line (1 = all)")
    args = ap.parse_args()

    out_path = Path(args.out) if args.out else Path(
        f"gait_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")

    print(f"[logger] opening {args.port} @ {args.baud} baud ...")
    try:
        ser = serial.Serial(args.port, args.baud, timeout=1)
    except serial.SerialException as exc:
        sys.exit(f"[logger] could not open port: {exc}")

    running = {"flag": True}

    def stop(_sig, _frm):
        running["flag"] = False

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)

    print(f"[logger] logging to {out_path}  (Ctrl+C to stop)")
    n_rows = n_steps = 0
    t0 = time.time()
    d_count = 0
    last_event = ""

    with out_path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=FIELDS)
        writer.writeheader()
        while running["flag"]:
            raw = ser.readline().decode("utf-8", errors="replace")
            row = parse_line(raw)
            if row is None:
                txt = raw.strip()
                if txt:
                    print(f"    {txt}")          # device banners / errors
                continue
            if row["type"] == "D":
                d_count += 1
                if args.raw_decim > 1 and d_count % args.raw_decim:
                    continue                      # decimate raw samples
            writer.writerow(row)
            n_rows += 1
            if row["type"] == "E":
                n_steps = row["steps"]
                last_event = (f"step {row['steps']:>4} | cadence "
                              f"{float(row['cadence_spm']):5.1f} spm | speed "
                              f"{float(row['speed_mps']):4.2f} m/s | dist "
                              f"{float(row['dist_m']):6.2f} m | "
                              f"{row['mode']}")
                print(f"[event] {last_event}")
            if args.duration and (time.time() - t0) >= args.duration:
                print("[logger] duration reached")
                break

    ser.close()
    print(f"[logger] done. {n_rows} rows ({n_steps} steps) -> {out_path}")


if __name__ == "__main__":
    main()
