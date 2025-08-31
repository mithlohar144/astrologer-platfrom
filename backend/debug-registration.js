const http = require('http');

function testRegistration() {
    console.log('🧪 Testing Registration Endpoint...\n');
    
    const postData = JSON.stringify({
        name: 'Test User Debug',
        email: 'debug@example.com',
        contact: '9876543210',
        password: 'password123'
    });
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    console.log('Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('Request data:', postData);
    
    const req = http.request(options, (res) => {
        console.log(`\nResponse Status: ${res.statusCode}`);
        console.log('Response Headers:', res.headers);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('\nRaw Response:', data);
            
            try {
                const jsonData = JSON.parse(data);
                console.log('Parsed Response:', JSON.stringify(jsonData, null, 2));
                
                if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log('✅ Registration successful!');
                } else {
                    console.log('❌ Registration failed!');
                    console.log('Error message:', jsonData.message);
                    if (jsonData.errors) {
                        console.log('Validation errors:', jsonData.errors);
                    }
                }
            } catch (parseError) {
                console.log('❌ Failed to parse JSON:', parseError.message);
                console.log('Raw response was:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Request failed:', error.message);
    });
    
    req.write(postData);
    req.end();
}

testRegistration();
