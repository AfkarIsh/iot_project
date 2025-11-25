# ESP32 Dashboard Connection Troubleshooting Guide

## Problem
Dashboard shows "Connecting..." and all values display "--", indicating no data is being received from ESP32.

## Quick Checklist

### ✅ Step 1: Verify XAMPP is Running
1. Open XAMPP Control Panel
2. Ensure **Apache** is running (green light)
3. Ensure **MySQL** is running (green light)

### ✅ Step 2: Import/Re-import Database
1. Open phpMyAdmin: `http://localhost/phpmyadmin/`
2. Click on "Import" tab
3. Choose `database.sql` from `c:\xampp\htdocs\Agent\esp32_dashboard\`
4. Click "Go" to execute
5. Verify `esp32_sensors` database exists in left sidebar
6. Click on `sensor_readings` table and verify it has **led_on** column

### ✅ Step 3: Test API Endpoints

**Test get_latest.php:**
```
http://localhost/Agent/esp32_dashboard/api/get_latest.php
```
- Should return: `{"success":true,"data":null,"message":"No data available yet"}` if no data yet
- Or return sensor data if data exists

**Test save_data.php manually:**
Open Postman or use curl:
```bash
curl -X POST http://localhost/Agent/esp32_dashboard/api/save_data.php ^ -H "Content-Type: application/json" ^
-d "{\"temperature\":25.5,\"humidity\":60,\"mq135_raw\":2048,\"mq135_voltage\":1.65,\"co2_ppm\":450,\"nh4_ppm\":12.5,\"alcohol_ppm\":8.3,\"co_ppm\":5.2,\"acetone_ppm\":6.1,\"soil_raw\":1500,\"soil_percent\":65,\"motion_detected\":false,\"relay_on\":false,\"led_on\":false}"
```

### ✅ Step 4: Check ESP32 Connection

#### Find your PC's IP Address:
1. Open Command Prompt (cmd)
2. Type: `ipconfig`
3. Look for your WiFi/Ethernet adapter
4. Find **IPv4 Address** (e.g., `192.168.1.100`)

#### Update ESP32 Code:
Your code currently uses: `192.168.56.1`

**Make sure this IP matches your PC's actual IP!**

Common issues:
- ❌ `192.168.56.1` - VirtualBox network (wrong unless using VirtualBox)
- ✅ `192.168.1.xxx` - Common home WiFi
- ✅ `192.168.0.xxx` - Common home WiFi
- ✅ `10.0.0.xxx` - Some routers

#### Check Serial Monitor:
1. Open Arduino IDE
2. Upload code to ESP32
3. Open Serial Monitor (115200 baud)
4. Look for these messages:

**Good signs:**
```
✓ WiFi Connected!
IP Address: 192.168.x.x
✓ Server Response Code: 200
```

**Bad signs:**
```
✗ WiFi Connection Failed!
✗ Error sending data. Error code: -1
Cannot send data: WiFi not connected
```

### ✅ Step 5: Check Firewall
Windows Firewall might block ESP32 from connecting to your PC.

**Temporarily disable firewall to test:**
1. Windows Settings → Update & Security → Windows Security
2. Firewall & network protection
3. Turn off for Private network (temporarily)
4. Test ESP32 connection
5. Turn firewall back on after testing

**Or add firewall rule:**
1. Windows Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → Port 80
4. Allow the connection
5. Apply to Private networks

### ✅ Step 6: Verify Network Connection
- ESP32 and PC must be on the **same WiFi network**
- ESP32 supports **2.4GHz WiFi only** (not 5GHz)
- Router must allow device-to-device communication

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `WiFi Connection Failed` | Wrong SSID/password | Check WiFi credentials |
| `Error code: -1` | Can't reach server | Check PC IP address |
| `Error code: -11` | Timeout | Firewall blocking or wrong IP |
| `Response Code: 404` | Wrong URL path | Verify serverURL path |
| `Response Code: 500` | Database error | Re-import database.sql |

## Testing Sequence

### Test 1: Local Dashboard (No ESP32)
1. Go to: `http://localhost/Agent/esp32_dashboard/`
2. Open browser console (F12)
3. Should see: "ESP32 Dashboard initializing..."
4. Status should show "Disconnected" (no data yet - this is normal)

### Test 2: Manual Data Insert
Run this in phpMyAdmin SQL tab:
```sql
INSERT INTO esp32_sensors.sensor_readings (
    temperature, humidity,
    mq135_raw, mq135_voltage, co2_ppm, nh4_ppm, alcohol_ppm, co_ppm, acetone_ppm,
    soil_raw, soil_percent,
    motion_detected, relay_on, led_on
) VALUES (
    25.5, 60.0,
    2048, 1.65, 450.0, 12.5, 8.3, 5.2, 6.1,
    1500, 65,
    0, 0, 0
);
```

Refresh dashboard - you should see data appear!

### Test 3: ESP32 Sends Data
1. Upload ESP32 code
2. Open Serial Monitor
3. Wait for "✓ Server Response Code: 200"
4. Refresh dashboard - data should update every 3 seconds

## Still Not Working?

### Check these files exist:
- ✅ `c:\xampp\htdocs\Agent\esp32_dashboard\index.html`
- ✅ `c:\xampp\htdocs\Agent\esp32_dashboard\api\get_latest.php`
- ✅ `c:\xampp\htdocs\Agent\esp32_dashboard\api\save_data.php`
- ✅ `c:\xampp\htdocs\Agent\esp32_dashboard\config.php`

### Enable PHP error logging:
Add to `config.php`:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/htdocs/Agent/esp32_dashboard/php_errors.log');
```

### Check PHP errors:
Look at: `C:\xampp\apache\logs\error.log`

## Quick Fix Commands

**Test if Apache is responding:**
```cmd
curl http://localhost/Agent/esp32_dashboard/
```

**Test API directly:**
```cmd
curl http://localhost/Agent/esp32_dashboard/api/get_latest.php
```

---

## Final Checklist

- [ ] XAMPP Apache & MySQL running
- [ ] Database `esp32_sensors` created with sensor_readings table
- [ ] API test returns valid JSON
- [ ] PC IP address correct in ESP32 code
- [ ] ESP32 connects to WiFi (check Serial Monitor)
- [ ] ESP32 on same 2.4GHz network as PC
- [ ] Firewall allows port 80
- [ ] ESP32 sends data (Response Code: 200)
- [ ] Dashboard refreshes with data

If all checks pass and still not working, share:
1. Serial Monitor output
2. Browser console errors (F12)
3. Result from: `http://localhost/Agent/esp32_dashboard/api/get_latest.php`
