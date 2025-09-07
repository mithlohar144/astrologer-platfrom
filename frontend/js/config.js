// Configuration for different environments
const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const CONFIG = {
  API_URL: isLocalHost
    ? 'https://astrologer-platfrom.onrender.com/api'
    : 'http://localhost:9000/api',


  // Session timeout in minutes
  SESSION_TIMEOUT: 30,
  
  // API endpoints
  ENDPOINTS: {
    AUTH: '/auth',
    WALLET: '/wallet',
    SESSIONS: '/sessions',
    APPOINTMENTS: '/appointments',
    ADMIN: '/admin',
    ASTROLOGERS: '/astrologers'
  },
  
  // Toast notification duration in ms
  TOAST_DURATION: 3000
};

// Prevent modifications to the config object
Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);

// Export for use in other files
window.API_CONFIG = {
    API_URL: CONFIG.API_URL,
    // Do not expose payment keys here. For Razorpay, obtain the key from
    // your backend's create-order response. See wallet-recharge.html usage.
    isDevelopment: isLocalHost
};

console.log('Environment:', window.API_CONFIG.isDevelopment ? 'Development' : 'Production');
console.log('API URL:', window.API_CONFIG.API_URL);
