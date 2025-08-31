const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
    // Removed select: false to avoid casting issues
  },
  contact: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit contact number']
  },
  phone: {
    type: String,
    required: false, // Or true, if you want to make it mandatory
    match: [/^\+?[1-9]\d{1,14}$/, 'Please fill a valid phone number']
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: [0, 'Wallet balance cannot be negative']
  },
  firstCallUsed: {
    type: Boolean,
    default: false
  },
  firstChatUsed: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Simplified pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Ensure password is a string and not empty
    if (!this.password || typeof this.password !== 'string') {
      return next(new Error('Password must be a valid string'));
    }

    // Hash password with bcrypt
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Get user without sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
