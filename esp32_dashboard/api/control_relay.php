<?php
// ==========================================
// Relay Control API Endpoint
// Accepts POST/GET requests to control relay
// ==========================================

require_once '../config.php';

// Get relay state from request
$relay_on = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $relay_on = isset($data['relay_on']) ? (bool)$data['relay_on'] : false;
} else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $relay_on = isset($_GET['relay_on']) ? (bool)$_GET['relay_on'] : false;
}

// Store relay state in a file
$state_file = __DIR__ . '/relay_state.txt';
$state_value = $relay_on ? '1' : '0';

if (file_put_contents($state_file, $state_value) !== false) {
    sendJSON([
        'success' => true,
        'relay_on' => $relay_on,
        'message' => 'Relay state updated'
    ]);
} else {
    sendJSON([
        'success' => false,
        'error' => 'Failed to save relay state'
    ], 500);
}
?>
