// API_URL will be set by config.js
let API_URL = 'https://astrologer-platfrom.onrender.com/api';
let currentUser = null;
let earningsChart = null;
let serviceChart = null;
let yearlyEarningsChart = null;

// =========================
// Realtime updates handling
// =========================
let realtimeIntervals = { stats: null, users: null, appts: null, earnings: null };
let inflight = { stats: false, users: false, appts: false, earnings: false };

function startRealtimeUpdates() {
    // Clear any existing intervals first
    stopRealtimeUpdates();

    // Poll frequencies (in ms)
    const STATS_EVERY = 15000;      // 15s
    const USERS_EVERY = 60000;      // 60s
    const APPTS_EVERY = 10000;      // 10s
    const EARNINGS_EVERY = 60000;   // 60s

    // Kick off initial refreshes safely
    safeRefresh('stats', loadDashboardStats);
    safeRefresh('users', loadUsers);
    safeRefresh('appts', loadAppointments);
    safeRefresh('earnings', loadEarningsData);

    // Set intervals
    realtimeIntervals.stats = setInterval(() => safeRefresh('stats', loadDashboardStats), STATS_EVERY);
    realtimeIntervals.users = setInterval(() => safeRefresh('users', loadUsers), USERS_EVERY);
    realtimeIntervals.appts = setInterval(() => safeRefresh('appts', loadAppointments), APPTS_EVERY);
    realtimeIntervals.earnings = setInterval(() => safeRefresh('earnings', loadEarningsData), EARNINGS_EVERY);

    // Pause/resume when tab visibility changes to save resources
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function stopRealtimeUpdates() {
    Object.values(realtimeIntervals).forEach(id => id && clearInterval(id));
    realtimeIntervals = { stats: null, users: null, appts: null, earnings: null };
    document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
    if (document.hidden) {
        // Pause intervals
        Object.values(realtimeIntervals).forEach(id => id && clearInterval(id));
    } else {
        // Resume fresh intervals
        startRealtimeUpdates();
    }
}

async function safeRefresh(key, fn) {
    if (inflight[key]) return; // Prevent overlapping fetches
    inflight[key] = true;
    try {
        await fn();
    } catch (e) {
        // Errors are handled inside each loader via showToast
    } finally {
        inflight[key] = false;
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    const auth = checkAuth();
    if (!auth) return;

    currentUser = auth.user;
    if (!currentUser.isAdmin) {
        window.location.href = '/user/dashboard.html';
        return;
    }

    // Set admin info
    document.getElementById('adminName').textContent = currentUser.name;

    // Load initial data
    await Promise.all([
        loadDashboardStats(),
        loadUsers(),
        loadAppointments(),
        loadEarningsData()
    ]);

    // Initialize sidebar functionality
    initializeSidebar();

    // Initialize charts
    initializeCharts();

    // Initialize filters
    initializeFilters();

    // Start realtime updates
    startRealtimeUpdates();
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

// Dashboard statistics
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/admin/summary`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        // Update statistics
        document.getElementById('totalUsers').textContent = data.totalUsers;
        document.getElementById('monthlyEarnings').textContent = data.monthlyEarnings.toFixed(2);
        document.getElementById('pendingAppointments').textContent = data.pendingAppointments.length;
        document.getElementById('monthlyTraffic').textContent = data.trafficStats.newUsersLast30Days;

        // Update earnings data
        document.getElementById('totalMonthlyEarnings').textContent = data.monthlyEarnings.toFixed(2);
        document.getElementById('totalYearlyEarnings').textContent = data.yearlyEarnings.toFixed(2);
        
        // Calculate and update other stats
        const averageMonthly = data.yearlyEarnings / 12;
        document.getElementById('averageMonthly').textContent = averageMonthly.toFixed(2);

        // Update charts
        updateServiceDistribution(data.serviceDistribution);
    } catch (error) {
        showToast('Error loading dashboard statistics', 'error');
    }
}

// User management
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const users = await response.json();

        const tbody = document.getElementById('usersList');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.contact}</td>
                <td>₹${user.walletBalance.toFixed(2)}</td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="viewUserDetails('${user._id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading users', 'error');
    }
}

// Appointment management
async function loadAppointments() {
    try {
        const response = await fetch(`${API_URL}/admin/appointments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const appointments = await response.json();

        const tbody = document.getElementById('appointmentsList');
        tbody.innerHTML = appointments.map(appointment => `
            <tr>
                <td>${appointment.userId.name}</td>
                <td>${appointment.type}</td>
                <td>${appointment.duration} minutes</td>
                <td>${appointment.problem}</td>
                <td>${new Date(appointment.scheduledFor).toLocaleString()}</td>
                <td>
                    <span class="badge ${getBadgeClass(appointment.status)}">
                        ${appointment.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="updateAppointmentStatus('${appointment._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error loading appointments', 'error');
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

// Charts initialization
function initializeCharts() {
    // Earnings Overview Chart
    const earningsCtx = document.getElementById('earningsChart').getContext('2d');
    earningsChart = new Chart(earningsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Daily Earnings',
                data: [],
                borderColor: '#020024',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Service Distribution Chart
    const serviceCtx = document.getElementById('serviceChart').getContext('2d');
    serviceChart = new Chart(serviceCtx, {
        type: 'doughnut',
        data: {
            labels: ['Calls', 'Chats'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#020024', '#030342']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Yearly Earnings Chart
    const yearlyCtx = document.getElementById('yearlyEarningsChart').getContext('2d');
    yearlyEarningsChart = new Chart(yearlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Earnings',
                data: [],
                backgroundColor: '#020024'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function updateServiceDistribution(distribution) {
    if (serviceChart) {
        serviceChart.data.datasets[0].data = [
            distribution.call || 0,
            distribution.chat || 0
        ];
        serviceChart.update();
    }
}

// Earnings data
async function loadEarningsData() {
    try {
        const response = await fetch(`${API_URL}/admin/earnings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();

        // Update earnings charts
        updateEarningsCharts(data);

        // Update revenue breakdown
        document.getElementById('callRevenue').textContent = data.callRevenue.toFixed(2);
        document.getElementById('chatRevenue').textContent = data.chatRevenue.toFixed(2);

        // Calculate and update growth rate
        const growthRate = ((data.currentMonthEarnings - data.previousMonthEarnings) / data.previousMonthEarnings * 100).toFixed(1);
        document.getElementById('growthRate').textContent = growthRate;
    } catch (error) {
        showToast('Error loading earnings data', 'error');
    }
}

function updateEarningsCharts(data) {
    // Update daily earnings chart
    if (earningsChart) {
        earningsChart.data.labels = data.dailyEarnings.map(item => item.date);
        earningsChart.data.datasets[0].data = data.dailyEarnings.map(item => item.amount);
        earningsChart.update();
    }

    // Update yearly earnings chart
    if (yearlyEarningsChart) {
        yearlyEarningsChart.data.labels = data.monthlyEarnings.map(item => item.month);
        yearlyEarningsChart.data.datasets[0].data = data.monthlyEarnings.map(item => item.amount);
        yearlyEarningsChart.update();
    }
}

// Filter initialization
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.appointment-filters button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterAppointments(button.getAttribute('data-filter'));
        });
    });
}

