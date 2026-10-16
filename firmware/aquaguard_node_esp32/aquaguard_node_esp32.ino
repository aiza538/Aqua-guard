/*
 * AquaGuard Node - ESP32 firmware
 *
 * Local WiFi HTTP node. The app talks to this device directly over the LAN,
 * no internet / backend round-trip required.
 *
 * Libraries required (Arduino Library Manager):
 *   - ESP32 core (built in)
 *   - ArduinoJson  (v7.x)
 *   - DHT sensor library  (v1.4.x)
 *   - BH1750            (v1.3.x)  -> only when LIGHT_SENSOR_ENABLED is 1
 *
 * Note: ADC2 pins are unusable while WiFi is up, so everything analog is on
 * ADC1 (GPIO32-39).
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ---------------------------------------------------------------- config ----

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* DEVICE_NAME = "aquaguard-esp32-01";
const char* FW_VERSION = "1.1.0";

#define WIFI_CONNECT_TIMEOUT_MS 20000UL

// ---- pins -----------------------------------------------------------------
#define SOIL_PIN        34   // ADC1_CH6 - capacitive soil moisture, analog out
#define DHT_PIN         27   // GPIO27 - DHT22 DATA
#define I2C_SDA_PIN     21   // GPIO21 - BH1750 SDA
#define I2C_SCL_PIN     22   // GPIO22 - BH1750 SCL
#define RELAY_DRIP      25   // GPIO25 - channel 0
#define RELAY_SPRINKLER 26   // GPIO26 - channel 1
#define ULTRASONIC_TRIG 18   // GPIO18 - HC-SR04 TRIG
#define ULTRASONIC_ECHO 19   // GPIO19 - HC-SR04 ECHO

#define RELAY_ACTIVE_LOW 1

// ---- feature toggles -------------------------------------------------------
#define ULTRASONIC_ENABLED 1
#define LIGHT_SENSOR_ENABLED 1

// ---- sensor calibration ---------------------------------------------------
// Log soil_mv from /sensors in dry air and in a glass of water, then use those
// millivolt values here. Defaults suit a typical 3.3V capacitive probe.
#define SOIL_DRY_MV 3200
#define SOIL_WET_MV 1200

#define WATER_EMPTY_DIST_CM 100.0
#define WATER_FULL_DIST_CM  20.0
#define WATER_FILTER_SAMPLES 5

// ---- timing / buffers ------------------------------------------------------
#define HISTORY_MAX        120
#define POLL_INTERVAL_MS   2000UL
#define RELAY_SAFE_OFF_MS  30000UL

// ----------------------------------------------------------------- state ----

#if LIGHT_SENSOR_ENABLED
#include <Wire.h>
#include <BH1750.h>
BH1750 lightSensor;
#endif

WebServer server(80);
DHT dht(DHT_PIN, DHT22);

struct Reading {
  uint32_t ts;
  float moisture;
  float temperature;
  float humidity;
  float waterLevel;
  float lux;
};

Reading history[HISTORY_MAX];
int historyCount = 0;

uint32_t lastPoll = 0;
uint32_t relayChangedAt[2] = {0, 0};
float lastMoisture = -1;
float lastTemperature = -1;
float lastHumidity = -1;
float lastWaterLevel = -1;
float lastLux = -1;
bool dripState = false;
bool sprinklerState = false;

// --------------------------------------------------------------- helpers ----

void setRelay(uint8_t pin, bool on) {
#if RELAY_ACTIVE_LOW
  digitalWrite(pin, on ? LOW : HIGH);
#else
  digitalWrite(pin, on ? HIGH : LOW);
#endif
}

int mapLong(long value, long inLow, long inHigh, long outLow, long outHigh) {
  if (inHigh == inLow) return (int)outLow;
  long mapped = (value * (outHigh - outLow)) / (inHigh - inLow) + outLow;
  if (mapped < min(outLow, outHigh)) mapped = min(outLow, outHigh);
  if (mapped > max(outLow, outHigh)) mapped = max(outLow, outHigh);
  return (int)mapped;
}

float readWaterLevel() {
#if ULTRASONIC_ENABLED
  unsigned long distances[WATER_FILTER_SAMPLES];

  for (int i = 0; i < WATER_FILTER_SAMPLES; i++) {
    digitalWrite(ULTRASONIC_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(ULTRASONIC_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(ULTRASONIC_TRIG, LOW);

    unsigned long echo = pulseIn(ULTRASONIC_ECHO, HIGH, 30000UL);
    if (echo == 0UL) return -1;
    distances[i] = echo / 58UL;
    delay(50);
  }

  for (int i = 1; i < WATER_FILTER_SAMPLES; i++) {
    unsigned long key = distances[i];
    int j = i - 1;
    while (j >= 0 && distances[j] > key) {
      distances[j + 1] = distances[j];
      j--;
    }
    distances[j + 1] = key;
  }

  float distanceCm = distances[WATER_FILTER_SAMPLES / 2];
  return (float)mapLong((long)distanceCm, (long)WATER_EMPTY_DIST_CM,
                        (long)WATER_FULL_DIST_CM, 0, 100);
#else
  return -1;
#endif
}

float readLux() {
#if LIGHT_SENSOR_ENABLED
  if (lightSensor.initialized()) {
    return lightSensor.readLightLevel();
  }
#endif
  return -1;
}

void readSensors() {
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
  uint32_t soilMv = analogReadMilliVolts(SOIL_PIN);
  lastMoisture = (float)mapLong((long)soilMv, SOIL_DRY_MV, SOIL_WET_MV, 0, 100);
  lastTemperature = dht.readTemperature();
  lastHumidity = dht.readHumidity();
  if (isnan(lastTemperature) || isnan(lastHumidity)) {
    lastTemperature = -1;
    lastHumidity = -1;
  }
  lastWaterLevel = readWaterLevel();
  lastLux = readLux();
}

void addHistory() {
  Reading entry = {millis(), lastMoisture, lastTemperature, lastHumidity,
                   lastWaterLevel, lastLux};
  if (historyCount < HISTORY_MAX) {
    history[historyCount++] = entry;
    return;
  }
  for (int i = 1; i < HISTORY_MAX; i++) history[i - 1] = history[i];
  history[HISTORY_MAX - 1] = entry;
}

void sendJson(int code, const String& body) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(code, "application/json", body);
}

// --------------------------------------------------------------- handlers ---

void handleRoot() {
  JsonDocument doc;
  doc["device"] = DEVICE_NAME;
  doc["firmware"] = FW_VERSION;
  doc["endpoints"][] = "/info";
  doc["endpoints"][] = "/sensors";
  doc["endpoints"][] = "/relay?index=0&state=1";
  doc["endpoints"][] = "/history";
  sendJson(200, doc.as<String>());
}

void handleInfo() {
  JsonDocument doc;
  doc["device_id"] = DEVICE_NAME;
  doc["name"] = DEVICE_NAME;
  doc["firmware"] = FW_VERSION;
  doc["chip"] = (uint32_t)ESP.getEfuseMac();
  doc["mac"] = WiFi.macAddress();
  doc["ip"] = WiFi.localIP().toString();
  doc["rssi"] = WiFi.RSSI();
  doc["uptime_s"] = millis() / 1000;
  doc["heap"] = ESP.getFreeHeap();
  doc["chip_model"] = "ESP32";
  doc["relays"] = 2;
  doc["sensors"][] = "soil_moisture";
  doc["sensors"][] = "temperature";
  doc["sensors"][] = "humidity";
#if ULTRASONIC_ENABLED
  doc["sensors"][] = "water_level";
#endif
#if LIGHT_SENSOR_ENABLED
  doc["sensors"][] = "light_lux";
#endif
  sendJson(200, doc.as<String>());
}

void handleSensors() {
  if (millis() - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = millis();
    readSensors();
    addHistory();
  }

  JsonDocument doc;
  doc["device_id"] = DEVICE_NAME;
  doc["timestamp"] = millis();
  doc["soil_moisture"] = lastMoisture;
  doc["temperature"] = lastTemperature;
  doc["humidity"] = lastHumidity;
  doc["water_level"] = lastWaterLevel;
  doc["light_lux"] = lastLux;
  doc["rssi"] = WiFi.RSSI();
  doc["relays"][0] = dripState ? 1 : 0;
  doc["relays"][1] = sprinklerState ? 1 : 0;
  sendJson(200, doc.as<String>());
}

void handleRelay() {
  if (!server.hasArg("index") || !server.hasArg("state")) {
    sendJson(400, "{\"error\":\"index and state required\"}");
    return;
  }
  int index = server.arg("index").toInt();
  bool turnOn = server.arg("state") == "1";

  if (index < 0 || index > 1) {
    sendJson(400, "{\"error\":\"invalid relay index\"}");
    return;
  }

  uint8_t pin = (index == 0) ? RELAY_DRIP : RELAY_SPRINKLER;
  if (index == 0) {
    dripState = turnOn;
  } else {
    sprinklerState = turnOn;
  }
  setRelay(pin, turnOn);
  relayChangedAt[index] = millis();

  JsonDocument doc;
  doc["ok"] = true;
  doc["index"] = index;
  doc["state"] = turnOn;
  sendJson(200, doc.as<String>());
}

void handleHistory() {
  JsonDocument doc;
  doc["count"] = historyCount;
  for (int i = 0; i < historyCount; i++) {
    JsonObject item = doc["readings"].createNestedObject();
    item["ts"] = history[i].ts;
    item["soil_moisture"] = history[i].moisture;
    item["temperature"] = history[i].temperature;
    item["humidity"] = history[i].humidity;
    item["water_level"] = history[i].waterLevel;
    item["light_lux"] = history[i].lux;
  }
  sendJson(200, doc.as<String>());
}

void handleNotFound() {
  sendJson(404, "{\"error\":\"not found\"}");
}

void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.setHostname(DEVICE_NAME);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  uint32_t started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connect failed, retrying in background");
    return;
  }

  Serial.print("Connected: ");
  Serial.println(WiFi.localIP());

  if (MDNS.begin(DEVICE_NAME)) {
    MDNS.addService("http", "tcp", 80);
    Serial.println("mDNS: http://" + String(DEVICE_NAME) + ".local");
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("AquaGuard ESP32 " FW_VERSION " booting");

  pinMode(RELAY_DRIP, OUTPUT);
  pinMode(RELAY_SPRINKLER, OUTPUT);
  setRelay(RELAY_DRIP, false);
  setRelay(RELAY_SPRINKLER, false);

#if ULTRASONIC_ENABLED
  pinMode(ULTRASONIC_TRIG, OUTPUT);
  pinMode(ULTRASONIC_ECHO, INPUT);
#endif

#if LIGHT_SENSOR_ENABLED
  Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
  lightSensor.begin();
  Serial.print("BH1750: ");
  Serial.println(lightSensor.initialized() ? "ok" : "not found");
#endif

  dht.begin();
  connectWifi();

  server.on("/", HTTP_GET, handleRoot);
  server.on("/info", HTTP_GET, handleInfo);
  server.on("/sensors", HTTP_GET, handleSensors);
  server.on("/relay", HTTP_GET, handleRelay);
  server.on("/history", HTTP_GET, handleHistory);
  server.onNotFound(handleNotFound);
  server.begin();
}

void loop() {
  server.handleClient();

  if (WiFi.status() != WL_CONNECTED) {
    static uint32_t lastRetry = 0;
    if (millis() - lastRetry > 10000UL) {
      lastRetry = millis();
      WiFi.reconnect();
    }
  }

  if (millis() - lastPoll >= POLL_INTERVAL_MS) {
    lastPoll = millis();
    readSensors();
    addHistory();
  }

  // Safety: never leave a valve energised indefinitely.
  bool dripOn = dripState;
  bool sprinklerOn = sprinklerState;
  if (dripOn && millis() - relayChangedAt[0] > RELAY_SAFE_OFF_MS) dripOn = false;
  if (sprinklerOn && millis() - relayChangedAt[1] > RELAY_SAFE_OFF_MS) sprinklerOn = false;
  if (dripOn != dripState) {
    dripState = dripOn;
    setRelay(RELAY_DRIP, dripOn);
  }
  if (sprinklerOn != sprinklerState) {
    sprinklerState = sprinklerOn;
    setRelay(RELAY_SPRINKLER, sprinklerOn);
  }
}
