# ESP32 Sensor Dashboard

A complete web-based real-time monitoring system for ESP32 with multiple sensors including MQ-135 air quality, DHT11 temperature/humidity, PIR motion, soil moisture, and relay control.

## 🌟 Features

- **Real-time monitoring** - Updates every 3 seconds
- **Modern UI** - Dark theme with glassmorphism and smooth animations
- **Multiple sensors** - Temperature, humidity, air quality (CO2, CO, NH4, alcohol, acetone), soil moisture, motion detection
- **Relay control** - Automatically controlled by PIR motion sensor
- **RESTful API** - PHP backend with MySQL database
- **Responsive design** - Works on desktop, tablet, and mobile

## 📁 File Structure

```
esp32_dashboard/
├── index.html              # Main dashboard page
├── config.php              # Database configuration
├── database.sql            # Database schema
├── README.md              # This file
├── esp32_code_wifi.ino    # ESP32 code with WiFi
├── api/
│   ├── save_data.php      # Receive data from ESP32
│   ├── get_latest.php     # Get latest reading
│   └── get_history.php    # Get historical data
├── css/
│   └── style.css          # Styles with animations
└── js/
    └── dashboard.js       # Frontend logic & updates
```

## 🔧 Hardware Requirements

- **ESP32 Development Board**
- **MQ-135** - Air quality sensor (analog output to GPIO 34)
- **DHT11** - Temperature & humidity sensor (data pin to GPIO 27)
- **PIR Sensor** - Motion detection (OUT to GPIO 33)
- **Soil Moisture Sensor** - Analog output to GPIO 32
- **Relay Module** - IN pin to GPIO 25
- **Power Supply** - 5V for ESP32 and sensors

## 💻 Software Requirements

- **XAMPP** (or similar) with Apache and MySQL
- **Arduino IDE** with ESP32 board support
- Modern web browser (Chrome, Firefox, Edge)

### Arduino Libraries Required:
- `MQUnifiedsensor`
- `DHT sensor library`
- `WiFi` (built-in with ESP32)
- `HTTPClient` (built-in with ESP32)
- `ArduinoJson`

## 📝 Setup Instructions

### Step 1: Database Setup

