const WithdrawRequest = require('../models/WithdrawRequest');
const Astrologer = require('../models/Astrologer');
const User = require('../models/User');
const WalletHistory = require('../models/WalletHistory');

// GET /api/admin/withdraw-requests
// List withdraw requests with optional filters
const listWithdrawRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.astrologerId) filter.astrologerId = req.query.astrologerId;

    const [items, total] = await Promise.all([
      WithdrawRequest.find(filter)
        .populate('astrologerId', 'name email')
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      WithdrawRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('listWithdrawRequests error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching withdraw requests' });
  }
};

// PATCH /api/admin/withdraw-requests/:id
// Approve or reject a withdraw request
const updateWithdrawStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const wr = await WithdrawRequest.findById(id);
    if (!wr) return res.status(404).json({ success: false, message: 'Withdraw request not found' });
    if (wr.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be updated' });
    }

    // If approving, perform deductions/entries
    if (status === 'approved') {
      // Determine requester type gracefully (fallback by presence of IDs)
      const requesterType = wr.requesterType || (wr.astrologerId ? 'astrologer' : 'user');
      const amount = Number(wr.amount);

      if (requesterType === 'user' || (!wr.astrologerId && wr.userId)) {
        const user = await User.findById(wr.userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found for this request' });
        if (user.walletBalance < amount) {
          return res.status(400).json({ success: false, message: 'Insufficient wallet balance at approval time' });
        }
        user.walletBalance -= amount;
        await user.save();

        // Log wallet history
        await WalletHistory.create({
          userId: user._id,
          type: 'debit',
          amount: amount,
          reason: 'withdrawal_payout',
          description: `Withdrawal approved (${wr.method.toUpperCase()})`,
          balanceAfter: user.walletBalance,
          status: 'completed'
        });
      } else {
        // astrologer payout from earnings
        const astro = await Astrologer.findById(wr.astrologerId);
        if (!astro) return res.status(404).json({ success: false, message: 'Astrologer not found for this request' });
        if (astro.earnings < amount) {
          return res.status(400).json({ success: false, message: 'Insufficient earnings at approval time' });
        }
        astro.earnings -= amount;
        await astro.save();
      }
    }

    wr.status = status;
    wr.notes = notes || wr.notes;
    wr.processedAt = new Date();
    wr.processedBy = req.user.id;
    await wr.save();

    const populated = await wr.populate('astrologerId', 'name email').populate('userId', 'name email');

    res.json({ success: true, message: `Request ${status} successfully`, data: populated });
  } catch (error) {
    console.error('updateWithdrawStatus error:', error);
    res.status(500).json({ success: false, message: 'Server error updating withdraw request' });
  }
};

module.exports = { listWithdrawRequests, updateWithdrawStatus };

// POST /api/wallet/withdraw
// Create a withdraw request (users and astrologers)
const createWithdrawRequest = async (req, res) => {
  try {
    const { amount, method, upiId, bankDetails } = req.body;

    // Basic validation
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    if (!['upi', 'bank'].includes(method)) {
      return res.status(400).json({ success: false, message: 'Invalid method. Use upi or bank' });
    }

    const amt = Number(amount);

    // Try to match astrologer by email to decide requester type
    const astrologer = await Astrologer.findOne({ email: req.user.email });

    // Build payload based on requester type
    const payload = {
      amount: amt,
      method
    };
    if (astrologer) {
      // Astrologer request: ensure sufficient earnings available
      if (amt > astrologer.earnings) {
        return res.status(400).json({ success: false, message: 'Insufficient earnings for withdrawal' });
      }
      payload.requesterType = 'astrologer';
      payload.astrologerId = astrologer._id;
    } else {
      // Normal user request: ensure sufficient wallet balance
      const user = await User.findById(req.user._id || req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (amt > (user.walletBalance || 0)) {
        return res.status(400).json({ success: false, message: 'Insufficient wallet balance for withdrawal' });
      }
      payload.requesterType = 'user';
      payload.userId = user._id;
    }

    if (method === 'upi') {
      if (!upiId) return res.status(400).json({ success: false, message: 'UPI ID is required for UPI withdrawal' });
      payload.upiId = upiId;
    } else if (method === 'bank') {
      const { bankName, accountNumber, ifsc, accountHolder } = bankDetails || {};
      if (!bankName || !accountNumber || !ifsc || !accountHolder) {
        return res.status(400).json({ success: false, message: 'Complete bank details are required for bank withdrawal' });
      }
      payload.bankDetails = { bankName, accountNumber, ifsc, accountHolder };
    }

    const request = await WithdrawRequest.create(payload);

    // Do not deduct now; will be handled on approval by admin
    const populated = await request
      .populate('astrologerId', 'name email')
      .populate('userId', 'name email');

    return res.status(201).json({ success: true, message: 'Withdraw request submitted', data: populated });
  } catch (error) {
    console.error('createWithdrawRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error creating withdraw request' });
  }
};

module.exports.createWithdrawRequest = createWithdrawRequest;
