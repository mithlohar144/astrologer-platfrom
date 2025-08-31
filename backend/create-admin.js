const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/UserNew');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrology-platform');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: 'admin@stellarium.com' },
        { mobile: '+917354927108' },
        { isAdmin: true }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Mobile:', existingAdmin.mobile);
      console.log('Name:', existingAdmin.name);
      console.log('Is Admin:', existingAdmin.isAdmin);
      console.log('\nYou can login with:');
      console.log('Email: admin@stellarium.com');
      console.log('Password: admin123');
      console.log('OR');
      console.log('Mobile: +917354927108');
      console.log('Password: admin123');
    } else {
      // Create admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@stellarium.com',
        mobile: '+917354927108',
        password: 'admin123', // This will be hashed by the pre-save middleware
        isAdmin: true,
        walletBalance: 10000, // Give admin some wallet balance
        isVerified: true
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('\nAdmin Login Credentials:');
      console.log('Email: admin@stellarium.com');
      console.log('Mobile: +917354927108');
      console.log('Password: admin123');
      console.log('\nYou can now login and access the admin dashboard!');
    }

    // Also check for any other users
    const totalUsers = await User.countDocuments();
    console.log(`\nTotal users in database: ${totalUsers}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdminUser();
