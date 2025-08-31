const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/UserNew');
const Astrologer = require('../models/Astrologer');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrologer-platform');
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Astrologer.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@astrologer.com',
      password: adminPassword,
      contact: '9999999999',
      isAdmin: true,
      walletBalance: 0
    });

    // Create sample users
    const userPassword = await bcrypt.hash('user123', 12);
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        contact: '9876543210',
        walletBalance: 500
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPassword,
        contact: '9876543211',
        walletBalance: 1000,
        firstCallUsed: true
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: userPassword,
        contact: '9876543212',
        walletBalance: 250,
        firstChatUsed: true
      }
    ]);

    // Create sample astrologers
    const astrologers = await Astrologer.create([
      {
        name: 'Dr. Kanhaiya Sharma',
        email: 'kanhaiya@astrologer.com',
        contact: '7354927108',
        expertise: ['vedic_astrology', 'career_guidance', 'relationship_counseling'],
        languages: ['hindi', 'english'],
        experience: 15,
        rating: 4.8,
        totalRatings: 150,
        callRate: 25,
        chatRate: 18,
        isOnline: true,
        isAvailable: true,
        availability: [
          { day: 'monday', startTime: '09:00', endTime: '18:00' },
          { day: 'tuesday', startTime: '09:00', endTime: '18:00' },
          { day: 'wednesday', startTime: '09:00', endTime: '18:00' },
          { day: 'thursday', startTime: '09:00', endTime: '18:00' },
          { day: 'friday', startTime: '09:00', endTime: '18:00' },
          { day: 'saturday', startTime: '10:00', endTime: '16:00' }
        ],
        earnings: 25000,
        totalSessions: 200,
        bio: 'Experienced Vedic astrologer with 15+ years of practice. Specializes in career guidance and relationship counseling.',
        specialization: 'Vedic Astrology & Life Guidance',
        isVerified: true,
        isActive: true
      },
      {
        name: 'Pandit Raj Kumar',
        email: 'raj@astrologer.com',
        contact: '9876543213',
        expertise: ['numerology', 'palmistry', 'gemstone_consultation'],
        languages: ['hindi', 'english', 'punjabi'],
        experience: 12,
        rating: 4.6,
        totalRatings: 120,
        callRate: 20,
        chatRate: 15,
        isOnline: true,
        isAvailable: true,
        availability: [
          { day: 'monday', startTime: '10:00', endTime: '19:00' },
          { day: 'tuesday', startTime: '10:00', endTime: '19:00' },
          { day: 'wednesday', startTime: '10:00', endTime: '19:00' },
          { day: 'thursday', startTime: '10:00', endTime: '19:00' },
          { day: 'friday', startTime: '10:00', endTime: '19:00' },
          { day: 'sunday', startTime: '11:00', endTime: '17:00' }
        ],
        earnings: 18000,
        totalSessions: 150,
        bio: 'Expert in numerology and palmistry with deep knowledge of gemstone consultation.',
        specialization: 'Numerology & Palmistry',
        isVerified: true,
        isActive: true
      },
      {
        name: 'Guru Priya Devi',
        email: 'priya@astrologer.com',
        contact: '9876543214',
        expertise: ['tarot_reading', 'relationship_counseling', 'health_astrology'],
        languages: ['hindi', 'english', 'bengali'],
        experience: 8,
        rating: 4.7,
        totalRatings: 95,
        callRate: 22,
        chatRate: 16,
        isOnline: false,
        isAvailable: true,
        availability: [
          { day: 'tuesday', startTime: '14:00', endTime: '20:00' },
          { day: 'wednesday', startTime: '14:00', endTime: '20:00' },
          { day: 'thursday', startTime: '14:00', endTime: '20:00' },
          { day: 'friday', startTime: '14:00', endTime: '20:00' },
          { day: 'saturday', startTime: '09:00', endTime: '15:00' },
          { day: 'sunday', startTime: '09:00', endTime: '15:00' }
        ],
        earnings: 12000,
        totalSessions: 100,
        bio: 'Intuitive tarot reader and relationship counselor with focus on health astrology.',
        specialization: 'Tarot Reading & Healing',
        isVerified: true,
        isActive: true
      },
      {
        name: 'Acharya Vikram Singh',
        email: 'vikram@astrologer.com',
        contact: '9876543215',
        expertise: ['vastu_shastra', 'financial_astrology', 'career_guidance'],
        languages: ['hindi', 'english', 'marathi'],
        experience: 20,
        rating: 4.9,
        totalRatings: 200,
        callRate: 30,
        chatRate: 22,
        isOnline: true,
        isAvailable: true,
        availability: [
          { day: 'monday', startTime: '08:00', endTime: '17:00' },
          { day: 'tuesday', startTime: '08:00', endTime: '17:00' },
          { day: 'wednesday', startTime: '08:00', endTime: '17:00' },
          { day: 'thursday', startTime: '08:00', endTime: '17:00' },
          { day: 'friday', startTime: '08:00', endTime: '17:00' }
        ],
        earnings: 35000,
        totalSessions: 250,
        bio: 'Senior astrologer with expertise in Vastu Shastra and financial astrology. 20+ years of experience.',
        specialization: 'Vastu & Financial Astrology',
        isVerified: true,
        isActive: true
      }
    ]);

    console.log('Sample data seeded successfully!');
    console.log(`Created ${users.length} users and ${astrologers.length} astrologers`);
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@astrologer.com / admin123');
    console.log('User: john@example.com / user123');
    console.log('User: jane@example.com / user123');
    console.log('User: mike@example.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run seeder
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
