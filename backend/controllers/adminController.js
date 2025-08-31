const User = require('../models/UserNew');
const Astrologer = require('../models/Astrologer');
const Appointment = require('../models/Appointment');
const Session = require('../models/Session');
const WalletHistory = require('../models/WalletHistory');

// @desc    Get admin dashboard summary
// @route   GET /api/admin/summary
// @access  Private (Admin)
const getDashboardSummary = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get total counts
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalAstrologers = await Astrologer.countDocuments({ isActive: true });
    const totalAppointments = await Appointment.countDocuments();
    const totalSessions = await Session.countDocuments();

    // Get period-specific data
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate },
      isActive: true
    });

    const periodAppointments = await Appointment.countDocuments({
      createdAt: { $gte: startDate }
    });

    const periodSessions = await Session.countDocuments({
      createdAt: { $gte: startDate }
    });

    // Calculate revenue
    const revenueData = await WalletHistory.aggregate([
      {
        $match: {
          type: 'credit',
          reason: { $in: ['wallet_topup', 'razorpay_payment'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const totalTransactions = revenueData.length > 0 ? revenueData[0].totalTransactions : 0;

    // Get session charges (platform earnings)
    const sessionCharges = await WalletHistory.aggregate([
      {
        $match: {
          type: 'debit',
          reason: { $in: ['call_charges', 'chat_charges'] },
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$amount' }
        }
      }
    ]);

    const platformEarnings = sessionCharges.length > 0 ? sessionCharges[0].totalEarnings : 0;

    // Get active users (users who had sessions in the period)
    const activeUsers = await Session.distinct('userId', {
      createdAt: { $gte: startDate }
    });

    // Get top astrologers by earnings
    const topAstrologers = await Astrologer.find({ isActive: true })
      .sort({ earnings: -1 })
      .limit(5)
      .select('name earnings totalSessions rating');

    // Get appointment status distribution
    const appointmentStats = await Appointment.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get session type distribution
    const sessionStats = await Session.aggregate([
      {
        $match: { createdAt: { $gte: startDate } }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        summary: {
          totalUsers,
          totalAstrologers,
          totalAppointments,
          totalSessions,
          newUsers,
          periodAppointments,
          periodSessions,
          activeUsers: activeUsers.length,
          totalRevenue,
          totalTransactions,
          platformEarnings
        },
        topAstrologers,
        appointmentStats,
        sessionStats
      }
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard summary'
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalSessions = await Session.countDocuments({ userId: user._id });
        const totalSpent = await WalletHistory.aggregate([
          {
            $match: {
              userId: user._id,
              type: 'debit',
              reason: { $in: ['call_charges', 'chat_charges'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        return {
          ...user.toObject(),
          totalSessions,
          totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
};

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private (Admin)
const getAllAppointments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.mode) {
      filter.mode = req.query.mode;
    }
    if (req.query.astrologerId) {
      filter.astrologerId = req.query.astrologerId;
    }

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email contact')
      .populate('astrologerId', 'name expertise rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAppointments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointments'
    });
  }
};

// @desc    Get all astrologers
// @route   GET /api/admin/astrologers
// @access  Private (Admin)
const getAllAstrologers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.isOnline !== undefined) {
      filter.isOnline = req.query.isOnline === 'true';
    }

    const astrologers = await Astrologer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Astrologer.countDocuments(filter);

    res.json({
      success: true,
      data: {
        astrologers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalAstrologers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all astrologers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching astrologers'
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling user status'
    });
  }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics/revenue
// @access  Private (Admin)
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    
    let groupBy, dateFormat;
    switch (period) {
      case 'daily':
        groupBy = { $dayOfYear: '$createdAt' };
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = { $week: '$createdAt' };
        dateFormat = '%Y-W%U';
        break;
      case 'yearly':
        groupBy = { $year: '$createdAt' };
        dateFormat = '%Y';
        break;
      case 'monthly':
      default:
        groupBy = { $month: '$createdAt' };
        dateFormat = '%Y-%m';
        break;
    }

    const revenueData = await WalletHistory.aggregate([
      {
        $match: {
          type: 'credit',
          reason: { $in: ['wallet_topup', 'razorpay_payment'] },
          createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(parseInt(year) + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 },
          date: { $first: { $dateToString: { format: dateFormat, date: '$createdAt' } } }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        year,
        revenueData
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching revenue analytics'
    });
  }
};

// @desc    Update admin credentials
// @route   PUT /api/admin/update
// @access  Private (Admin)
const updateAdminCredentials = async (req, res) => {
  try {
    const { name, email, password, currentPassword } = req.body;
    
    // Get current admin user
    const admin = await User.findById(req.user.id).select('+password');
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied'
      });
    }

    // Verify current password if provided
    if (currentPassword) {
      const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Update fields if provided
    if (name) admin.name = name.trim();
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: admin._id }
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
      admin.email = email.toLowerCase().trim();
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      admin.password = password;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Admin credentials updated successfully',
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          isAdmin: admin.isAdmin
        }
      }
    });
  } catch (error) {
    console.error('Update admin credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating admin credentials'
    });
  }
};

module.exports = {
  getDashboardSummary,
  getAllUsers,
  getAllAppointments,
  getAllAstrologers,
  toggleUserStatus,
  getRevenueAnalytics,
  updateAdminCredentials
};
