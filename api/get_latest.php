<?php
// ==========================================
// Get Latest Sensor Reading API Endpoint
// Returns the most recent sensor reading
// ==========================================

require_once '../config.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Only GET method is allowed', 405);
}

// Connect to database
$conn = getDBConnection();

// Query latest reading
$sql = "SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT 1";
$result = $conn->query($sql);

if (!$result) {
    $conn->close();
    sendError('Query failed: ' . $conn->error, 500);
}

if ($result->num_rows === 0) {
    $conn->close();
    sendJSON([
        'success' => true,
        'data' => null,
        'message' => 'No data available yet'
    ]);
}

$row = $result->fetch_assoc();
$conn->close();

// Check if data is too old (stale) - consider disconnected if older than 10 seconds
$timestamp = strtotime($row['timestamp']);
$currentTime = time();
$ageSeconds = $currentTime - $timestamp;

if ($ageSeconds > 10) {
    // Data is stale - ESP32 likely disconnected
    sendJSON([
        'success' => false,
        'data' => null,
        'message' => 'No recent data (ESP32 disconnected)',
        'last_update' => $row['timestamp'],
        'age_seconds' => $ageSeconds
    ]);
}

// Format the response with fresh data
sendJSON([
    'success' => true,
    'data' => [
        'id' => (int)$row['id'],
        'timestamp' => $row['timestamp'],
        'temperature' => $row['temperature'] !== null ? (float)$row['temperature'] : null,
        'humidity' => $row['humidity'] !== null ? (float)$row['humidity'] : null,
        'mq135_raw' => $row['mq135_raw'] !== null ? (int)$row['mq135_raw'] : null,
        'mq135_voltage' => $row['mq135_voltage'] !== null ? (float)$row['mq135_voltage'] : null,
        'co2_ppm' => $row['co2_ppm'] !== null ? (float)$row['co2_ppm'] : null,
        'nh4_ppm' => $row['nh4_ppm'] !== null ? (float)$row['nh4_ppm'] : null,
        'alcohol_ppm' => $row['alcohol_ppm'] !== null ? (float)$row['alcohol_ppm'] : null,
        'co_ppm' => $row['co_ppm'] !== null ? (float)$row['co_ppm'] : null,
        'acetone_ppm' => $row['acetone_ppm'] !== null ? (float)$row['acetone_ppm'] : null,
        'soil_raw' => $row['soil_raw'] !== null ? (int)$row['soil_raw'] : null,
        'soil_percent' => $row['soil_percent'] !== null ? (int)$row['soil_percent'] : null,
        'motion_detected' => $row['motion_detected'] !== null ? (bool)$row['motion_detected'] : null,
        'relay_on' => $row['relay_on'] !== null ? (bool)$row['relay_on'] : null,
        'led_on' => $row['led_on'] !== null ? (bool)$row['led_on'] : null
    ]
]);
?>
