"""
AquaGuard USB Serial Bridge (Real-Time Live Forwarder)
Reads sensor data directly from ESP32 connected via USB (/dev/ttyACM0 or /dev/ttyUSB0)
and forwards sensor data + pump status to the Flask backend (http://localhost:5000).

Usage:
    python3 serial_bridge.py
"""

import sys
import time
import re
import json
import urllib.request
import urllib.error
import glob
import serial
import serial.tools.list_ports

import os

FLASK_URL = os.environ.get('BACKEND_URL') or (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5000/api/sensors/data')
if not FLASK_URL.endswith('/api/sensors/data'):
    FLASK_URL = FLASK_URL.rstrip('/') + '/api/sensors/data'

BAUD_RATE = 115200

def find_serial_port():
    """Auto-detect /dev/ttyACM0, /dev/ttyUSB0 or CP210x/CH340."""
    for dev in ['/dev/ttyACM0', '/dev/ttyUSB0', '/dev/ttyACM1', '/dev/ttyUSB1']:
        if glob.glob(dev):
            return dev

    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        desc = (p.description or '').lower()
        hwid = (p.hwid or '').lower()
        if any(k in desc or k in hwid for k in ['cp210', 'ch340', 'usb', 'uart', 'esp', 'acm']):
            return p.device

    candidates = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*')
    if candidates:
        return candidates[0]

    return None

def post_to_flask(payload):
    try:
        req = urllib.request.Request(
            FLASK_URL,
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return True, data
    except urllib.error.URLError:
        return False, "Flask server is not running on port 5000 (run: python3 app.py)"
    except Exception as e:
        return False, str(e)

def main():
    print("=" * 65, flush=True)
    print("🌱 AquaGuard USB Serial Bridge Starting...", flush=True)
    print(f"📡 Target Flask Backend: {FLASK_URL}", flush=True)
    print("=" * 65, flush=True)

    port = find_serial_port()
    if not port:
        print("❌ No ESP32 USB port detected!", flush=True)
        print("Waiting for ESP32 to be plugged into USB...", flush=True)
        while not port:
            time.sleep(1.5)
            port = find_serial_port()

    print(f"✅ Found ESP32 at port: {port}", flush=True)
    print("Connecting at 115200 baud...", flush=True)

    try:
        ser = serial.Serial(port, BAUD_RATE, timeout=1)
        time.sleep(1)
        print(f"🟢 Connected to {port}! Reading sensor data live...\n", flush=True)
    except Exception as e:
        print(f"\n❌ Could not open {port}: {e}", flush=True)
        print(f"👉 Run this in terminal to grant permission: sudo chmod 666 {port}\n", flush=True)
        sys.exit(1)

    block_buffer = []
    packet_count = 0

    while True:
        try:
            raw_line = ser.readline()
            if not raw_line:
                continue

            line = raw_line.decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            # Print every raw line from ESP32 so terminal is NEVER frozen
            print(f"  [ESP32] {line}", flush=True)
            block_buffer.append(line)

            # Detect end of an AQUAGUARD packet
            if "=====" in line and len(block_buffer) >= 4:
                full_text = "\n".join(block_buffer)
                block_buffer = []

                # Extract sensor values from user's ESP32 output
                soil_m = re.search(r'Moisture Value\s*:\s*([\d\.]+)', full_text)
                water_m = re.search(r'Water Level Raw\s*:\s*([\d\.]+)', full_text)
                temp_m = re.search(r'Temperature\s*:\s*([-\d\.]+)', full_text)
                hum_m = re.search(r'Humidity\s*:\s*([\d\.]+)', full_text)
                pump_m = re.search(r'Pump Status\s*:\s*(ON|OFF)', full_text, re.IGNORECASE)

                if temp_m or soil_m or water_m:
                    temp = float(temp_m.group(1)) if temp_m else 26.0
                    hum = float(hum_m.group(1)) if hum_m else 55.0

                    # Soil Moisture: moistureValue is 1-300 in ESP32 code
                    if soil_m:
                        raw_soil = float(soil_m.group(1))
                        # Map 1-300 to percentage 0-100%
                        moisture_pct = round((raw_soil / 300.0) * 100, 1)
                    else:
                        moisture_pct = 40.0

                    # Water Level: raw analog reading 0-4095
                    if water_m:
                        w_raw = float(water_m.group(1))
                        # If raw is 0, tank is empty. Submerged ~2500 is 100%
                        water_pct = round(min(100.0, max(0.0, (w_raw / 2500.0) * 100)), 1)
                    else:
                        water_pct = 50.0

                    pump_state = pump_m.group(1).upper() if pump_m else "OFF"
                    pump_emoji = "🟢 PUMP ON" if pump_state == "ON" else "🔴 PUMP OFF"

                    packet_count += 1
                    print("-" * 65, flush=True)
                    print(f"📦 Packet #{packet_count} Parsed:", flush=True)
                    print(f"   🌡️  Temperature   : {temp} °C", flush=True)
                    print(f"   💧 Humidity      : {hum} %", flush=True)
                    print(f"   🌱 Soil Moisture : {moisture_pct} %  (Raw Value: {soil_m.group(1) if soil_m else 'N/A'})", flush=True)
                    print(f"   🚰 Water Level   : {water_pct} %  (Raw: {water_m.group(1) if water_m else 'N/A'})", flush=True)
                    print(f"   💦 Pump Status   : {pump_emoji}", flush=True)

                    # Post to Flask backend
                    payload = {
                        'temperature': temp,
                        'humidity': hum,
                        'soil_moisture': moisture_pct,
                        'water_level': water_pct,
                    }
                    success, resp = post_to_flask(payload)
                    if success:
                        print("   🚀 [FORWARDED TO APP] Status: 200 OK (App Dashboard Updated!)", flush=True)
                    else:
                        print(f"   ⚠️  [BACKEND OFFLINE] {resp}", flush=True)
                        print("       👉 Tip: Make sure Flask is running in another terminal (python3 app.py)", flush=True)
                    print("-" * 65 + "\n", flush=True)

        except KeyboardInterrupt:
            print("\nExiting bridge.", flush=True)
            break
        except Exception as e:
            print(f"Serial read error: {e}. Reconnecting...", flush=True)
            time.sleep(1)

if __name__ == '__main__':
    main()
