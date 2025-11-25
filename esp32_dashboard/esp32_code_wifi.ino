#include <MQUnifiedsensor.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ====== PIN DEFINITIONS ======
#define DHTPIN 27                // DHT11 data pin
#define PIR_PIN 33               // PIR OUT pin
#define SOIL_MOISTURE_PIN 32     // Soil sensor analog out
#define RELAY_PIN 25             // Relay IN pin
#define MQ135_Analog_PIN 34      // MQ135 analog output AO
#define LED_PIN 26               // Onboard or external LED pin

// ====== WIFI & SERVER - ⚠️ CHANGE THE IP ADDRESS! ======
const char* ssid = "ArIsh_Mob";
const char* password = "54321#AI";

// 🔴 IMPORTANT: CHANGE 192.168.1.100 to YOUR PC's actual WiFi IP!
// How to find your IP address:
// 1. Open Command Prompt (press Win+R, type cmd, press Enter)
// 2. Type: ipconfig
// 3. Look for "Wireless LAN adapter Wi-Fi" section
// 4. Find "IPv4 Address" - it will look like: 192.168.X.XXX
// 5. Replace 192.168.1.100 below with YOUR IP address
//
// ❌ WRONG IP: 192.168.56.1 (VirtualBox - causes "connection refused" error)
// ✅ CORRECT IP: Your PC's WiFi IP from ipconfig (e.g., 192.168.1.100)

const char* serverURL = "http://192.168.16.46/Agent/esp32_dashboard/api/save_data.php";  // ⚠️ CHANGE THIS IP!

// ====== SENSOR SETUP =======
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define Board ("ESP-32")
#define MQ135_Type ("MQ-135")
#define MQ135_Voltage (3.3)
#define MQ135_ADC_Resolution (12)
#define MQ135_CleanAir (3.6)
#define MQ135_RL (10)
MQUnifiedsensor MQ135(Board, MQ135_Voltage, MQ135_ADC_Resolution, MQ135_Analog_PIN, MQ135_Type);

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 3000;

void setup() {
  Serial.begin(115200);
  Serial.println("\n\n========================");
  Serial.println("ESP32 Sensor Dashboard");
  Serial.println("========================");

  // Sensor pins
  dht.begin();
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // MQ135 calibrate
  MQ135.setRegressionMethod(1);
  MQ135.setA(110.47); MQ135.setB(-2.862);
  MQ135.init();
  MQ135.setRL(MQ135_RL);

  Serial.print("Calibrating MQ-135...");
  float calcR0 = 0;
  for (int i = 1; i <= 10; i++) {
    MQ135.update();
    calcR0 += MQ135.calibrate(MQ135_CleanAir);
    delay(100);
  }
  MQ135.setR0(calcR0 / 10);
  Serial.println(" Done!");

  connectToWiFi();
  
  Serial.println("\n⚠️ IMPORTANT: If you see 'connection refused' errors below,");
  Serial.println("you need to change the serverURL IP address in the code!");
  Serial.print("Current serverURL: ");
  Serial.println(serverURL);
  Serial.println("========================\n");
}

void loop() {
  // WiFi reconnect if required
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
  }

  // === SENSOR READING & CONTROL ===
  int motionState = digitalRead(PIR_PIN);  // Still read PIR for data/display
  
  // Relay: Controlled manually from dashboard
  bool relayState = getRelayStateFromServer();  // Fetch relay state from server
  digitalWrite(RELAY_PIN, relayState ? HIGH : LOW);

  // LED: Controlled manually from dashboard
  bool ledState = getLEDStateFromServer();  // Fetch LED state from server
  digitalWrite(LED_PIN, ledState ? HIGH : LOW);

  // DHT11
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Failed to read from DHT11!");
    temperature = 0.0;
    humidity = 0.0;
  }

  // MQ135
  int mq135Raw = analogRead(MQ135_Analog_PIN);
  float mq135Voltage = mq135Raw * (MQ135_Voltage / 4095.0);
  MQ135.update();

  MQ135.setA(110.47); MQ135.setB(-2.862); // CO2
  float co2 = MQ135.readSensor();
  MQ135.setA(102.2); MQ135.setB(-2.473); // NH4
  float nh4 = MQ135.readSensor();
  MQ135.setA(34.668); MQ135.setB(-1.5); // Alcohol
  float alcohol = MQ135.readSensor();
  MQ135.setA(605.18); MQ135.setB(-3.937); // CO
  float co = MQ135.readSensor();
  MQ135.setA(34.668); MQ135.setB(-1.5); // Acetone
  float acetone = MQ135.readSensor();

  // Soil Moisture
  int soilRaw = analogRead(SOIL_MOISTURE_PIN);
  int soilPercent = map(soilRaw, 4095, 0, 0, 100);

  // Serial Debug Output
  Serial.println("====== SENSOR READINGS ======");
  Serial.printf("Temperature: %.2f °C, Humidity: %.2f %%\n", temperature, humidity);
  Serial.printf("PIR Motion: %s | Relay: %s\n", motionState == HIGH ? "Detected" : "None", relayState ? "ON" : "OFF");
  Serial.printf("LED: %s\n", ledState ? "ON" : "OFF");
  Serial.printf("Soil Moisture Raw: %d | Soil Moisture %%: %d\n", soilRaw, soilPercent);
  Serial.printf("CO2: %.2f, NH4: %.2f, Alcohol: %.2f, CO: %.2f, Acetone: %.2f ppm\n", co2, nh4, alcohol, co, acetone);
  Serial.println("-----------------------------");

  // Send data every sendInterval
  if (millis() - lastSendTime >= sendInterval) {
    sendDataToServer(temperature, humidity, mq135Raw, mq135Voltage,
                     co2, nh4, alcohol, co, acetone,
                     soilRaw, soilPercent, motionState == HIGH, relayState, ledState);
    lastSendTime = millis();
  }
  delay(1000);  // Sampling
}

