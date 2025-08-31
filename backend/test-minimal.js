const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/astrologer-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define a completely fresh User schema
const testUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  contact: String
});

// Simple pre-save middleware
testUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  console.log('🔐 Hashing password:', typeof this.password, this.password);
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const TestUser = mongoose.model('TestUser', testUserSchema);

async function testRegistration() {
  try {
    console.log('🧪 Testing minimal user creation...');
    
    // Clear any existing test users
    await TestUser.deleteMany({ email: 'test@example.com' });
    
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      contact: '1234567890'
    };
    
    console.log('📝 Creating user with data:', userData);
    
    const user = new TestUser(userData);
    await user.save();
    
    console.log('✅ User created successfully!');
    console.log('User ID:', user._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testRegistration();
