const mongoose = require('mongoose');

const astrologerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  expertise: [{
    type: String,
    enum: [
      'vedic_astrology',
      'numerology',
      'tarot_reading',
      'palmistry',
      'vastu_shastra',
      'gemstone_consultation',
      'career_guidance',
      'relationship_counseling',
      'health_astrology',
      'financial_astrology'
    ]
  }],
  languages: [{
    type: String,
    enum: ['hindi', 'english', 'bengali', 'tamil', 'telugu', 'marathi', 'gujarati', 'punjabi', 'kannada', 'malayalam']
  }],
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  callRate: {
    type: Number,
    required: [true, 'Call rate is required'],
    min: [1, 'Call rate must be at least ₹1 per minute']
  },
  chatRate: {
    type: Number,
    required: [true, 'Chat rate is required'],
    min: [1, 'Chat rate must be at least ₹1 per minute']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    },
    endTime: {
      type: String,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM']
    }
  }],
  earnings: {
    type: Number,
    default: 0,
    min: [0, 'Earnings cannot be negative']
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  phone: {
    type: String,
    required: false, 
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  specialization: {
    type: String,
    maxlength: [200, 'Specialization cannot exceed 200 characters']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
astrologerSchema.index({ isOnline: 1, isAvailable: 1 });
astrologerSchema.index({ rating: -1 });
astrologerSchema.index({ expertise: 1 });
astrologerSchema.index({ languages: 1 });

// Virtual for average rating calculation
astrologerSchema.virtual('averageRating').get(function() {
  return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Method to update rating
astrologerSchema.methods.updateRating = function(newRating) {
  this.rating = ((this.rating * this.totalRatings) + newRating) / (this.totalRatings + 1);
  this.totalRatings += 1;
  return this.save();
};

module.exports = mongoose.model('Astrologer', astrologerSchema);