// ===============================
void connectToWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi Connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n✗ WiFi Connection Failed!");
  }
}

// ===============================
void sendDataToServer(float temp, float hum, int mq135Raw, float mq135Volt,
                      float co2, float nh4, float alcohol, float co, float acetone,
                      int soilRaw, int soilPercent, bool motion, bool relay, bool led) {

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Cannot send data: WiFi not connected");
    return;
  }

  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<512> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["mq135_raw"] = mq135Raw;
  doc["mq135_voltage"] = mq135Volt;
  doc["co2_ppm"] = co2;
  doc["nh4_ppm"] = nh4;
  doc["alcohol_ppm"] = alcohol;
  doc["co_ppm"] = co;
  doc["acetone_ppm"] = acetone;
  doc["soil_raw"] = soilRaw;
  doc["soil_percent"] = soilPercent;
  doc["motion_detected"] = motion;
  doc["relay_on"] = relay;
  doc["led_on"] = led;

  String jsonData;
  serializeJson(doc, jsonData);

  Serial.println("\n📤 Sending data to server...");
  Serial.println(jsonData);

  int httpResponseCode = http.POST(jsonData);

  if (httpResponseCode > 0) {
    Serial.print("✓ Server Response Code: ");
    Serial.println(httpResponseCode);
    String response = http.getString();
    Serial.println("Response: " + response);
  } else {
    Serial.print("✗ Error sending data. Error code: ");
    Serial.println(httpResponseCode);
    Serial.println(http.errorToString(httpResponseCode));
    Serial.println("\n⚠️ If you see 'connection refused' - CHANGE THE IP ADDRESS!");
    Serial.println("⚠️ Open Command Prompt, type 'ipconfig', find your WiFi IP");
    Serial.println("⚠️ Then update line 30 in this code with your actual IP\n");
  }

  http.end();
}

// ===============================
// GET LED STATE FROM SERVER
// ===============================
bool getLEDStateFromServer() {
  static bool lastLedState = false;  // Remember last state
  static unsigned long lastCheckTime = 0;
  const unsigned long checkInterval = 2000;  // Check every 2 seconds
  
  // Don't check too frequently
  if (millis() - lastCheckTime < checkInterval) {
    return lastLedState;
  }
  lastCheckTime = millis();
  
  if (WiFi.status() != WL_CONNECTED) {
    return lastLedState;  // Return last known state if WiFi down
  }
  
  // Build LED state URL (replace IP with your server IP)
  String ledURL = String(serverURL);
  ledURL.replace("save_data.php", "get_led_state.php");
  
  HTTPClient http;
  http.begin(ledURL);
  http.setTimeout(1000);  // 1 second timeout
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // Simple JSON parsing - look for "led_on":true or "led_on":false
    if (payload.indexOf("\"led_on\":true") > 0) {
      lastLedState = true;
    } else if (payload.indexOf("\"led_on\":false") > 0) {
      lastLedState = false;
    }
  }
  
  http.end();
  return lastLedState;
}

// ===============================
// GET RELAY STATE FROM SERVER
// ===============================
bool getRelayStateFromServer() {
  static bool lastRelayState = false;  // Remember last state
  static unsigned long lastCheckTime = 0;
  const unsigned long checkInterval = 2000;  // Check every 2 seconds
  
  // Don't check too frequently
  if (millis() - lastCheckTime < checkInterval) {
    return lastRelayState;
  }
  lastCheckTime = millis();
  
  if (WiFi.status() != WL_CONNECTED) {
    return lastRelayState;  // Return last known state if WiFi down
  }
  
  // Build Relay state URL
  String relayURL = String(serverURL);
  relayURL.replace("save_data.php", "get_relay_state.php");
  
  HTTPClient http;
  http.begin(relayURL);
  http.setTimeout(1000);  // 1 second timeout
  
  int httpCode = http.GET();
  
  if (httpCode == 200) {
    String payload = http.getString();
    
    // Simple JSON parsing - look for "relay_on":true or "relay_on":false
    if (payload.indexOf("\"relay_on\":true") > 0) {
      lastRelayState = true;
    } else if (payload.indexOf("\"relay_on\":false") > 0) {
      lastRelayState = false;
    }
  }
  
  http.end();
  return lastRelayState;
}
