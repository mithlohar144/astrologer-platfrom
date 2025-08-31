// API_URL will be set by config.js
let API_URL = window.API_CONFIG?.API_URL || 'http://localhost:9000/api';
let currentUser = null;

// Show toast notification
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const auth = checkAuth();
        if (!auth) return;

        currentUser = auth.user;
        if (!currentUser || !currentUser.id) {
            // If user data is incomplete, clear localStorage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../login.html';
            return;
        }

        if (currentUser.isAdmin) {
            window.location.href = '../admin/dashboard.html';
            return;
        }

        // Set user info
        document.getElementById('userName').textContent = currentUser.name || 'User';
        document.getElementById('welcomeName').textContent = currentUser.name || 'User';

        // Load initial data with error handling
        try {
            await Promise.all([
                loadWalletBalance().catch(err => {
                    console.error('Failed to load wallet balance:', err);
                    showToast('Failed to load wallet balance. Please refresh.', 'error');
                }),
                loadTransactionHistory().catch(err => {
                    console.error('Failed to load transactions:', err);
                    document.getElementById('transactionHistory').innerHTML = 
                        '<tr><td colspan="5" class="text-center">Failed to load transactions</td></tr>';
                }),
                loadConsultationHistory().catch(err => {
                    console.error('Failed to load consultations:', err);
                    document.getElementById('consultationHistory').innerHTML = 
                        '<tr><td colspan="5" class="text-center">Failed to load consultations</td></tr>';
                }),
                checkTrialStatus().catch(err => {
                    console.error('Failed to check trial status:', err);
                }),
                loadUserProfile().catch(err => {
                    console.error('Failed to load profile:', err);
                })
            ]);
        } catch (err) {
            console.error('Error loading dashboard data:', err);
            showToast('Some dashboard data could not be loaded. Please refresh.', 'error');
        }

        // Initialize sidebar functionality
        initializeSidebar();
        
        // Initialize form handlers
        initializeProfileForms();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showToast('Error initializing dashboard. Please refresh the page.', 'error');
    }
});

// Sidebar navigation
function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll('#sidebar a');
    const sections = document.querySelectorAll('.content-section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('data-section');
            
            // Update active states
            sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
            link.parentElement.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });

    // Toggle sidebar
    document.getElementById('sidebarCollapse').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });
}

// Wallet functions
async function loadWalletBalance() {
    try {
        const response = await fetch(`${API_URL}/auth/user/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load wallet balance');
        }
        
        const data = await response.json();
        
        const balance = data.walletBalance.toFixed(2);
        document.getElementById('userBalance').textContent = balance;
        document.getElementById('overviewBalance').textContent = balance;
        document.getElementById('walletBalance').textContent = balance;
    } catch (error) {
        showToast('Error loading wallet balance: ' + error.message, 'error');
    }
}

async function loadTransactionHistory() {
    try {
        const response = await fetch(`${API_URL}/wallet/history/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load transaction history');
        }
        
        const transactions = await response.json();
        
        const tbody = document.getElementById('transactionHistory');
        if (transactions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No transactions found</td></tr>`;
            return;
        }
        
        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${new Date(transaction.createdAt).toLocaleDateString()}</td>
                <td>${transaction.type}</td>
                <td>₹${transaction.amount.toFixed(2)}</td>
                <td>${transaction.description}</td>
                <td>
                    <span class="badge ${transaction.status === 'SUCCESS' ? 'bg-success' : 'bg-danger'}">
                        ${transaction.status}
                    </span>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading transaction history: ' + error.message, 'error');
    }
}

// Consultation functions
async function loadConsultationHistory() {
    try {
        const response = await fetch(`${API_URL}/session/appointments/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load consultation history');
        }
        
        const appointments = await response.json();
        
        const tbody = document.getElementById('consultationHistory');
        if (appointments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center">No consultations found</td></tr>`;
            document.getElementById('totalConsultations').textContent = '0';
            return;
        }
        
        tbody.innerHTML = appointments.map(appointment => `
            <tr>
                <td>${new Date(appointment.scheduledFor).toLocaleDateString()}</td>
                <td>${appointment.type}</td>
                <td>${appointment.duration} minutes</td>
                <td>₹${appointment.amount.toFixed(2)}</td>
                <td>
                    <span class="badge ${getBadgeClass(appointment.status)}">
                        ${appointment.status}
                    </span>
                </td>
            </tr>
        `).join('');

        document.getElementById('totalConsultations').textContent = appointments.length;
    } catch (error) {
        showToast('Error loading consultation history: ' + error.message, 'error');
    }
}

