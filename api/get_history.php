<?php
// ==========================================
// Get Historical Sensor Data API Endpoint
// Returns sensor readings for specified time range
// ==========================================

require_once '../config.php';

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Only GET method is allowed', 405);
}

// Get parameters
$hours = isset($_GET['hours']) ? intval($_GET['hours']) : 24;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 500;

// Validate parameters
if ($hours < 1) $hours = 24;
if ($limit < 1) $limit = 100;
if ($limit > 1000) $limit = 1000; // Maximum 1000 records

// Connect to database
$conn = getDBConnection();

// Query historical data
$sql = "SELECT * FROM sensor_readings 
        WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        ORDER BY timestamp DESC 
        LIMIT ?";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    $conn->close();
    sendError('Database prepare failed: ' . $conn->error, 500);
}

$stmt->bind_param("ii", $hours, $limit);
$stmt->execute();
$result = $stmt->get_result();

$readings = [];
while ($row = $result->fetch_assoc()) {
    $readings[] = [
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
        'relay_on' => $row['relay_on'] !== null ? (bool)$row['relay_on'] : null
    ];
}

// Reverse to get chronological order
$readings = array_reverse($readings);

$stmt->close();
$conn->close();

sendJSON([
    'success' => true,
    'count' => count($readings),
    'hours' => $hours,
    'data' => $readings
]);
?>
