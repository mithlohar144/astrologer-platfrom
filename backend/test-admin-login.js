const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/UserNew');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrologer-platform');
    console.log('MongoDB Connected for admin test');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const testAdminLogin = async () => {
  try {
    await connectDB();

    console.log('🔍 Testing admin login...');
    
    // Check if admin user exists
    const adminUser = await User.findOne({ email: 'admin@astrologer.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in database');
      console.log('📝 Creating admin user...');
      
      const adminPassword = await bcrypt.hash('admin123', 12);
      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@astrologer.com',
        password: adminPassword,
        contact: '9999999999',
        isAdmin: true,
        walletBalance: 0,
        isActive: true
      });
      
      console.log('✅ Admin user created:', {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        isAdmin: newAdmin.isAdmin,
        isActive: newAdmin.isActive
      });
    } else {
      console.log('✅ Admin user found:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        isAdmin: adminUser.isAdmin,
        isActive: adminUser.isActive
      });
      
      // Test password
      const isPasswordValid = await adminUser.comparePassword('admin123');
      console.log('🔐 Password test result:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
      
      if (!isPasswordValid) {
        console.log('🔧 Fixing admin password...');
        const newPassword = await bcrypt.hash('admin123', 12);
        adminUser.password = newPassword;
        await adminUser.save();
        console.log('✅ Admin password updated');
      }
    }
    
    console.log('🎯 Admin login test completed');
    console.log('📋 Admin credentials:');
    console.log('   Email: admin@astrologer.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Admin test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Database disconnected');
  }
};

// Run test
if (require.main === module) {
  testAdminLogin();
}

module.exports = { testAdminLogin };
