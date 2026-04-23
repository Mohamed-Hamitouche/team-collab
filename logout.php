<?php
/**
 * logout.php
 * 
 * Handles user logout by destroying the session
 * and redirecting to the login page.
 */

// Start the session
session_start();

// Unset all session variables
$_SESSION = array();

// Destroy the session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Destroy the session
session_destroy();

// Redirect to login page
header('Location: index.html');
exit();
?>