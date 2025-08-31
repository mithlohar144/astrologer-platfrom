/**
 * Universal Navbar Update Utility
 * Handles authentication state and navbar updates across all pages
 */

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

// Get current user data
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
}

// Update navbar based on authentication state
function updateNavbar() {
    const user = getCurrentUser();
    const isAuthenticated = isLoggedIn();
    
    // Find navbar elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const profileBtn = document.getElementById('userDropdown'); // Corrected ID
    const profileDropdown = document.getElementById('userMenu'); // Corrected ID
    const userNameSpan = document.getElementById('userName');
    
    if (isAuthenticated && user) {
        // Hide login/register buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Show profile button/dropdown
        // The userDropdown button is inside the userMenu, so we just show the parent
        if (profileDropdown) {
            profileDropdown.style.display = 'block';
        }
        
        
        if (userNameSpan) {
            userNameSpan.textContent = user.name;
        }
        
        // Update profile links based on user role
        const dashboardLink = document.getElementById('dashboardLink');
        if (dashboardLink) {
            if (user.isAdmin) {
                dashboardLink.href = 'admin-dashboard.html';
                dashboardLink.innerHTML = '<i class="fas fa-tachometer-alt me-2"></i>Admin Dashboard';
            } else if (user.isAstrologer) {
                dashboardLink.href = 'astrologer-dashboard.html';
                dashboardLink.innerHTML = '<i class="fas fa-star me-2"></i>Astrologer Panel';
            } else {
                dashboardLink.href = 'user-dashboard.html';
                dashboardLink.innerHTML = '<i class="fas fa-user me-2"></i>My Dashboard';
            }
        }
    } else {
        // Show login/register buttons
        if (loginBtn) loginBtn.style.display = 'block';
        if (registerBtn) registerBtn.style.display = 'block';
        
        // Hide profile elements
        // The userDropdown button is inside the userMenu, so we just hide the parent
        if (profileDropdown) profileDropdown.style.display = 'none';
    }
}

// Logout function
function logout() {
    // Clear all stored data
    localStorage.clear();
    
    // Show success message
    showToast('Logged out successfully', 'success');
    
    // Update navbar immediately
    updateNavbar();
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Toast notification function (universal)
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    
    if (type === 'warning') {
        toast.style.color = '#212529';
    }
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Initialize navbar on page load
function initNavbar() {
    updateNavbar();
    
    // Add event listeners for auth state changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'token' || e.key === 'user') {
            updateNavbar();
        }
    });
    
    // Update navbar every 30 seconds to handle token expiration
    setInterval(updateNavbar, 30000);
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavbar);
} else {
    initNavbar();
}

// Export functions for global use
window.updateNavbar = updateNavbar;
window.logout = logout;
window.showToast = showToast;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
