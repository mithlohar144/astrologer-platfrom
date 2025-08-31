// API_URL will be set by config.js
let API_URL = 'https://astrologer-platfrom.onrender.com';

// Handle preloader
document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('fade-out');
            
            // Enable scrolling after preloader is gone
            setTimeout(() => {
                document.body.style.overflow = 'visible';
                preloader.style.display = 'none';
            }, 500);
        }, 1000);
    }
    
    // Add animation classes to elements
    document.querySelectorAll('.form-control, .btn-primary, .form-check-input').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.animation = `fadeIn 0.5s forwards ${index * 0.1}s`;
    });
});

// Toast notification function
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Check if API is available
async function checkApiAvailability() {
    try {
        const response = await fetch(`${API_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Toggle password visibility
document.querySelectorAll('#togglePassword').forEach(button => {
    button.addEventListener('click', function() {
        const passwordInput = this.previousElementSibling;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye');
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });
});

// Handle login form
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!loginForm.checkValidity()) {
            e.stopPropagation();
            loginForm.classList.add('was-validated');
            return;
        }

        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');

        try {
            // Check API availability first
            const isApiAvailable = await checkApiAvailability();
            if (!isApiAvailable) {
                throw new Error('Server is not responding. Please check if the backend server is running.');
            }

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Store token and user info
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: data.data.user.id,
                name: data.data.user.name,
                email: data.data.user.email,
                isAdmin: data.data.user.isAdmin
            }));

            showToast('Login successful!', 'success');

            // Redirect based on user role
            setTimeout(() => {
                if (data.data.user.isAdmin) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1000);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    });
}

// Handle registration form
if (document.getElementById('registerForm')) {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!registerForm.checkValidity()) {
            e.stopPropagation();
            registerForm.classList.add('was-validated');
            return;
        }

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            document.getElementById('confirmPassword').setCustomValidity('Passwords do not match');
            registerForm.classList.add('was-validated');
            return;
        }

        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');

        try {
            // Check API availability first
            const isApiAvailable = await checkApiAvailability();
            if (!isApiAvailable) {
                throw new Error('Server is not responding. Please check if the backend server is running.');
            }

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    contact: document.getElementById('contact').value,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            showToast('Registration successful! Logging you in...', 'success');
            
            // Automatically log the user in after successful registration
            try {
                const loginResponse = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: document.getElementById('email').value,
                        password: password
                    })
                });
                
                const loginData = await loginResponse.json();
                
                if (!loginResponse.ok) {
                    throw new Error(loginData.message || 'Auto-login failed');
                }
                
                // Store token and user info
                localStorage.setItem('token', loginData.data.token);
                localStorage.setItem('user', JSON.stringify({
                    id: loginData.data.user.id,
                    name: loginData.data.user.name,
                    email: loginData.data.user.email,
                    isAdmin: loginData.data.user.isAdmin
                }));
                
                // Redirect to homepage (users can't be admin via registration)
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } catch (loginError) {
                // If auto-login fails, redirect to login page
                showToast('Please login with your new credentials', 'info');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
        }
    });

    // Real-time password confirmation validation
    document.getElementById('confirmPassword').addEventListener('input', function() {
        const password = document.getElementById('password').value;
        if (this.value !== password) {
            this.setCustomValidity('Passwords do not match');
        } else {
            this.setCustomValidity('');
        }
    });
}

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        // Fix the path to be relative instead of absolute
        const currentPath = window.location.pathname;
        
        // If we're in a subdirectory like /admin/ or /user/, we need to go back one level
        if (currentPath.includes('/admin/') || currentPath.includes('/user/')) {
            window.location.href = '../login.html';
        } else {
            window.location.href = 'login.html';
        }
        return;
    }

    return { token, user };
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Get the current path to determine how many directories to go back
    const currentPath = window.location.pathname;
    
    // If we're in a subdirectory like /admin/ or /user/, we need to go back one level
    if (currentPath.includes('/admin/') || currentPath.includes('/user/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
    
    showToast('Logged out successfully', 'success');
} 
