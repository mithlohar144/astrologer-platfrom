const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/UserNew');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    console.log('📝 Registration attempt:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Extract and validate required fields
    const { name, email, password, contact } = req.body;

    // Check for missing required fields
    if (!name || !email || !password || !contact) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!contact) missingFields.push('contact');
      
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate field types and formats
    if (typeof name !== 'string' || name.trim().length < 2) {
      console.log('❌ Invalid name format');
      return res.status(400).json({
        success: false,
        message: 'Name must be a string with at least 2 characters'
      });
    }

    if (typeof email !== 'string' || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      console.log('❌ Invalid password format');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    if (typeof contact !== 'string' || !/^[0-9]{10}$/.test(contact)) {
      console.log('❌ Invalid contact format');
      return res.status(400).json({
        success: false,
        message: 'Contact must be a valid 10-digit phone number'
      });
    }

    // Check for validation errors from express-validator
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      console.log('❌ Express validation errors:', validationErrors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array().map(err => err.msg)
      });
    }

    // Check if user already exists
    console.log('🔍 Checking if user exists with email:', email);
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      console.log('❌ User already exists with email:', email);
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please use a different email or login instead.'
      });
    }

    // Prevent admin registration through public route
    if (req.body.isAdmin === true || req.body.isAdmin === 'true') {
      console.log('❌ Attempted admin registration blocked');
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be created through public registration'
      });
    }

    // Prepare user data with proper sanitization
    const userData = {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password: String(password),
      contact: String(contact).trim(),
      isAdmin: false // Explicitly set to false for public registration
    };

    console.log('👤 Creating user with data:', {
      name: userData.name,
      email: userData.email,
      contact: userData.contact,
      passwordLength: userData.password.length
    });

    // Create user
    const user = await User.create(userData);
    console.log('✅ User created successfully with ID:', user._id);

    // Generate JWT token
    const token = generateToken(user._id);

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    console.log('🎉 Registration completed successfully for:', user.email);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contact: user.contact,
          walletBalance: user.walletBalance,
          firstCallUsed: user.firstCallUsed,
          firstChatUsed: user.firstChatUsed,
          isAdmin: user.isAdmin
        }
      }
    });

  } catch (error) {
    // Comprehensive error logging
    console.error('💥 Registration error occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.log('❌ Mongoose validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'User data validation failed',
        errors: validationErrors.map(err => `${err.field}: ${err.message}`)
      });
    }
    
    // Handle MongoDB duplicate key errors (E11000)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      console.log('❌ Duplicate key error for field:', duplicateField);
      return res.status(409).json({
        success: false,
        message: `${duplicateField === 'email' ? 'Email already registered' : 'Duplicate value detected'}. Please use different information.`
      });
    }
    
    // Handle MongoDB connection errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.log('❌ Database connection error');
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable. Please try again later.'
      });
    }
    
    // Handle bcrypt/hashing errors
    if (error.message && error.message.includes('bcrypt')) {
      console.log('❌ Password hashing error');
      return res.status(500).json({
        success: false,
        message: 'Password processing failed. Please try again.'
      });
    }
    
    // Generic server error (fallback)
    console.log('❌ Unhandled server error during registration');
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred during registration. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          errorName: error.name,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      })
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid ID or Password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid ID or Password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contact: user.contact,
          walletBalance: user.walletBalance,
          firstCallUsed: user.firstCallUsed,
          firstChatUsed: user.firstChatUsed,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contact: user.contact,
          walletBalance: user.walletBalance,
          firstCallUsed: user.firstCallUsed,
          firstChatUsed: user.firstChatUsed,
          isAdmin: user.isAdmin,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user data'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, contact } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    if (contact) user.contact = contact;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          contact: user.contact,
          walletBalance: user.walletBalance,
          firstCallUsed: user.firstCallUsed,
          firstChatUsed: user.firstChatUsed,
          isAdmin: user.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
