<?php
/**
 * login.php
 * 
 * Handles user authentication.
 * Receives login and password via POST request,
 * verifies credentials against the database,
 * and starts a session on successful login.
 */

session_start();

// Set JSON content type header
header('Content-Type: application/json');

// Include database connection
require_once 'db.php';

// Initialize response array
$response = [
    'success' => false,
    'message' => ''
];

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Get login credentials from POST data
    $login = isset($_POST['login']) ? trim($_POST['login']) : '';
    $password = isset($_POST['password']) ? trim($_POST['password']) : '';
    
    // Validate input
    if (empty($login) || empty($password)) {
        $response['message'] = 'Please enter both login and password.';
    } else {
        try {
            // Get database connection
            $conn = getDBConnection();
            
            // Prepare statement to prevent SQL injection
            $stmt = $conn->prepare("SELECT login, password FROM account WHERE login = ?");
            $stmt->bind_param("s", $login);
            $stmt->execute();
            $result = $stmt->get_result();
            
            // Check if user exists
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                
                // Verify password (plain text comparison as per project requirements)
                // In production, use password_verify() with hashed passwords
                if ($password === $row['password']) {
                    // Authentication successful
                    $_SESSION['user'] = $login;
                    $_SESSION['logged_in'] = true;
                    
                    $response['success'] = true;
                    $response['message'] = 'Login successful!';
                } else {
                    $response['message'] = 'Incorrect password. Please try again.';
                }
            } else {
                $response['message'] = 'User not found. Please check your login.';
            }
            
            // Close statement and connection
            $stmt->close();
            $conn->close();
            
        } catch (Exception $e) {
            $response['message'] = 'Database error: ' . $e->getMessage();
        }
    }
} else {
    $response['message'] = 'Invalid request method.';
}

// Return JSON response
echo json_encode($response);
?>