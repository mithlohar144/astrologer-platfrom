const fetch = require('node-fetch');

const API_URL = 'http://localhost:9000/api';

async function testCompleteFlow() {
    console.log('🧪 Testing Complete Registration Flow...\n');

    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        console.log('✅ Health Check:', response.status, data.message);
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
        return;
    }

    // Test 2: Valid Registration
    console.log('\n2️⃣ Testing Valid Registration...');
    const testUser = {
        name: 'John Doe',
        email: `test${Date.now()}@example.com`,
        contact: '9876543210',
        password: 'password123'
    };

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();
        console.log('📡 Status:', response.status);
        console.log('📦 Response:', data);

        if (response.ok && data.success) {
            console.log('✅ Registration Successful!');
            console.log('🎯 User ID:', data.data.user.id);
            console.log('🔑 Token received:', !!data.data.token);
        } else {
            console.log('❌ Registration Failed:', data.message);
        }
    } catch (error) {
        console.log('💥 Registration Error:', error.message);
    }

    // Test 3: Duplicate Email Error
    console.log('\n3️⃣ Testing Duplicate Email Error...');
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser) // Same email as above
        });

        const data = await response.json();
        console.log('📡 Status:', response.status);
        console.log('📦 Response:', data);

        if (response.status === 409) {
            console.log('✅ Duplicate Email Error Handled Correctly!');
        } else {
            console.log('❌ Duplicate Email Error Not Handled Properly');
        }
    } catch (error) {
        console.log('💥 Duplicate Test Error:', error.message);
    }

    // Test 4: Missing Fields Error
    console.log('\n4️⃣ Testing Missing Fields Error...');
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'incomplete@test.com'
                // Missing contact and password
            })
        });

        const data = await response.json();
        console.log('📡 Status:', response.status);
        console.log('📦 Response:', data);

        if (response.status === 400 && data.missingFields) {
            console.log('✅ Missing Fields Error Handled Correctly!');
        } else {
            console.log('❌ Missing Fields Error Not Handled Properly');
        }
    } catch (error) {
        console.log('💥 Missing Fields Test Error:', error.message);
    }

    // Test 5: Invalid Email Format
    console.log('\n5️⃣ Testing Invalid Email Format...');
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'invalid-email',
                contact: '9876543210',
                password: 'password123'
            })
        });

        const data = await response.json();
        console.log('📡 Status:', response.status);
        console.log('📦 Response:', data);

        if (response.status === 400) {
            console.log('✅ Invalid Email Error Handled Correctly!');
        } else {
            console.log('❌ Invalid Email Error Not Handled Properly');
        }
    } catch (error) {
        console.log('💥 Invalid Email Test Error:', error.message);
    }

    console.log('\n🎉 Complete Flow Test Finished!');
}

// Run the test
testCompleteFlow().catch(console.error);