async function filterAppointments(status) {
    try {
        const response = await fetch(`${API_URL}/admin/appointments${status !== 'all' ? `?status=${status.toUpperCase()}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const appointments = await response.json();
        
        const tbody = document.getElementById('appointmentsList');
        tbody.innerHTML = appointments.map(appointment => `
            <tr>
                <td>${appointment.userId.name}</td>
                <td>${appointment.type}</td>
                <td>${appointment.duration} minutes</td>
                <td>${appointment.problem}</td>
                <td>${new Date(appointment.scheduledFor).toLocaleString()}</td>
                <td>
                    <span class="badge ${getBadgeClass(appointment.status)}">
                        ${appointment.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="updateAppointmentStatus('${appointment._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        showToast('Error filtering appointments', 'error');
    }
}

// Settings management
document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settings = {
        callRate: parseFloat(document.getElementById('callRate').value),
        chatRate: parseFloat(document.getElementById('chatRate').value),
        trialDuration: parseInt(document.getElementById('trialDuration').value),
        enableFreeTrial: document.getElementById('enableFreeTrial').checked
    };

    try {
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) {
            throw new Error('Failed to update settings');
        }

        showToast('Settings updated successfully', 'success');
    } catch (error) {
        showToast('Error updating settings', 'error');
    }
}); 
