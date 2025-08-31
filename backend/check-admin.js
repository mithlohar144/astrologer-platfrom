const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/UserNew');
require('dotenv').config();

async function checkAndFixAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrology-platform');
    console.log('Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ isAdmin: true });
    console.log('Found admin users:', adminUsers.length);

    for (let admin of adminUsers) {
      console.log('\n--- Admin User ---');
      console.log('ID:', admin._id);
      console.log('Name:', admin.name);
      console.log('Email:', admin.email);
      console.log('Mobile:', admin.mobile);
      console.log('Is Admin:', admin.isAdmin);
      console.log('Password Hash:', admin.password ? 'Set' : 'Not Set');
    }

    // Check if we have the expected admin
    let targetAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@stellarium.com' },
        { email: 'admin@astrologer.com' },
        { mobile: '+917354927108' }
      ]
    });

    if (!targetAdmin) {
      console.log('\n❌ No target admin found. Creating new admin...');
      
      // Create the admin user
      targetAdmin = new User({
        name: 'Admin User',
        email: 'admin@stellarium.com',
        mobile: '+917354927108',
        password: 'admin123',
        isAdmin: true,
        walletBalance: 10000,
        isVerified: true
      });

      await targetAdmin.save();
      console.log('✅ New admin user created!');
    } else {
      console.log('\n✅ Target admin found. Updating password...');
      
      // Update the password to ensure it's correct
      targetAdmin.password = 'admin123';
      await targetAdmin.save();
      console.log('✅ Admin password updated!');
    }

    console.log('\n🔑 ADMIN LOGIN CREDENTIALS:');
    console.log('Email: admin@stellarium.com');
    console.log('Password: admin123');
    console.log('\nOR');
    console.log('Email: admin@astrologer.com');
    console.log('Password: admin123');

    // Test password verification
    const testPassword = await bcrypt.compare('admin123', targetAdmin.password);
    console.log('\n🧪 Password verification test:', testPassword ? '✅ PASS' : '❌ FAIL');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndFixAdmin();
