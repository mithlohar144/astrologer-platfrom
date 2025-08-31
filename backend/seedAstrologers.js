const mongoose = require('mongoose');
const Astrologer = require('./models/Astrologer');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/astrologer-platform')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Sample astrologer data
const astrologers = [
  {
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@astro.com',
    contact: '9876543210',
    expertise: ['vedic_astrology', 'career_guidance', 'relationship_counseling'],
    languages: ['hindi', 'english'],
    experience: 15,
    rating: 4.8,
    totalRatings: 245,
    callRate: 15,
    chatRate: 10,
    isOnline: true,
    isAvailable: true,
    bio: 'Expert Vedic astrologer with 15+ years of experience in career and relationship guidance.',
    specialization: 'Vedic Astrology and Career Counseling',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Pandit Suresh Kumar',
    email: 'suresh.kumar@astro.com',
    contact: '9876543211',
    expertise: ['numerology', 'gemstone_consultation', 'vastu_shastra'],
    languages: ['hindi', 'english', 'bengali'],
    experience: 12,
    rating: 4.6,
    totalRatings: 189,
    callRate: 12,
    chatRate: 8,
    isOnline: true,
    isAvailable: true,
    bio: 'Specialist in numerology and gemstone consultation with deep knowledge of Vastu Shastra.',
    specialization: 'Numerology and Gemstone Consultation',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Acharya Priya Devi',
    email: 'priya.devi@astro.com',
    contact: '9876543212',
    expertise: ['tarot_reading', 'palmistry', 'relationship_counseling'],
    languages: ['hindi', 'english', 'tamil'],
    experience: 8,
    rating: 4.7,
    totalRatings: 156,
    callRate: 18,
    chatRate: 12,
    isOnline: true,
    isAvailable: true,
    bio: 'Expert tarot reader and palmist specializing in love and relationship guidance.',
    specialization: 'Tarot Reading and Palmistry',
    isVerified: true,
    isActive: true
  },
  {
    name: 'Guru Vikram Singh',
    email: 'vikram.singh@astro.com',
    contact: '9876543213',
    expertise: ['vedic_astrology', 'health_astrology', 'financial_astrology'],
    languages: ['hindi', 'english', 'punjabi'],
    experience: 20,
    rating: 4.9,
    totalRatings: 312,
    callRate: 20,
    chatRate: 15,
    isOnline: true,
    isAvailable: true,
    bio: 'Senior Vedic astrologer with expertise in health and financial astrology.',
    specialization: 'Health and Financial Astrology',
    isVerified: true,
    isActive: true
  }
];

async function seedAstrologers() {
  try {
    // Clear existing astrologers
    await Astrologer.deleteMany({});
    console.log('🗑️  Cleared existing astrologers');

    // Insert new astrologers
    const createdAstrologers = await Astrologer.insertMany(astrologers);
    console.log(`✅ Created ${createdAstrologers.length} astrologers:`);
    
    createdAstrologers.forEach(astrologer => {
      console.log(`   - ${astrologer.name} (ID: ${astrologer._id})`);
    });

    console.log('\n🎉 Astrologer seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding astrologers:', error);
    process.exit(1);
  }
}

seedAstrologers();
