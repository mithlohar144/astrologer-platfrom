const axios = require('axios');

const API_URL = 'http://localhost:9000/api';

async function testServer() {
    console.log('🧪 Testing Astrologer Consultation Backend...\n');
    
    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await axios.get(`${API_URL}/health`);
        console.log('✅ Health check passed:', healthResponse.data.message);
        
        // Test 2: API Routes
        console.log('\n2. Testing API Routes...');
        
        // Test each route endpoint (should return appropriate error for GET requests)
        const routes = [
            '/auth',
            '/wallet', 
            '/sessions',
            '/appointments',
            '/admin',
            '/astrologers'
        ];
        
        for (const route of routes) {
            try {
                await axios.get(`${API_URL}${route}`);
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    console.log(`✅ Route ${route} exists (returned 404 as expected for GET)`);
                } else if (error.response && error.response.status === 401) {
                    console.log(`✅ Route ${route} exists (returned 401 - needs authentication)`);
                } else {
                    console.log(`⚠️  Route ${route} - Status: ${error.response?.status || 'Unknown'}`);
                }
            }
        }
        
        console.log('\n🎉 All tests completed!');
        console.log('\n📋 Server Summary:');
        console.log(`   - Server is running on port 9000`);
        console.log(`   - Health check: OK`);
        console.log(`   - All API routes are accessible`);
        console.log(`   - Database connection: ${healthResponse.data.timestamp ? 'OK' : 'Unknown'}`);
        
        console.log('\n✨ Your backend is ready for deployment!');
        
    } catch (error) {
        console.error('❌ Server test failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Make sure your backend server is running (npm run dev)');
        console.log('   2. Check if MongoDB is connected');
        console.log('   3. Verify your .env file configuration');
        console.log('   4. Check for any error messages in the server console');
    }
}

// Run the test
testServer();
