const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/UserNew');
require('dotenv').config();

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrology-platform');
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    let admin = await User.findOne({ email: 'admin@stellarium.com' });
    
    if (admin) {
      console.log('📝 Admin user already exists, updating...');
      
      // Update existing admin
      admin.name = 'Admin User';
      admin.email = 'admin@stellarium.com';
      admin.contact = '7354927108'; // 10-digit number as required by model
      admin.password = 'admin123'; // Will be hashed by pre-save middleware
      admin.isAdmin = true;
      admin.walletBalance = 10000;
      admin.isVerified = true;
      
      await admin.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('🆕 Creating new admin user...');
      
      // Create new admin user
      admin = new User({
        name: 'Admin User',
        email: 'admin@stellarium.com',
        contact: '7354927108', // 10-digit number as required by model
        password: 'admin123', // Will be hashed by pre-save middleware
        isAdmin: true,
        walletBalance: 10000,
        isVerified: true
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    // Verify the admin user
    const verifyAdmin = await User.findOne({ email: 'admin@stellarium.com' });
    console.log('\n🔍 Admin User Details:');
    console.log('ID:', verifyAdmin._id);
    console.log('Name:', verifyAdmin.name);
    console.log('Email:', verifyAdmin.email);
    console.log('Contact:', verifyAdmin.contact);
    console.log('Is Admin:', verifyAdmin.isAdmin);
    console.log('Wallet Balance:', verifyAdmin.walletBalance);
    console.log('Is Verified:', verifyAdmin.isVerified);

    // Test password
    const passwordTest = await bcrypt.compare('admin123', verifyAdmin.password);
    console.log('Password Test:', passwordTest ? '✅ PASS' : '❌ FAIL');

    console.log('\n🎉 ADMIN LOGIN CREDENTIALS:');
    console.log('Email: admin@stellarium.com');
    console.log('Password: admin123');
    console.log('\nYou can now login to the admin panel!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupAdmin();
