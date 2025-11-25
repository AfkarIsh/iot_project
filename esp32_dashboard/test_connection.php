<?php
// Test connection helper
require_once 'config.php';

try {
    $conn = getDBConnection();
    
    // Get database name
    $dbName = DB_NAME;
    
    // Get all tables
    $tables = [];
    $result = $conn->query("SHOW TABLES");
    while ($row = $result->fetch_array()) {
        $tables[] = $row[0];
    }
    
    // Check if sensor_readings exists
    $sensorTableExists = in_array('sensor_readings', $tables);
    
    // Count records
    $count = 0;
    if ($sensorTableExists) {
        $countResult = $conn->query("SELECT COUNT(*) as count FROM sensor_readings");
        $count = $countResult->fetch_assoc()['count'];
    }
    
    $conn->close();
    
    sendJSON([
        'success' => true,
        'database' => $dbName,
        'tables' => $tables,
        'sensor_table_exists' => $sensorTableExists,
        'sample_data' => $count
    ]);
    
} catch (Exception $e) {
    sendJSON([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
