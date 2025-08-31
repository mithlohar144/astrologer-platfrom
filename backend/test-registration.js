const fetch = require('node-fetch');

async function testRegistration() {
    console.log('🧪 Testing Registration Endpoint...\n');
    
    const API_URL = 'http://localhost:5000/api';
    
    try {
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Server is running:', healthData.message);
        
        // Test 2: Test registration endpoint
        console.log('\n2. Testing registration endpoint...');
        const registrationData = {
            name: 'Test User Debug',
            email: 'debug@example.com',
            contact: '9876543210',
            password: 'password123'
        };
        
        console.log('Sending registration data:', registrationData);
        
        const registerResponse = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });
        
        console.log('Response status:', registerResponse.status);
        console.log('Response headers:', Object.fromEntries(registerResponse.headers));
        
        const registerData = await registerResponse.text();
        console.log('Raw response:', registerData);
        
        try {
            const jsonData = JSON.parse(registerData);
            console.log('Parsed response:', jsonData);
            
            if (registerResponse.ok) {
                console.log('✅ Registration successful!');
            } else {
                console.log('❌ Registration failed:', jsonData.message);
                if (jsonData.errors) {
                    console.log('Validation errors:', jsonData.errors);
                }
            }
        } catch (parseError) {
            console.log('❌ Failed to parse JSON response:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    }
}

testRegistration();
