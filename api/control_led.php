<?php
// ==========================================
// LED Control API Endpoint
// Receives LED control commands and updates ESP32
// ==========================================

require_once '../config.php';

// Set CORS headers for local access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST and GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Only POST or GET method allowed', 405);
}

// Get LED state
$led_on = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON input
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    // If not JSON, try to get POST data
    if ($data === null) {
        $data = $_POST;
    }
    
    if (isset($data['led_on'])) {
        $led_on = (bool)$data['led_on'];
    } else {
        sendError('LED status not provided');
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['led_on'])) {
        $led_on = (bool)$_GET['led_on'];
    } else {
        sendError('LED status not provided');
    }
}

// Store LED state in a simple file for ESP32 to retrieve
$led_state_file = __DIR__ . '/led_state.txt';
file_put_contents($led_state_file, $led_on ? '1' : '0');

sendJSON([
    'success' => true,
    'message' => 'LED control command received',
    'led_on' => $led_on,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
