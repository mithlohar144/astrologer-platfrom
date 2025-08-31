const mongoose = require('mongoose');

const walletHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  reason: {
    type: String,
    required: [true, 'Transaction reason is required'],
    enum: [
      'wallet_topup',
      'razorpay_payment',
      'call_charges',
      'chat_charges',
      'refund',
      'admin_adjustment',
      'bonus_credit',
      'withdrawal_payout'
    ]
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  paymentId: {
    type: String // For Razorpay payment ID
  },
  orderId: {
    type: String // For Razorpay order ID
  },
  balanceAfter: {
    type: Number,
    required: [true, 'Balance after transaction is required']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
walletHistorySchema.index({ userId: 1, createdAt: -1 });
walletHistorySchema.index({ type: 1 });
walletHistorySchema.index({ reason: 1 });

module.exports = mongoose.model('WalletHistory', walletHistorySchema);
