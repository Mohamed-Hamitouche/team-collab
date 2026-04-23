<?php
/**
 * Database Connection Configuration
 * 
 * This file establishes a connection to the MySQL database.
 * Include this file in all PHP scripts that need database access.
 * 
 * NOTE: Update these credentials to match your MySQL server configuration.
 */

// Database configuration constants
// Change these values to match your MySQL server setup
define('DB_HOST', 'localhost');      // MySQL server hostname
define('DB_USER', 'root');           // MySQL username
define('DB_PASS', '');               // MySQL password (empty for default XAMPP)
define('DB_NAME', 'ecommerce_db');   // Database name

/**
 * Get database connection
 * 
 * @return mysqli Database connection object
 */
function getDBConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Check connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    
    // Set charset to handle special characters
    $conn->set_charset("utf8mb4");
    
    return $conn;
}
?>