1. Open **phpMyAdmin** (http://localhost/phpmyadmin/)
2. Click on "Import" tab
3. Choose the `database.sql` file
4. Click "Go" to execute
5. Verify that database `esp32_sensors` was created

### Step 2: Configure WiFi and Server

Edit `esp32_code_wifi.ino` and update these lines:

```cpp
const char* ssid = "YOUR_WIFI_SSID";          // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Your WiFi password
const char* serverURL = "http://YOUR_SERVER_IP/Agent/esp32_dashboard/api/save_data.php";
```

**Finding your server IP:**
- Windows: Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
- Example: `http://192.168.1.100/Agent/esp32_dashboard/api/save_data.php`

### Step 3: Upload ESP32 Code

1. Open `esp32_code_wifi.ino` in Arduino IDE
2. Select **Board**: "ESP32 Dev Module" (or your ESP32 board)
3. Select correct **Port**
4. Click **Upload**
5. Open **Serial Monitor** (115200 baud) to view sensor readings and WiFi connection

### Step 4: Access Dashboard

1. Make sure XAMPP Apache and MySQL are running
2. Open browser and go to: `http://localhost/Agent/esp32_dashboard/`
3. You should see the dashboard loading
4. Once ESP32 starts sending data, values will update every 3 seconds

## 🔌 ESP32 Pin Connections

| Sensor/Module | ESP32 Pin | Connection Type |
|---------------|-----------|-----------------|
| MQ-135 | GPIO 34 | Analog Input |
| DHT11 | GPIO 27 | Digital I/O |
| PIR Sensor | GPIO 33 | Digital Input |
| Soil Moisture | GPIO 32 | Analog Input |
| Relay Module | GPIO 25 | Digital Output |

## 🌐 API Endpoints

### 1. Save Sensor Data
**URL:** `api/save_data.php`  
**Method:** POST  
**Content-Type:** application/json

**Request Body:**
```json
{
  "temperature": 25.5,
  "humidity": 60.0,
  "mq135_raw": 2048,
  "mq135_voltage": 1.65,
  "co2_ppm": 450.0,
  "nh4_ppm": 12.5,
  "alcohol_ppm": 8.3,
  "co_ppm": 5.2,
  "acetone_ppm": 6.1,
  "soil_raw": 1500,
  "soil_percent": 65,
  "motion_detected": false,
  "relay_on": false
}
```

### 2. Get Latest Reading
**URL:** `api/get_latest.php`  
**Method:** GET

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "timestamp": "2025-11-21 00:24:36",
    "temperature": 25.5,
    ...
  }
}
```

### 3. Get Historical Data
**URL:** `api/get_history.php?hours=24&limit=100`  
**Method:** GET  
**Parameters:**
- `hours` - Number of hours to fetch (default: 24)
- `limit` - Maximum records to return (default: 500, max: 1000)

## 🎨 Dashboard Features

- **Live Status Indicators** - Connection status, motion detection, relay state
- **Animated Value Updates** - Smooth transitions when values change
- **Color-Coded Cards** - Different gradients for each sensor type
- **Responsive Grid Layout** - Adapts to screen size
- **Real-time Updates** - Fetches new data every 3 seconds
- **Automatic Reconnection** - Handles connection failures gracefully

## 🐛 Troubleshooting

### Dashboard shows "Disconnected"
- Check if Apache and MySQL are running in XAMPP
- Verify database exists and table is created
- Check browser console (F12) for errors

### ESP32 not connecting to WiFi
- Verify SSID and password are correct
- Check if WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Ensure WiFi router is in range
- Check Serial Monitor for connection status

### Data not showing in dashboard
- Verify ESP32 Serial Monitor shows "Server Response Code: 200"
- Check `serverURL` is correct (use your computer's IP, not localhost)
- Ensure firewall allows incoming connections
- Test API endpoint directly: `http://localhost/Agent/esp32_dashboard/api/get_latest.php`

### Sensor readings show as "--"
- Verify sensors are properly connected
- Check DHT11 is getting power (3.3V or 5V)
- MQ-135 needs warm-up time (2-24 hours for accurate readings)
- Check Serial Monitor to see if ESP32 is reading sensors

## 📊 Database Schema

Table: `sensor_readings`

| Column | Type | Description |
|--------|------|-------------|
| id | INT (PK) | Auto-increment ID |
| timestamp | DATETIME | Reading timestamp |
| temperature | DECIMAL(5,2) | Temperature in °C |
| humidity | DECIMAL(5,2) | Humidity in % |
| mq135_raw | INT | Raw ADC value |
| mq135_voltage | DECIMAL(5,3) | Voltage reading |
| co2_ppm | DECIMAL(10,2) | CO2 level |
| nh4_ppm | DECIMAL(10,2) | Ammonia level |
| alcohol_ppm | DECIMAL(10,2) | Alcohol level |
| co_ppm | DECIMAL(10,2) | Carbon monoxide |
| acetone_ppm | DECIMAL(10,2) | Acetone level |
| soil_raw | INT | Raw soil reading |
| soil_percent | INT | Soil moisture % |
| motion_detected | BOOLEAN | Motion status |
| relay_on | BOOLEAN | Relay status |

## 🔒 Security Notes

- This setup is for **local network use only**
- Not secured for internet exposure
- Consider adding authentication if making publicly accessible
- Database password should be changed from default

## 📄 License

Free to use and modify for personal and educational purposes.

## 🤝 Support

If you encounter any issues:
1. Check Serial Monitor output for ESP32 errors
2. Check browser console (F12) for JavaScript errors
3. Verify all file paths are correct
4. Ensure all required libraries are installed

---

**Made with ❤️ for ESP32 enthusiasts**
