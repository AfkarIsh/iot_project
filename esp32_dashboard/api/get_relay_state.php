<?php
// ==========================================
// Get Relay State API Endpoint
// Returns current relay state for ESP32
// ==========================================

require_once '../config.php';

// Read relay state from file
$state_file = __DIR__ . '/relay_state.txt';
$relay_on = false;

if (file_exists($state_file)) {
    $state_value = file_get_contents($state_file);
    $relay_on = ($state_value === '1');
}

sendJSON([
    'success' => true,
    'relay_on' => $relay_on
]);
?>
