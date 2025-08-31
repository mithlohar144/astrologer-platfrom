class CallInterface {
    constructor() {
        this.currentCall = null;
        this.callTimer = null;
        this.billingTimer = null;
        this.statusCheckInterval = null;
        this.API_URL = window.API_CONFIG && window.API_CONFIG.API_URL ? window.API_CONFIG.API_URL : 'http://localhost:9000/api';
        this.isCallActive = false;
        this.callStartTime = null;
        this.totalCost = 0;
        this.billingDuration = 0;
        // Default destination: auto-dial without asking user
        this.defaultPhoneNumber = '+917415794586';
    }

    // Initialize call interface
    init() {
        this.createCallInterface();
        this.bindEvents();
    }

    // Create call interface HTML
    createCallInterface() {
        const callInterfaceHTML = `
            <div id="callInterface" class="call-interface" style="display: none;">
                <div class="call-modal">
                    <div class="call-header">
                        <h4><i class="fas fa-phone me-2"></i>Voice Call</h4>
                        <button class="btn-close-call" onclick="callInterface.hideCallInterface()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="call-body">
                        <!-- Phone Number Input -->
                        <div class="phone-input-section" id="phoneInputSection" style="display: none;">
                            <div class="mb-3">
                                <label class="form-label">Your Phone Number</label>
                                <input type="tel" id="userPhoneNumber" class="form-control" 
                                       placeholder="+91XXXXXXXXXX" maxlength="13">
                                <small class="form-text text-muted">
                                    Enter your phone number to receive the call
                                </small>
                            </div>
                            <div class="wallet-info mb-3">
                                <div class="d-flex justify-content-between">
                                    <span>Wallet Balance:</span>
                                    <span class="fw-bold text-success">₹<span id="callWalletBalance">0</span></span>
                                </div>
                                <div class="d-flex justify-content-between">
                                    <span>Rate:</span>
                                    <span class="fw-bold">₹0.25/second</span>
                                </div>
                            </div>
                            <button class="btn btn-call w-100" onclick="callInterface.startCall()">
                                <i class="fas fa-phone me-2"></i>
                                Start Conference Call
                            </button>
                        </div>

                        <!-- Call Status Section -->
                        <div class="call-status-section" id="callStatusSection" style="display: block;">
                            <div class="call-status-display">
                                <div class="call-avatar">
                                    <i class="fas fa-user-circle"></i>
                                </div>
                                <h5>Astrologer Consultation</h5>
                                <p class="call-number">+91 7415794586</p>
                                
                                <div class="call-status" id="callStatus">
                                    <i class="fas fa-phone-alt me-2"></i>
                                    Connecting...
                                </div>
                                
                                <div class="call-timer" id="callTimer">
                                    00:00
                                </div>
                                
                                <div class="call-cost">
                                    <div class="cost-display">
                                        <span>Duration: <span id="callDuration">0s</span></span>
                                        <span>Cost: ₹<span id="callCost">0.00</span></span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="call-controls">
                                <button class="btn btn-danger btn-lg" onclick="callInterface.endCall()">
                                    <i class="fas fa-phone-slash me-2"></i>
                                    End Call
                                </button>
                            </div>
                        </div>

                        <!-- Call History Section -->
                        <div class="call-history-section" id="callHistorySection" style="display: none;">
                            <div class="call-summary">
                                <h5>Call Completed</h5>
                                <div class="summary-details">
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Duration:</span>
                                        <span id="finalDuration">0 seconds</span>
                                    </div>
                                    <div class="d-flex justify-content-between mb-2">
                                        <span>Total Cost:</span>
                                        <span class="fw-bold">₹<span id="finalCost">0.00</span></span>
                                    </div>
                                    <div class="d-flex justify-content-between">
                                        <span>Remaining Balance:</span>
                                        <span class="fw-bold text-success">₹<span id="remainingBalance">0</span></span>
                                    </div>
                                </div>
                                <button class="btn btn-primary w-100 mt-3" onclick="callInterface.resetInterface()">
                                    <i class="fas fa-phone me-2"></i>
                                    Make Another Call
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        const callStyles = `
            <style>
                .call-interface {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                }

                .call-modal {
                    background: white;
                    border-radius: 20px;
                    width: 90%;
                    max-width: 400px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    overflow: hidden;
                }

                .call-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    display: flex;
                    justify-content: between;
                    align-items: center;
                }

                .btn-close-call {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: auto;
                }

                .call-body {
                    padding: 30px;
                }

                .wallet-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    border-left: 4px solid #28a745;
                }

                .call-status-display {
                    text-align: center;
                    padding: 20px 0;
                }

                .call-avatar {
                    font-size: 4rem;
                    color: #667eea;
                    margin-bottom: 15px;
                }

                .call-status {
                    background: #e3f2fd;
                    color: #1976d2;
                    padding: 10px 20px;
                    border-radius: 25px;
                    display: inline-block;
                    margin: 15px 0;
                    font-weight: 600;
                }

                .call-status.in-progress {
                    background: #e8f5e8;
                    color: #2e7d32;
                }

                .call-status.ringing {
                    background: #fff3e0;
                    color: #f57c00;
                }

                .call-timer {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #2e7d32;
                    margin: 20px 0;
                }

                .call-cost {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                }

                .cost-display {
                    display: flex;
                    justify-content: space-between;
                    font-weight: 600;
                }

                .call-controls {
                    text-align: center;
                    margin-top: 20px;
                }

                .call-summary {
                    text-align: center;
                    padding: 20px 0;
                }

                .summary-details {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }

                .phone-input-section .form-control {
                    border-radius: 10px;
                    padding: 12px 15px;
                    border: 2px solid #e9ecef;
                    font-size: 1.1rem;
                }

                .phone-input-section .form-control:focus {
                    border-color: #667eea;
                    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
                }

                @media (max-width: 480px) {
                    .call-modal {
                        width: 95%;
                        margin: 20px;
                    }
                    
                    .call-body {
                        padding: 20px;
                    }
                }
            </style>
        `;

        // Add to document
        document.head.insertAdjacentHTML('beforeend', callStyles);
        document.body.insertAdjacentHTML('beforeend', callInterfaceHTML);
    }

    // Bind events
    bindEvents() {
        // Format phone number input
        const phoneInput = document.getElementById('userPhoneNumber');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.formatPhoneNumber);
        }
    }

    // Format phone number
    formatPhoneNumber(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0 && !value.startsWith('91')) {
            value = '91' + value;
        }
        if (value.length > 12) {
            value = value.substring(0, 12);
        }
        e.target.value = '+' + value;
    }

    // Show call interface
    showCallInterface() {
        document.getElementById('callInterface').style.display = 'flex';
        this.updateWalletBalance();
        // Prefill and auto-start the call to default number
        const input = document.getElementById('userPhoneNumber');
        if (input) {
            input.value = this.defaultPhoneNumber;
        }
        // Immediately switch UI to status view (no prompt)
        const phoneSection = document.getElementById('phoneInputSection');
        const statusSection = document.getElementById('callStatusSection');
        const historySection = document.getElementById('callHistorySection');
        if (phoneSection) phoneSection.style.display = 'none';
        if (statusSection) statusSection.style.display = 'block';
        if (historySection) historySection.style.display = 'none';
        const statusEl = document.getElementById('callStatus');
        if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-phone-alt me-2"></i>Connecting...';
            statusEl.className = 'call-status';
        }
        // Start immediately
        this.startCall();
    }

    // Hide call interface
    hideCallInterface() {
        if (this.isCallActive) {
            if (!confirm('Are you sure you want to close? This will end your active call.')) {
                return;
            }
            this.endCall();
        }
        document.getElementById('callInterface').style.display = 'none';
        this.resetInterface();
    }

    // Update wallet balance
    async updateWalletBalance() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    document.getElementById('callWalletBalance').textContent = data.data.walletBalance || 0;
                }
            }
        } catch (error) {
            console.error('Failed to update wallet balance:', error);
        }
    }

    // Start call
    async startCall() {
        const inputEl = document.getElementById('userPhoneNumber');
        const phoneNumber = (inputEl && inputEl.value) ? inputEl.value : this.defaultPhoneNumber;
        
        if (!phoneNumber || phoneNumber.length < 10) {
            this.showError('Please enter a valid phone number');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.API_URL}/call/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userPhoneNumber: phoneNumber })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                this.currentCall = data.data;
                this.isCallActive = true;
                this.showCallStatus();
                this.startStatusChecking();
                this.showSuccess('Call initiated! You will receive a call shortly.');
            } else {
                throw new Error(data.message || 'Failed to start call');
            }
        } catch (error) {
            console.error('Start call error:', error);
            this.showError(error.message || 'Failed to start call');
        }
    }

    // Show call status section
    showCallStatus() {
        document.getElementById('phoneInputSection').style.display = 'none';
        document.getElementById('callStatusSection').style.display = 'block';
        document.getElementById('callHistorySection').style.display = 'none';
    }

    // Start status checking
    startStatusChecking() {
        this.statusCheckInterval = setInterval(async () => {
            await this.checkCallStatus();
        }, 2000);
    }

    // Check call status
    async checkCallStatus() {
        if (!this.currentCall) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.API_URL}/call/status/${this.currentCall.callId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.updateCallDisplay(data.data);
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
        }
    }

    // Update call display
    updateCallDisplay(callData) {
        const statusElement = document.getElementById('callStatus');
        const timerElement = document.getElementById('callTimer');
        const durationElement = document.getElementById('callDuration');
        const costElement = document.getElementById('callCost');

        // Update status
        switch (callData.status) {
            case 'ringing':
                statusElement.innerHTML = '<i class="fas fa-phone-alt me-2"></i>Ringing...';
                statusElement.className = 'call-status ringing';
                break;
            case 'in-progress':
                statusElement.innerHTML = '<i class="fas fa-phone me-2"></i>Connected';
                statusElement.className = 'call-status in-progress';
                if (!this.callStartTime) {
                    this.callStartTime = new Date();
                    this.startCallTimer();
                }
                break;
            case 'completed':
                this.handleCallCompleted(callData);
                return;
        }

        // Update billing info
        this.billingDuration = callData.billingDuration || 0;
        this.totalCost = callData.totalCost || 0;
        
        durationElement.textContent = `${this.billingDuration}s`;
        costElement.textContent = this.totalCost.toFixed(2);

        // Update wallet balance
        if (callData.walletBalance !== undefined) {
            document.getElementById('callWalletBalance').textContent = callData.walletBalance;
        }
    }

    // Start call timer
    startCallTimer() {
        this.callTimer = setInterval(() => {
            if (this.callStartTime) {
                const elapsed = Math.floor((new Date() - this.callStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('callTimer').textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // End call
    async endCall() {
        // If there's no active call record, just close UI gracefully
        if (!this.currentCall) {
            this.cleanup();
            document.getElementById('callInterface').style.display = 'none';
            this.showSuccess('Call ended');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${this.API_URL}/call/end/${this.currentCall.callId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.handleCallCompleted(data.data);
                }
            }
        } catch (error) {
            console.error('End call error:', error);
            this.showError('Failed to end call properly');
        }

        this.cleanup();
        // Close UI after cleanup
        document.getElementById('callInterface').style.display = 'none';
    }

    // Handle call completed
    handleCallCompleted(callData) {
        this.cleanup();
        
        // Show call summary
        document.getElementById('callStatusSection').style.display = 'none';
        document.getElementById('callHistorySection').style.display = 'block';
        
        document.getElementById('finalDuration').textContent = `${callData.duration || this.billingDuration} seconds`;
        document.getElementById('finalCost').textContent = (callData.totalCost || this.totalCost).toFixed(2);
        document.getElementById('remainingBalance').textContent = callData.walletBalanceAfter || 0;
        
        this.showSuccess('Call completed successfully!');
        
        // Update main dashboard wallet balance
        if (window.loadUserData) {
            window.loadUserData();
        }
    }

    // Cleanup timers and intervals
    cleanup() {
        this.isCallActive = false;
        this.currentCall = null;
        this.callStartTime = null;
        
        if (this.callTimer) {
            clearInterval(this.callTimer);
            this.callTimer = null;
        }
        
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    // Reset interface
    resetInterface() {
        this.cleanup();
        const phoneSection = document.getElementById('phoneInputSection');
        const statusSection = document.getElementById('callStatusSection');
        const historySection = document.getElementById('callHistorySection');
        if (phoneSection) phoneSection.style.display = 'none';
        if (statusSection) statusSection.style.display = 'none';
        if (historySection) historySection.style.display = 'none';
        document.getElementById('userPhoneNumber').value = '';
        document.getElementById('callTimer').textContent = '00:00';
        this.updateWalletBalance();
    }

    // Show success message
    showSuccess(message) {
        if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    // Show error message
    showError(message) {
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Initialize call interface
const callInterface = new CallInterface();
document.addEventListener('DOMContentLoaded', () => {
    callInterface.init();
});
