<?php
/**
 * save_order.php
 * 
 * Saves order data to the database.
 * Receives cart data as JSON via POST request
 * and inserts each item into the orders table.
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

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    $response['message'] = 'Please log in to place an order.';
    echo json_encode($response);
    exit();
}

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Get JSON data from request body
    $json_data = file_get_contents('php://input');
    $order_data = json_decode($json_data, true);
    
    // Check if data was received
    if (!$order_data || !isset($order_data['customer_id']) || !isset($order_data['items'])) {
        $response['message'] = 'Invalid order data received.';
        echo json_encode($response);
        exit();
    }
    
    $customer_id = intval($order_data['customer_id']);
    $items = $order_data['items'];
    
    // Validate customer_id
    if ($customer_id <= 0) {
        $response['message'] = 'Invalid customer ID.';
        echo json_encode($response);
        exit();
    }
    
    // Check if cart is empty
    if (empty($items)) {
        $response['message'] = 'Your cart is empty.';
        echo json_encode($response);
        exit();
    }
    
    try {
        // Get database connection
        $conn = getDBConnection();
        
        // Start transaction
        $conn->begin_transaction();
        
        $items_saved = 0;
        
        // Insert each cart item as an order
        foreach ($items as $item) {
            $product_id = isset($item['product_id']) ? intval($item['product_id']) : 0;
            $quantity = isset($item['quantity']) ? intval($item['quantity']) : 0;
            $total_price = isset($item['total_price']) ? floatval($item['total_price']) : 0.00;
            
            // Skip invalid items
            if ($product_id <= 0 || $quantity <= 0) {
                continue;
            }
            
            // Prepare and execute insert statement
            $stmt = $conn->prepare("INSERT INTO orders (customer_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("iidd", $customer_id, $product_id, $quantity, $total_price);
            
            if ($stmt->execute()) {
                $items_saved++;
            }
            
            $stmt->close();
        }
        
        // Commit transaction
        $conn->commit();
        
        // Check if any items were saved
        if ($items_saved > 0) {
            $response['success'] = true;
            $response['message'] = 'Order placed successfully! ' . $items_saved . ' item(s) saved.';
        } else {
            $response['message'] = 'No valid items to save.';
        }
        
        $conn->close();
        
    } catch (Exception $e) {
        // Rollback on error
        if (isset($conn)) {
            $conn->rollback();
            $conn->close();
        }
        $response['message'] = 'Database error: ' . $e->getMessage();
    }
    
} else {
    $response['message'] = 'Invalid request method.';
}

// Return JSON response
echo json_encode($response);
?>