const mongoose = require('mongoose');
const User = require('./models/UserNew');
require('dotenv').config();

async function testUserCreation() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrologer-platform');
        console.log('✅ Connected to MongoDB');

        // Test data
        const userData = {
            name: 'Test User Simple',
            email: 'simple@test.com',
            password: 'password123',
            contact: '9876543210'
        };

        console.log('📝 Creating user with data:', userData);

        // Try to create user directly
        const user = new User(userData);
        
        console.log('🔍 User object before save:', {
            name: user.name,
            email: user.email,
            password: typeof user.password,
            contact: user.contact
        });

        await user.save();
        console.log('✅ User created successfully!');
        console.log('👤 Created user:', {
            id: user._id,
            name: user.name,
            email: user.email,
            contact: user.contact
        });

    } catch (error) {
        console.error('❌ Error creating user:', error.message);
        console.error('Full error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

testUserCreation();
