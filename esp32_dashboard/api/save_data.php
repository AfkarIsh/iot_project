<?php
// ==========================================
// Save Sensor Data API Endpoint
// Receives data from ESP32 and stores in database
// ==========================================

require_once '../config.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Only POST method is allowed', 405);
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// If not JSON, try to get POST data
if ($data === null) {
    $data = $_POST;
}

// Validate that we have at least some data
if (empty($data)) {
    sendError('No data received');
}

// Connect to database
$conn = getDBConnection();

// Prepare SQL statement
$sql = "INSERT INTO sensor_readings (
    temperature, humidity,
    mq135_raw, mq135_voltage, co2_ppm, nh4_ppm, alcohol_ppm, co_ppm, acetone_ppm,
    soil_raw, soil_percent,
    motion_detected, relay_on, led_on
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    sendError('Database prepare failed: ' . $conn->error, 500);
}

// Extract values with defaults
$temperature = isset($data['temperature']) ? floatval($data['temperature']) : null;
$humidity = isset($data['humidity']) ? floatval($data['humidity']) : null;
$mq135_raw = isset($data['mq135_raw']) ? intval($data['mq135_raw']) : null;
$mq135_voltage = isset($data['mq135_voltage']) ? floatval($data['mq135_voltage']) : null;
$co2_ppm = isset($data['co2_ppm']) ? floatval($data['co2_ppm']) : null;
$nh4_ppm = isset($data['nh4_ppm']) ? floatval($data['nh4_ppm']) : null;
$alcohol_ppm = isset($data['alcohol_ppm']) ? floatval($data['alcohol_ppm']) : null;
$co_ppm = isset($data['co_ppm']) ? floatval($data['co_ppm']) : null;
$acetone_ppm = isset($data['acetone_ppm']) ? floatval($data['acetone_ppm']) : null;
$soil_raw = isset($data['soil_raw']) ? intval($data['soil_raw']) : null;
$soil_percent = isset($data['soil_percent']) ? intval($data['soil_percent']) : null;
$motion_detected = isset($data['motion_detected']) ? (bool)$data['motion_detected'] : null;
$relay_on = isset($data['relay_on']) ? (bool)$data['relay_on'] : null;
$led_on = isset($data['led_on']) ? (bool)$data['led_on'] : null;

// Bind parameters
$stmt->bind_param(
    "ddiidddddiiiii",  // Fixed: added one more 'i' for led_on (14 params total)
    $temperature, $humidity,
    $mq135_raw, $mq135_voltage, $co2_ppm, $nh4_ppm, $alcohol_ppm, $co_ppm, $acetone_ppm,
    $soil_raw, $soil_percent,
    $motion_detected, $relay_on, $led_on
);

// Execute
if ($stmt->execute()) {
    $insert_id = $stmt->insert_id;
    $stmt->close();
    $conn->close();
    
    sendJSON([
        'success' => true,
        'message' => 'Data saved successfully',
        'id' => $insert_id,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} else {
    $error = $stmt->error;
    $stmt->close();
    $conn->close();
    sendError('Failed to save data: ' . $error, 500);
}
?>
