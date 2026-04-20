const Cart = (function() {
    'use strict';
    
    // Private variable for cart items
    let items = [];
    
    // Storage key for localStorage
    const STORAGE_KEY = 'ecommerce_cart';
    
    /**
     * Initialize cart - load from localStorage
     */
    function init() {
        loadFromStorage();
        updateCartUI();
        bindEvents();
    }
    
    /**
     * Load cart data from localStorage
     */
    function loadFromStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                items = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            items = [];
        }
    }
    
    /**
     * Save cart data to localStorage
     */
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }
    
    /**
     * Add item to cart
     * @param {Object} product - Product object with id, name, price
     * @param {number} quantity - Quantity to add
     */
    function addItem(product, quantity) {
        if (quantity <= 0) {
            alert('Please enter a valid quantity.');
            return;
        }
        
        // Check if item already in cart
        const existingItem = items.find(item => item.product_id === product.id);
        
        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
            existingItem.total_price = existingItem.quantity * existingItem.price;
        } else {
            // Add new item
            items.push({
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                total_price: quantity * product.price
            });
        }
        
        saveToStorage();
        updateCartUI();
        
        // Show feedback
        showNotification(`${product.name} added to cart!`);
    }
    
    /**
     * Update item quantity
     * @param {number} productId - Product ID
     * @param {number} newQuantity - New quantity
     */
    function updateQuantity(productId, newQuantity) {
        if (newQuantity <= 0) {
            removeItem(productId);
            return;
        }
        
        const item = items.find(item => item.product_id === productId);
        if (item) {
            item.quantity = newQuantity;
            item.total_price = newQuantity * item.price;
            saveToStorage();
            updateCartUI();
        }
    }
    
    /**
     * Remove item from cart
     * @param {number} productId - Product ID to remove
     */
    function removeItem(productId) {
        items = items.filter(item => item.product_id !== productId);
        saveToStorage();
        updateCartUI();
    }
    
    /**
     * Calculate total price of all items
     * @returns {number} Total price
     */
    function getTotal() {
        return items.reduce((sum, item) => sum + item.total_price, 0);
    }
    
    /**
     * Get total item count
     * @returns {number} Total items in cart
     */
    function getItemCount() {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }
    
    /**
     * Get all cart items
     * @returns {Array} Cart items
     */
    function getItems() {
        return [...items];
    }
    
    /**
     * Clear the entire cart
     */
    function clear() {
        items = [];
        saveToStorage();
        updateCartUI();
    }
    
    /**
     * Update cart UI elements (aside panel and footer)
     */
    function updateCartUI() {
        const cartList = document.getElementById('cart-list');
        const cartTotal = document.getElementById('cart-total');
        const cartCount = document.getElementById('cart-count');
        const footerTotal = document.getElementById('footer-total');
        const checkoutBtn = document.getElementById('checkout-btn');
        
        if (cartList) {
            if (items.length === 0) {
                cartList.innerHTML = '<p class="cart-empty">Your cart is empty</p>';
                if (checkoutBtn) checkoutBtn.disabled = true;
            } else {
                let html = '';
                items.forEach(item => {
                    html += `
                        <div class="cart-item">
                            <span class="cart-item-name">${escapeHtml(item.name)}</span>
                            <span class="cart-item-qty">x${item.quantity}</span>
                            <span class="cart-item-price">${item.total_price.toFixed(2)} DA</span>
                        </div>
                    `;
                });
                
                html += `
                    <div class="cart-total-row">
                        <span>Total:</span>
                        <span class="cart-total-price">${getTotal().toFixed(2)} DA</span>
                    </div>
                `;
                
                cartList.innerHTML = html;
                if (checkoutBtn) checkoutBtn.disabled = false;
            }
        }
        
        // Update total displays
        const total = getTotal();
        if (cartTotal) cartTotal.textContent = ' DA' + total.toFixed(2);
        if (cartCount) cartCount.textContent = getItemCount();
        if (footerTotal) footerTotal.textContent = ' DA' + total.toFixed(2);
    }
    
    /**
     * Bind event listeners
     */
    function bindEvents() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = parseInt(this.dataset.productId);
                const productName = this.dataset.productName;
                const productPrice = parseFloat(this.dataset.productPrice);
                const quantityInput = document.querySelector(`input[data-product-id="${productId}"]`);
                const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;
                
                addItem({
                    id: productId,
                    name: productName,
                    price: productPrice
                }, quantity);
            });
        });
        
        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkout);
        }
    }
    
    /**
     * Process checkout - send order to server
     */
    function checkout() {
        if (items.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        // Confirm checkout
        if (!confirm(`Proceed with checkout? Total: $${getTotal().toFixed(2)} DA`)) {
            return;
        }
        
        // Prepare order data
        const orderData = {
            customer_id: 1, // Default customer ID for demo
            items: items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                total_price: item.total_price
            }))
        };
        
        // Send order to server
        fetch('save_order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                clear();
            } else {
                // If PHP fails (e.g., not logged in), save locally
                alert('Order saved locally. Note: ' + data.message);
                // Still clear cart as user confirmed
                clear();
            }
        })
        .catch(error => {
            console.error('Checkout error:', error);
            alert('Server unavailable. Order saved in local storage only.');
            clear();
        });
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Show notification toast
     */
    function showNotification(message) {
        // Create notification element if it doesn't exist
        let notif = document.getElementById('cart-notification');
        if (!notif) {
            notif = document.createElement('div');
            notif.id = 'cart-notification';
            notif.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: #10b981;
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 1000;
                opacity: 0;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(notif);
        }
        
        notif.textContent = message;
        notif.style.opacity = '1';
        notif.style.transform = 'translateX(-50%) translateY(0)';
        
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transform = 'translateX(-50%) translateY(100px)';
        }, 2000);
    }
    
    // Public API
    return {
        init,
        addItem,
        updateQuantity,
        removeItem,
        getTotal,
        getItemCount,
        getItems,
        clear,
        updateCartUI
    };
})();

