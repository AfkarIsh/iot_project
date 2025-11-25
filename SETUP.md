# ESP32 Dashboard Setup Guide

## 🚨 **IMPORTANT FIRST STEP: Setup Database**

The dashboard requires the MySQL database to be created first. Follow these steps:

### **Option 1: Using phpMyAdmin (Recommended)**

1. Open **phpMyAdmin** in your browser:
   ```
   http://localhost/phpmyadmin/
   ```

2. Click on "**Import**" tab at the top

3. Click "**Choose File**" and select `database.sql` from:
   ```
   c:\xampp\htdocs\Agent\esp32_dashboard\database.sql
   ```

4. Click "**Go**" button at the bottom

5. You should see: ✅ **"Database created successfully!"**

### **Option 2: Using MySQL Command Line**

1. Open Command Prompt / Terminal

2. Navigate to dashboard folder:
   ```
   cd c:\xampp\htdocs\Agent\esp32_dashboard
   ```

3. Run MySQL command:
   ```
   mysql -u root -p < database.sql
   ```
   (Press Enter when asked for password if you don't have one)

---

## ✅ **Verify Database Creation**

1. Go to phpMyAdmin: http://localhost/phpmyadmin/

2. Look for database **`esp32_sensors`** in the left sidebar

3. Click on it and you should see table **`sensor_readings`**

---

## 🎯 **Test the Dashboard**

1. Make sure **XAMPP Apache and MySQL** are running

2. Open in browser:
   ```
   http://localhost/Agent/esp32_dashboard/
   ```

3. You should see the dashboard with:
   - ✅ Hamburger menu button (top-left)
   - ✅ "Waiting for data..." message
   - ✅ All sensor cards showing "--"

4. Test API endpoint directly:
   ```
   http://localhost/Agent/esp32_dashboard/api/get_latest.php
   ```
   Should return:
   ```json
   {
     "success": true,
     "data": null,
     "message": "No data available yet"
   }
   ```

---

## 📡 **Add Test Data (Optional)**

To see the dashboard with data before connecting ESP32:

### **Method 1: Using Test API Page**

1. Open: `http://localhost/Agent/esp32_dashboard/test_api.html`

2. Click "**Test Save Data**" button

3. Refresh dashboard to see the data appear

### **Method 2: Using SQL Query**

1. Go to phpMyAdmin → esp32_sensors database

2. Click "SQL" tab

3. Paste this query:
   ```sql
   INSERT INTO sensor_readings (
       temperature, humidity, 
       mq135_raw, mq135_voltage, co2_ppm, nh4_ppm, alcohol_ppm, co_ppm, acetone_ppm,
       soil_raw, soil_percent,
       motion_detected, relay_on
   ) VALUES (
       25.5, 60.0,
       2048, 1.65, 450.0, 12.5, 8.3, 5.2, 6.1,
       1500, 65,
       true, false
   );
   ```

4. Click "Go"

5. Refresh dashboard - you should now see data!

---

## 🔧 **ESP32 Setup (Next Step)**

After database is working:

1. Open `esp32_code_wifi.ino` in Arduino IDE

2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   ```

3. Update server URL (use your computer's IP):
   ```cpp
   const char* serverURL = "http://192.168.X.X/Agent/esp32_dashboard/api/save_data.php";
   ```

4. To find your IP:
   - **Windows**: Open CMD, type `ipconfig`, look for "IPv4 Address"
   - Example: `192.168.1.100`

5. Upload code to ESP32

6. Open Serial Monitor (115200 baud) to see connection status

---

## 🎨 **Dashboard Features**

### **Sidebar Navigation**
- Click  **hamburger menu** (☰) to open sidebar
- Navigate to different sections
- Shows connection status

### **Real-time Updates**
- Data updates every 3 seconds automatically
- Smooth animations on value changes

### **Charts**
- **Bar Chart**: Current air quality levels comparison
- **Line Chart**: Historical trends (last 20 readings)

### **Relay Control**
- Toggle switch to manually control relay (UI only - needs backend implementation for actual control)

---

## ❗ **Troubleshooting**

### **"Unknown database 'esp32_sensors'" error**
- Database not created yet
- Follow "Setup Database" steps above

### **Dashboard shows "Disconnected"**
- Check if **Apache and MySQL are running** in XAMPP
- Verify database was created successfully

### **Charts not showing**
- Add test data using method above
- Check browser console (F12) for errors

### **ESP32 not connecting**
- Verify WiFi credentials are correct
- Make sure you're using 2.4GHz WiFi (not 5GHz)
- Check Serial Monitor for error messages
- Verify server URL uses your computer's IP address

---

## 📝 **Quick Checklist**

- [ ] XAMPP Apache is running
- [ ] XAMPP MySQL is running  
- [ ] Database `esp32_sensors` created
- [ ] Dashboard loads at http://localhost/Agent/esp32_dashboard/
- [ ] API endpoint responds without errors
- [ ] (Optional) Test data added
- [ ] ESP32 WiFi credentials configured
- [ ] ESP32 server URL configured with your IP
- [ ] ESP32 code uploaded
- [ ] Serial Monitor shows WiFi connected

---

## 🎉 **Success!**

When everything is working, you should see:
- Dashboard loading with smooth animations
- Sidebar menu working
- Real-time sensor data updating
- Charts showing air quality trends
- Relay control toggle functioning

**Enjoy your ESP32 Dashboard! 📡✨**
