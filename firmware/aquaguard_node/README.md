# AquaGuard Node — ESP8266 / ESP32 Firmware

App seedha ESP ke IP par HTTP karta hai (Blink ke "local mode" jaisa). Internet ya backend ki zaroorat nahi — bas phone aur ESP same WiFi par hone chahiye.

Do variants hain:

| Folder | Board |
| --- | --- |
| `aquaguard_node/` | NodeMCU 1.0 / ESP-12E / ESP8266 |
| `aquaguard_node_esp32/` | ESP32 DevKit (30-pin ya 38-pin) |

---

## Wiring — ESP8266

ESP8266 ke paas **ek hi ADC input (A0)** hai, is liye soil moisture analog rakha gaya aur water level ke liye HC-SR04 (digital) use hota hai.

| Sensor / Relay | Pin | Note |
| --- | --- | --- |
| Soil moisture (capacitive) | `A0` | ADC0 — analog out, sirf analog input |
| DHT22 (temp + humidity) | `D4` (GPIO2) | DATA pin, 10k pull-up |
| BH1750 (light) — SDA | `D2` (GPIO4) | I2C |
| BH1750 (light) — SCL | `D1` (GPIO5) | I2C |
| Relay — Drip | `D5` (GPIO14) | Channel 0 |
| Relay — Sprinkler | `D6` (GPIO12) | Channel 1 |
| HC-SR04 — TRIG | `D7` (GPIO13) | Tank ke upar, neeche facing |
| HC-SR04 — ECHO | `D8` (GPIO15) | 5V module par voltage divider zaroori |

## Wiring — ESP32

| Sensor / Relay | Pin | Note |
| --- | --- | --- |
| Soil moisture (capacitive) | `GPIO34` | ADC1_CH6 — input only, ADC2 WiFi ke saath clash karta hai |
| DHT22 (temp + humidity) | `GPIO27` | DATA pin |
| BH1750 — SDA | `GPIO21` | I2C |
| BH1750 — SCL | `GPIO22` | I2C |
| Relay — Drip | `GPIO25` | Channel 0 |
| Relay — Sprinkler | `GPIO26` | Channel 1 |
| HC-SR04 — TRIG | `GPIO18` | |
| HC-SR04 — ECHO | `GPIO19` | |

Power: relays + HC-SR04 ko board ke 5V/VIN se nahi, alag 5V supply se chalayein. Dono ka GND ESP ke GND se common zaroori hai.

---

## Calibration

Do constants sketch ke top par hain — apne sensor se numbers nikal kar replace karein.

**Soil (ESP8266, raw ADC):**

```
#define SOIL_DRY_ADC 800
#define SOIL_WET_ADC 300
```

**Soil (ESP32, millivolt):**

```
#define SOIL_DRY_MV 3200
#define SOIL_WET_MV 1200
```

Nikalne ka tareeqa: sketch upload karke `/sensors` kholein, sensor ko haath se sukha kar dekhein (dry), phir ek glass paani mein daal kar dekhein (wet) — dono values copy kar lein.

**Tank level (dono boards):**

```
#define WATER_EMPTY_DIST_CM 100.0   // sensor se khali tank ki doori
#define WATER_FULL_DIST_CM  20.0   // sensor se bhari tank ki doori
```

In dono ki values aapas mein badal do ya ulta kar do to ulta percentage aayega.

---

## Feature toggles

```cpp
#define ULTRASONIC_ENABLED    1  // 0 = tank level reading -1 return karega
#define LIGHT_SENSOR_ENABLED  1  // 0 = BH1750 library ki zaroorat nahi
#define RELAY_ACTIVE_LOW      1  // 1 = active LOW relay modules
```

`RELAY_ACTIVE_LOW 0` kar dein agar aapka relay module HIGH par trigger hota hai.

---

## Setup

1. Arduino IDE me libraries install karein: **ArduinoJson (v7)**, **DHT sensor library (v1.4)**, **BH1750 (v1.3)**.
2. Board select karein: ESP8266 ke liye *NodeMCU 1.0 (ESP-12E)*, ESP32 ke liye *ESP32 Dev Module*.
3. Sketch me `WIFI_SSID` / `WIFI_PASS` / `DEVICE_NAME` apne hisaab se badlein.
4. Upload karein. Serial monitor **115200** par IP dikh jayega.
5. Router me us IP ka **DHCP reservation** laga dein, warna IP badal jayega aur app ka saved device kaam nahi karega.

---

## Endpoints

| Method | Path | Response |
| --- | --- | --- |
| GET | `/` | device + endpoints list |
| GET | `/info` | device_id, name, firmware, ip, rssi, uptime_s, heap, chip_model, sensors[] |
| GET | `/sensors` | soil_moisture, temperature, humidity, water_level, light_lux, rssi, relays[2] |
| GET | `/relay?index=0&state=1` | relay toggle (0 = drip, 1 = sprinkler) |
| GET | `/history` | last 120 readings from ESP ring buffer |

Sensor fail hone par us field ki value `-1` jaati hai (garbage NaN nahi).

**Safety timeout:** koi bhi relay 30 second (`RELAY_SAFE_OFF_MS`) se zyada on nahi rahega — ESP hang/reboot ho to bhi paani ka flow bandh ho jata hai.

Hostname bhi chalta hai: `http://aquaguard-node-01.local` (mDNS, sirf same WiFi par).

---

## App se pairing

App ka **Add Device** screen yeh karta hai:

1. Manual IP dalen (`192.168.100.50`) ya subnet scan chala kar ESP dhoonde.
2. Scan har IP par `/info` hit karta hai aur `device_id` match karta hai.
3. Device save ho jata hai AsyncStorage me — har baar rescan nahi karna.

---

## Troubleshooting

- **`/sensors` par `soil_moisture` hamesha 0 ya 100** — calibration values galat hain; upar wala tareeqa follow karein.
- **`water_level` -1 aa raha hai** — HC-SR04 ka ECHO 5V hai aur ESP 3.3V par hai (voltage divider lagein), ya trigger wiring check karein.
- **`temperature`/`humidity` -1** — DHT22 DATA pin par 10k pull-up resistor nahi hai, ya DHT22 DHT11 se replace ho gaya hai.
- **Scan me device nahi mil raha** — phone aur ESP same WiFi par hon, phone ka VPN off ho, aur ESP ka IP DHCP se change na ho.
- **`rssi` -80 se neeche** — signal weak hai, router ke paas rakhein.
- **Relay on hone par ESP reset** — power supply kamzor hai; separate 5V supply lagayein.
- **Relay on par sirf click nahi hota** — `RELAY_ACTIVE_LOW` value apne module ke hisaab se set karein.
