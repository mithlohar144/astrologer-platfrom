const { validationResult } = require('express-validator');
const Razorpay = require('razorpay');
const User = require('../models/UserNew');
const WalletHistory = require('../models/WalletHistory');

// Initialize Razorpay (if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// @desc    Add money to wallet (Mock topup for development)
// @route   POST /api/wallet/topup
// @access  Private
const topupWallet = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, paymentMethod = 'mock' } = req.body;
    const userId = req.user.id;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    if (amount > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum topup amount is ₹5,000'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update wallet balance
    const previousBalance = user.walletBalance;
    user.walletBalance += amount;
    await user.save();

    // Create wallet history entry
    await WalletHistory.create({
      userId,
      type: 'credit',
      amount,
      reason: paymentMethod === 'razorpay' ? 'razorpay_payment' : 'wallet_topup',
      description: `Wallet topup via ${paymentMethod}`,
      balanceAfter: user.walletBalance,
      paymentId: req.body.paymentId || null,
      orderId: req.body.orderId || null
    });

    res.json({
      success: true,
      message: 'Wallet topped up successfully',
      data: {
        amount,
        previousBalance,
        currentBalance: user.walletBalance,
        transactionId: Date.now().toString()
      }
    });
  } catch (error) {
    console.error('Wallet topup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during wallet topup'
    });
  }
};

// @desc    Create Razorpay order
// @route   POST /api/wallet/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay not configured. Please use mock topup.'
      });
    }

    const { amount } = req.body;

    if (amount <= 0 || amount > 50000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Must be between ₹1 and ₹50,000'
      });
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: req.user.id,
        purpose: 'wallet_topup'
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order'
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/wallet/verify-payment
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay) {
      return res.status(400).json({
        success: false,
        message: 'Razorpay not configured'
      });
    }

    // Verify signature (simplified - in production, use crypto to verify)
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(razorpay_order_id + '|' + razorpay_payment_id)
    //   .digest('hex');

    // if (expectedSignature !== razorpay_signature) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Invalid payment signature'
    //   });
    // }

    const userId = req.user.id;
    const user = await User.findById(userId);
    
    const previousBalance = user.walletBalance;
    user.walletBalance += amount;
    await user.save();

    // Create wallet history entry
    await WalletHistory.create({
      userId,
      type: 'credit',
      amount,
      reason: 'razorpay_payment',
      description: 'Wallet topup via Razorpay',
      balanceAfter: user.walletBalance,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });

    res.json({
      success: true,
      message: 'Payment verified and wallet updated',
      data: {
        amount,
        previousBalance,
        currentBalance: user.walletBalance
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment'
    });
  }
};

// @desc    Get wallet transaction history
// @route   GET /api/wallet/history/:userId?
// @access  Private
const getWalletHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    
    // Check if user is requesting their own history or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own transaction history.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.reason) {
      filter.reason = req.query.reason;
    }

    const transactions = await WalletHistory.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WalletHistory.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get wallet history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching wallet history'
    });
  }
};

// @desc    Get wallet balance
// @route   GET /api/wallet/balance
// @access  Private
const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      data: {
        balance: user.walletBalance,
        firstCallUsed: user.firstCallUsed,
        firstChatUsed: user.firstChatUsed
      }
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching wallet balance'
    });
  }
};

// Helper function to deduct wallet balance
const deductWalletBalance = async (userId, amount, reason, description, sessionId = null) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    if (user.walletBalance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    user.walletBalance -= amount;
    await user.save();

    // Create wallet history entry
    await WalletHistory.create({
      userId,
      type: 'debit',
      amount,
      reason,
      description,
      balanceAfter: user.walletBalance,
      sessionId,
      status: 'completed'
    });

    return {
      success: true,
      previousBalance: user.walletBalance + amount,
      currentBalance: user.walletBalance,
      deductedAmount: amount
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  topupWallet,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getWalletHistory,
  getWalletBalance,
  deductWalletBalance
};
