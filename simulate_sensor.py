"""
AquaGuard Sensor Simulator
Simulates an ESP32 sending sensor data to the Flask backend.
Run this while testing the app for a live demo.

Usage:
    python3 simulate_sensor.py
"""

import json
import time
import random
import urllib.request
import urllib.error

BASE_URL = 'http://localhost:5000'

# Starting values
soil_moisture = 65.0
water_level = 85.0

print('🌱 AquaGuard Sensor Simulator Started')
print('=' * 50)
print(f'Posting to: {BASE_URL}/api/sensors/data')
print('Ctrl+C to stop\n')

while True:
    temperature = round(random.uniform(22, 38), 1)
    humidity = round(random.uniform(40, 80), 1)

    # Soil slowly dries out (plant absorbs water)
    soil_moisture -= round(random.uniform(0.5, 2.0), 1)
    soil_moisture = max(5.0, soil_moisture)

    payload = {
        'temperature': temperature,
        'soil_moisture': round(soil_moisture, 1),
        'humidity': humidity,
        'water_level': round(water_level, 1),
    }

    try:
        req = urllib.request.Request(
            f'{BASE_URL}/api/sensors/data',
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode('utf-8'))

        pump_on = result.get('pump_on', False)
        pump_cmd = result.get('pump_command', '')

        pump_status = '🟢 PUMP ON' if pump_on else '🔴 PUMP OFF'
        if pump_cmd:
            pump_status += f'  ← {pump_cmd}'

        print(
            f'Temp: {temperature}°C | '
            f'Moisture: {soil_moisture:.1f}% | '
            f'Humidity: {humidity}% | '
            f'Tank: {water_level:.1f}% | '
            f'{pump_status}'
        )

        # When pump is on: moisture rises, tank drains
        if pump_on:
            soil_moisture += round(random.uniform(3, 6), 1)
            water_level -= round(random.uniform(0.5, 1.5), 1)
            water_level = max(0.0, water_level)

    except urllib.error.URLError:
        print('❌ Cannot connect to backend — make sure Flask is running (python3 app.py)')
    except Exception as e:
        print(f'Error: {e}')

    time.sleep(3)
