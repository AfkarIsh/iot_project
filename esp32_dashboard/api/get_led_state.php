<?php
// ==========================================
// Get LED State API Endpoint
// Returns current LED state for ESP32
// ==========================================

require_once '../config.php';

// Set CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Only GET method is allowed', 405);
}

// Read LED state from file
$led_state_file = __DIR__ . '/led_state.txt';
$led_on = false;

if (file_exists($led_state_file)) {
    $content = file_get_contents($led_state_file);
    $led_on = ($content === '1');
}

sendJSON([
    'success' => true,
    'led_on' => $led_on,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
