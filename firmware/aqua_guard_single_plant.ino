/*
 * AquaGuard Single Plant Prototype
 * ESP32 / ESP8266 Firmware
 * Sensors: DHT11 (temp/humidity), Soil Moisture Sensor (Analog), Ultrasonic (Water Level)
 * Actuator: Solenoid Valve / Relay (Water Pump)
 * Supports BOTH:
 *   1. USB Serial Bridge (Laptop connected directly via USB cable)
 *   2. WiFi HTTP Client (Posts directly to Flask Backend)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "DHT.h"

// ==========================================
// 1. WiFi & Backend Configuration
// ==========================================
// NOTE: Agar WiFi use nahi karni to khali chhor dein, USB mode mein chale ga!
const char* ssid = "your_wifi_ssid";        // <-- Apna WiFi naam (agar wireless use karna hai)
const char* pass = "your_wifi_password";    // <-- Apna WiFi password
const char* backendURL = "http://10.160.65.251:5000/api/sensors/data"; // <-- Laptop IP:5000

// ==========================================
// 2. Hardware Pin Definitions (ESP32)
// ==========================================
#define DHT_PIN 4             // DHT11 Data Pin
#define DHT_TYPE DHT11

#define SOIL_MOISTURE_PIN 34  // Analog Soil Moisture (AOUT)
#define TRIGGER_PIN 25        // Ultrasonic HC-SR04 TRIG
#define ECHO_PIN 26           // Ultrasonic HC-SR04 ECHO
#define VALVE_RELAY_PIN 27    // Relay Module IN (Active LOW relay)

// ==========================================
// Global Variables
// ==========================================
DHT dht(DHT_PIN, DHT_TYPE);

float temperature = 0.0;
float humidity = 0.0;
int soilMoisture = 0;
int waterLevel = 0;
bool wifiConnected = false;
unsigned long lastReadTime = 0;

// ==========================================
// Helper: Read Sensors
// ==========================================
void readAllSensors() {
  // 1. Read DHT11
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    temperature = t;
    humidity = h;
  }

  // 2. Read Soil Moisture (Analog 0-4095 on ESP32)
  int rawMoisture = analogRead(SOIL_MOISTURE_PIN);
  // Inverted: Dry soil = high analog value, Wet soil = low analog value
  soilMoisture = map(rawMoisture, 4095, 1200, 0, 100);
  soilMoisture = constrain(soilMoisture, 0, 100);

  // 3. Read Ultrasonic Water Level (HC-SR04)
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration > 0) {
    int distance_cm = duration * 0.034 / 2;
    // Tank height assumed 20cm: 0cm = 100% full, 20cm = 0% empty
    int maxDist = 20;
    waterLevel = map(distance_cm, 2, maxDist, 100, 0);
    waterLevel = constrain(waterLevel, 0, 100);
  }
}

// ==========================================
// Helper: Send Data to Backend via WiFi
// ==========================================
void sendWiFiData() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(backendURL);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"temperature\":" + String(temperature, 1) +
                       ",\"humidity\":" + String(humidity, 1) +
                       ",\"soil_moisture\":" + String(soilMoisture) +
                       ",\"water_level\":" + String(waterLevel) + "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode == 201 || httpCode == 200) {
    String response = http.getString();
    // Parse pump command if returned
    if (response.indexOf("\"pump_command\":\"pump_on\"") >= 0 || response.indexOf("\"pump_on\":true") >= 0) {
      digitalWrite(VALVE_RELAY_PIN, LOW); // Relay ON
    } else if (response.indexOf("\"pump_command\":\"pump_off\"") >= 0 || response.indexOf("\"pump_on\":false") >= 0) {
      digitalWrite(VALVE_RELAY_PIN, HIGH); // Relay OFF
    }
  }
  http.end();
}

// ==========================================
// Setup
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n🌱 AquaGuard Microcontroller Initializing...");

  pinMode(VALVE_RELAY_PIN, OUTPUT);
  digitalWrite(VALVE_RELAY_PIN, HIGH); // Default OFF (active-low relay)

  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  dht.begin();

  // Try WiFi with 7 second timeout (DOES NOT FREEZE IF NO WIFI!)
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, pass);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 7000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\n✅ WiFi Connected! IP: " + WiFi.localIP().toString());
  } else {
    wifiConnected = false;
    Serial.println("\n⚠️ WiFi not connected. Operating in USB Serial Bridge mode.");
  }
}

// ==========================================
// Loop
// ==========================================
void loop() {
  // Check for commands from Laptop over USB Serial (e.g., pump_on / pump_off)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "pump_on") {
      digitalWrite(VALVE_RELAY_PIN, LOW); // Relay ON
      Serial.println("[RELAY] Pump turned ON");
    } else if (cmd == "pump_off") {
      digitalWrite(VALVE_RELAY_PIN, HIGH); // Relay OFF
      Serial.println("[RELAY] Pump turned OFF");
    }
  }

  // Read and transmit sensor data every 2.5 seconds
  if (millis() - lastReadTime >= 2500) {
    lastReadTime = millis();
    readAllSensors();

    // 1. Output human-readable line for Serial Monitor
    Serial.print("Sensors - Temp: ");
    Serial.print(temperature, 1);
    Serial.print("°C Hum: ");
    Serial.print(humidity, 1);
    Serial.print("% Soil: ");
    Serial.print(soilMoisture);
    Serial.print("% WaterLvl: ");
    Serial.print(waterLevel);
    Serial.println("%");

    // 2. Output JSON line for serial_bridge.py
    Serial.print("{\"temperature\":");
    Serial.print(temperature, 1);
    Serial.print(",\"humidity\":");
    Serial.print(humidity, 1);
    Serial.print(",\"soil_moisture\":");
    Serial.print(soilMoisture);
    Serial.print(",\"water_level\":");
    Serial.print(waterLevel);
    Serial.println("}");

    // 3. If WiFi is connected, also HTTP POST to backend
    if (wifiConnected && WiFi.status() == WL_CONNECTED) {
      sendWiFiData();
    }
  }
}