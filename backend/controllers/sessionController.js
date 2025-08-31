const { validationResult } = require('express-validator');
const User = require('../models/UserNew');
const Astrologer = require('../models/Astrologer');
const Session = require('../models/Session');
const { deductWalletBalance } = require('./walletController');

// @desc    Start a call session
// @route   POST /api/session/start-call
// @access  Private
const startCall = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    // Removed the incorrect check: else if (walletBalance === 0){
    
    const { astrologerId } = req.body;
    const userId = req.user.id;

    // Get user and astrologer details
    const user = await User.findById(userId);
    const astrologer = await Astrologer.findById(astrologerId);

    if (!user || !astrologer) {
      return res.status(404).json({
        success: false,
        message: 'User or Astrologer not found'
      });
    }

    if (!astrologer.isOnline || !astrologer.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Astrologer is not available for calls'
      });
    }

    // Check if this is a free call
    const isFreeCall = !user.firstCallUsed;
    const callRate = parseInt(process.env.CALL_RATE) || 15;

    // For paid calls, check wallet balance (minimum 2 minutes)
    if (!isFreeCall) {
      const minimumBalance = callRate * 2;
      if (user.walletBalance < minimumBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Minimum ₹${minimumBalance} required for calls.`,
          data: {
            currentBalance: user.walletBalance,
            minimumRequired: minimumBalance
          }
        });
      }
    }

    // Create session
    const session = await Session.create({
      userId,
      astrologerId,
      type: 'call',
      isFreeSession: isFreeCall,
      ratePerMinute: callRate,
      status: 'active'
    });

    // Mark first call as used if it's a free call
    if (isFreeCall) {
      user.firstCallUsed = true;
      await user.save();
    }

    res.json({
      success: true,
      message: isFreeCall ? 'Free call session started' : 'Call session started',
      data: {
        sessionId: session._id,
        type: 'call',
        isFreeSession: isFreeCall,
        ratePerMinute: callRate,
        freeMinutes: isFreeCall ? 5 : 0,
        astrologer: {
          id: astrologer._id,
          name: astrologer.name,
          expertise: astrologer.expertise,
          rating: astrologer.rating
        }
      }
    });
  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting call session'
    });
  }
};

// @desc    Start a chat session
// @route   POST /api/session/start-chat
// @access  Private
const startChat = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { astrologerId } = req.body;
    const userId = req.user.id;

    // Get user and astrologer details
    const user = await User.findById(userId);
    const astrologer = await Astrologer.findById(astrologerId);

    if (!user || !astrologer) {
      return res.status(404).json({
        success: false,
        message: 'User or Astrologer not found'
      });
    }

    if (!astrologer.isOnline || !astrologer.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Astrologer is not available for chat'
      });
    }

    // Check if this is a free chat
    const isFreeChat = !user.firstChatUsed;
    const chatRate = parseInt(process.env.CHAT_RATE) || 10;

    // For paid chats, check wallet balance (minimum 2 minutes)
    if (!isFreeChat) {
      const minimumBalance = chatRate * 2;
      if (user.walletBalance < minimumBalance) {
        return res.status(400).json({
          success: false,
          message: `Insufficient wallet balance. Minimum ₹${minimumBalance} required for chat.`,
          data: {
            currentBalance: user.walletBalance,
            minimumRequired: minimumBalance
          }
        });
      }
    }

    // Create session
    const session = await Session.create({
      userId,
      astrologerId,
      type: 'chat',
      isFreeSession: isFreeChat,
      ratePerMinute: chatRate,
      status: 'active'
    });

    // Mark first chat as used if it's a free chat
    if (isFreeChat) {
      user.firstChatUsed = true;
      await user.save();
    }

    res.json({
      success: true,
      message: isFreeChat ? 'Free chat session started' : 'Chat session started',
      data: {
        sessionId: session._id,
        type: 'chat',
        isFreeSession: isFreeChat,
        ratePerMinute: chatRate,
        freeMinutes: isFreeChat ? 5 : 0,
        astrologer: {
          id: astrologer._id,
          name: astrologer.name,
          expertise: astrologer.expertise,
          rating: astrologer.rating
        }
      }
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error starting chat session'
    });
  }
};

// @desc    End a session
// @route   POST /api/session/end/:sessionId
// @access  Private
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user owns this session
    if (session.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only end your own sessions.'
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    // Calculate session duration and amount
    session.endTime = new Date();
    session.calculateDuration();
    session.calculateAmount();
    session.status = 'completed';

    // Deduct wallet balance for paid minutes
    if (session.paidMinutes > 0) {
      try {
        const deductionResult = await deductWalletBalance(
          userId,
          session.totalAmount,
          session.type === 'call' ? 'call_charges' : 'chat_charges',
          `${session.type} session charges for ${session.paidMinutes} minutes`,
          session._id
        );
        
        session.walletDeducted = session.totalAmount;
      } catch (deductionError) {
        return res.status(400).json({
          success: false,
          message: deductionError.message
        });
      }
    }

    await session.save();

    // Update astrologer earnings
    const astrologer = await Astrologer.findById(session.astrologerId);
    if (astrologer) {
      astrologer.earnings += session.totalAmount;
      astrologer.totalSessions += 1;
      await astrologer.save();
    }

    res.json({
      success: true,
      message: 'Session ended successfully',
      data: {
        sessionId: session._id,
        duration: session.duration,
        freeMinutesUsed: session.freeMinutesUsed,
        paidMinutes: session.paidMinutes,
        totalAmount: session.totalAmount,
        walletDeducted: session.walletDeducted
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error ending session'
    });
  }
};

// @desc    Get active sessions for user
// @route   GET /api/session/active
// @access  Private
const getActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    const activeSessions = await Session.find({
      userId,
      status: 'active'
    }).populate('astrologerId', 'name expertise rating');

    res.json({
      success: true,
      data: {
        sessions: activeSessions
      }
    });
  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching active sessions'
    });
  }
};

// @desc    Get session history
// @route   GET /api/session/history
// @access  Private
const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const sessions = await Session.find(filter)
      .populate('astrologerId', 'name expertise rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSessions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching session history'
    });
  }
};

module.exports = {
  startCall,
  startChat,
  endSession,
  getActiveSessions,
  getSessionHistory
};
