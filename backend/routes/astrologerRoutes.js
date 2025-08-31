const express = require('express');
const Astrologer = require('../models/Astrologer');
const authMiddleware = require('../middlewares/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// @desc    Get all available astrologers
// @route   GET /api/astrologers
// @access  Public
const getAvailableAstrologers = async (req, res) => {
  try {
    // Only return the single admin astrologer for calls
    // This is the only astrologer allowed to make/receive calls
    const adminAstrologer = {
      _id: 'admin-astrologer-001',
      name: 'Master Astrologer',
      expertise: ['vedic_astrology', 'numerology', 'tarot_reading', 'palmistry', 'career_guidance'],
      languages: ['hindi', 'english'],
      experience: 15,
      rating: 4.9,
      totalRatings: 1250,
      callRate: 50,
      chatRate: 30,
      isOnline: true,
      isActive: true,
      contact: '+917354927108',
      description: 'Experienced astrologer with 15+ years of expertise in Vedic astrology and spiritual guidance.'
    };
    
    const astrologers = [adminAstrologer];
    
    res.json({
      success: true,
      data: {
        astrologers,
        count: astrologers.length
      }
    });
  } catch (error) {
    console.error('Get astrologers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching astrologers'
    });
  }
};

// @desc    Get astrologer by ID
// @route   GET /api/astrologers/:id
// @access  Public
const getAstrologerById = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.params.id)
      .select('-email -contact -earnings');
    
    if (!astrologer) {
      return res.status(404).json({
        success: false,
        message: 'Astrologer not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        astrologer
      }
    });
  } catch (error) {
    console.error('Get astrologer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching astrologer'
    });
  }
};

// @desc    Get astrologer profile
// @route   GET /api/astrologer/profile
// @access  Private (Astrologer only)
const getAstrologerProfile = async (req, res) => {
  try {
    const astrologer = await Astrologer.findById(req.user.id)
      .select('-password');
    
    if (!astrologer) {
      return res.status(404).json({
        success: false,
        message: 'Astrologer not found'
      });
    }

    res.json({
      success: true,
      data: astrologer
    });
  } catch (error) {
    console.error('Get astrologer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
};

// @desc    Toggle astrologer availability
// @route   PATCH /api/astrologer/toggle-availability
// @access  Private (Astrologer only)
const toggleAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const astrologer = await Astrologer.findByIdAndUpdate(
      req.user.id,
      { 
        isAvailable: isAvailable,
        isOnline: isAvailable
      },
      { new: true }
    ).select('-password');

    if (!astrologer) {
      return res.status(404).json({
        success: false,
        message: 'Astrologer not found'
      });
    }

    res.json({
      success: true,
      message: `Availability updated to ${isAvailable ? 'Online' : 'Offline'}`,
      data: astrologer
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating availability'
    });
  }
};

router.get('/', getAvailableAstrologers);
router.get('/:id', getAstrologerById);
router.get('/profile', authMiddleware, getAstrologerProfile);
router.patch('/toggle-availability', authMiddleware, toggleAvailability);

module.exports = router;