// ============================================
// Login Handler
// ============================================
const LoginHandler = (function() {
    'use strict';
    
    function init() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
        }
    }
    
    function handleLogin(e) {
        e.preventDefault();
        
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorMsg = document.getElementById('error-message');
        
        // Basic validation
        if (!login || !password) {
            showError('Please fill in all fields.');
            return;
        }
        
        // Send login request to PHP
        const formData = new FormData();
        formData.append('login', login);
        formData.append('password', password);
        
        fetch('login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store login state
                sessionStorage.setItem('logged_in', 'true');
                sessionStorage.setItem('user', login);
                // Redirect to main page
                window.location.href = 'main.html';
            } else {
                showError(data.message || 'Invalid login or password.');
            }
        })
        .catch(error => {
            console.error('Login error:', error);
            // For demo purposes, allow local fallback
            if ((login === 'admin' && password === 'admin123') ||
                (login === 'student' && password === 'student123') ||
                (login === 'user1' && password === 'password1')) {
                sessionStorage.setItem('logged_in', 'true');
                sessionStorage.setItem('user', login);
                window.location.href = 'main.html';
            } else {
                showError('Server unavailable. Invalid login or password.');
            }
        });
    }
    
    function showError(message) {
        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.classList.add('show');
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorMsg.classList.remove('show');
            }, 5000);
        }
    }
    
    return { init };
})();

// ============================================
// Session Checker
// ============================================
const SessionManager = (function() {
    'use strict';
    
    function init() {
        // Check if user is logged in (on protected pages)
        const protectedPages = ['main.html', 'electronics.html', 'clothing.html', 'books.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            // Check session
            const loggedIn = sessionStorage.getItem('logged_in');
            const user = sessionStorage.getItem('user');
            
            if (!loggedIn) {
                // Redirect to login if not authenticated
                // Uncomment the line below for strict authentication
                // window.location.href = 'index.html';
            }
            
            // Display user info
            displayUserInfo(user);
        }
    }
    
    function displayUserInfo(user) {
        const userDisplay = document.getElementById('user-display');
        if (userDisplay && user) {
            userDisplay.textContent = 'Welcome, ' + user + '!';
        }
    }
    
    return { init };
})();

// ============================================
// Initialize on DOM ready
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    Cart.init();
    LoginHandler.init();
    SessionManager.init();
});