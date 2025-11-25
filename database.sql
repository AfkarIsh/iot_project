-- ==========================================
-- ESP32 Sensor Dashboard - Database Schema
-- ==========================================

-- Create database
CREATE DATABASE IF NOT EXISTS esp32_sensors;
USE esp32_sensors;

-- Drop existing table if exists
DROP TABLE IF EXISTS sensor_readings;

-- Create sensor_readings table
CREATE TABLE sensor_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- DHT11 Sensor Data
    temperature DECIMAL(5,2) NULL COMMENT 'Temperature in Celsius',
    humidity DECIMAL(5,2) NULL COMMENT 'Humidity in percentage',
    
    -- MQ-135 Air Quality Sensor Data
    mq135_raw INT NULL COMMENT 'MQ-135 raw ADC value',
    mq135_voltage DECIMAL(5,3) NULL COMMENT 'MQ-135 voltage',
    co2_ppm DECIMAL(10,2) NULL COMMENT 'CO2 in ppm',
    nh4_ppm DECIMAL(10,2) NULL COMMENT 'Ammonia (NH4) in ppm',
    alcohol_ppm DECIMAL(10,2) NULL COMMENT 'Alcohol in ppm',
    co_ppm DECIMAL(10,2) NULL COMMENT 'Carbon Monoxide (CO) in ppm',
    acetone_ppm DECIMAL(10,2) NULL COMMENT 'Acetone in ppm',
    
    -- Soil Moisture Sensor Data
    soil_raw INT NULL COMMENT 'Soil moisture raw ADC value',
    soil_percent INT NULL COMMENT 'Soil moisture percentage',
    
    -- PIR Motion Sensor Data
    motion_detected BOOLEAN NULL COMMENT 'Motion detected (true/false)',
    
    -- Relay Status
    relay_on BOOLEAN NULL COMMENT 'Relay status (true/false)',
    
    -- LED Status
    led_on BOOLEAN NULL COMMENT 'LED status (true/false)',
    
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stores all ESP32 sensor readings';

-- Create a view for latest reading
CREATE OR REPLACE VIEW latest_reading AS
SELECT * FROM sensor_readings
ORDER BY timestamp DESC
LIMIT 1;

-- Sample data (optional, for testing)
-- INSERT INTO sensor_readings (
--     temperature, humidity, 
--     mq135_raw, mq135_voltage, co2_ppm, nh4_ppm, alcohol_ppm, co_ppm, acetone_ppm,
--     soil_raw, soil_percent,
--     motion_detected, relay_on
-- ) VALUES (
--     25.5, 60.0,
--     2048, 1.65, 450.0, 12.5, 8.3, 5.2, 6.1,
--     1500, 65,
--     false, false
-- );

SELECT 'Database created successfully!' AS status;