function getBadgeClass(status) {
    switch (status) {
        case 'COMPLETED': return 'bg-success';
        case 'PENDING': return 'bg-warning';
        case 'CANCELLED': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

async function checkTrialStatus() {
    try {
        const response = await fetch(`${API_URL}/auth/user/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to check trial status');
        }
        
        const data = await response.json();
        
        const trialStatus = data.hasUsedFreeTrial ? 'Used' : 'Available';
        document.getElementById('trialStatus').textContent = trialStatus;
        document.getElementById('callTrialStatus').textContent = data.hasUsedFreeTrial ? 'Free trial used' : 'First 5 minutes free!';
        document.getElementById('chatTrialStatus').textContent = data.hasUsedFreeTrial ? 'Free trial used' : 'First 5 minutes free!';
    } catch (error) {
        showToast('Error checking trial status: ' + error.message, 'error');
    }
}

// Session functions
async function startCall() {
    const duration = document.getElementById('callDuration').value;
    startSession('CALL', duration);
}

async function startChat() {
    const duration = document.getElementById('chatDuration').value;
    startSession('CHAT', duration);
}

async function startSession(type, duration) {
    const modal = new bootstrap.Modal(document.getElementById('consultationModal'));
    document.getElementById('consultationType').textContent = type;
    document.getElementById('consultationDuration').textContent = duration;
    
    const rate = type === 'CALL' ? 15 : 10;
    document.getElementById('consultationCost').textContent = (rate * duration).toFixed(2);
    
    modal.show();
}

async function confirmConsultation() {
    const type = document.getElementById('consultationType').textContent;
    const duration = document.getElementById('consultationDuration').textContent;
    const problem = document.getElementById('problem').value;

    if (!problem) {
        showToast('Please describe your problem', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/session/start-${type.toLowerCase()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                duration: parseInt(duration),
                problem
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to start consultation');
        }

        bootstrap.Modal.getInstance(document.getElementById('consultationModal')).hide();
        showToast(`${type} session started successfully!`, 'success');
        
        // Reload data
        await Promise.all([
            loadWalletBalance(),
            loadTransactionHistory(),
            loadConsultationHistory(),
            checkTrialStatus()
        ]);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Wallet recharge functions
async function rechargeWallet(amount) {
    // Show message that Razorpay is temporarily disabled
    showToast('Razorpay integration is temporarily disabled. Adding funds directly.', 'info');
    
    try {
        // For testing without Razorpay, use direct topup
        const response = await fetch(`${API_URL}/wallet/topup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to recharge wallet');
        }

        showToast(`₹${amount} added to your wallet successfully!`, 'success');
        await Promise.all([
            loadWalletBalance(),
            loadTransactionHistory()
        ]);
    } catch (error) {
        showToast('Error recharging wallet: ' + error.message, 'error');
    }
    
    /* 
    // Uncomment this code when Razorpay is configured
    try {
        // Create Razorpay order
        const orderResponse = await fetch(`${API_URL}/wallet/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount })
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok) {
            throw new Error(orderData.message || 'Failed to create payment order');
        }

        const options = {
            key: 'YOUR_RAZORPAY_KEY_ID', // Replace with actual key
            amount: orderData.amount,
            currency: 'INR',
            name: 'Astrology Platform',
            description: 'Wallet Recharge',
            order_id: orderData.id,
            handler: async function(response) {
                await verifyPayment(response, amount);
            },
            prefill: {
                name: currentUser.name,
                email: currentUser.email,
                contact: currentUser.contact
            },
            theme: {
                color: '#020024'
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        showToast('Error initiating payment: ' + error.message, 'error');
    }
    */
}

async function verifyPayment(response, amount) {
    try {
        const verifyResponse = await fetch(`${API_URL}/wallet/verify-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount
            })
        });

        const data = await verifyResponse.json();

        if (!verifyResponse.ok) {
            throw new Error(data.message || 'Failed to verify payment');
        }

        showToast('Payment successful! Wallet updated.', 'success');
        await Promise.all([
            loadWalletBalance(),
            loadTransactionHistory()
        ]);
    } catch (error) {
        showToast('Error verifying payment: ' + error.message, 'error');
    }
}

function rechargeCustomAmount() {
    const amount = document.getElementById('rechargeAmount').value;
    if (!amount || amount < 1) {
        showToast('Please enter a valid amount', 'error');
        return;
    }
    rechargeWallet(parseFloat(amount));
}

// Profile functions
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/user/${currentUser.id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load user profile');
        }
        
        const user = await response.json();
        
        // Fill profile form
        document.getElementById('profileName').value = user.name;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileContact').value = user.contact;
    } catch (error) {
        showToast('Error loading profile: ' + error.message, 'error');
    }
}

function initializeProfileForms() {
    // Profile update form
    const profileForm = document.getElementById('profileForm');
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!profileForm.checkValidity()) {
            e.stopPropagation();
            profileForm.classList.add('was-validated');
            return;
        }
        
        const name = document.getElementById('profileName').value;
        const contact = document.getElementById('profileContact').value;
        
        try {
            const response = await fetch(`${API_URL}/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    name,
                    contact
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update profile');
            }
            
            // Update local storage user data
            const user = JSON.parse(localStorage.getItem('user'));
            user.name = name;
            localStorage.setItem('user', JSON.stringify(user));
            
            // Update UI
            document.getElementById('userName').textContent = name;
            document.getElementById('welcomeName').textContent = name;
            
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            showToast('Error updating profile: ' + error.message, 'error');
        }
    });
    
    // Password change form
    const passwordForm = document.getElementById('passwordForm');
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!passwordForm.checkValidity()) {
            e.stopPropagation();
            passwordForm.classList.add('was-validated');
            return;
        }
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmNewPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: currentUser.id,
                    currentPassword,
                    newPassword
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to change password');
            }
            
            // Reset form
            passwordForm.reset();
            passwordForm.classList.remove('was-validated');
            
            showToast('Password changed successfully!', 'success');
        } catch (error) {
            showToast('Error changing password: ' + error.message, 'error');
        }
    });
} 

const paymentButton = ()=>{
    console.log("Payment button clicked");
    alert("Start")
};