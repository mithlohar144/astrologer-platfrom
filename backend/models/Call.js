const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  userPhoneNumber: {
    type: String,
    required: [true, 'User phone number is required'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  targetPhoneNumber: {
    type: String,
    required: [true, 'Target phone number is required'],
    default: '+917415794586'
  },
  callSid: {
    type: String,
    required: [true, 'Twilio Call SID is required']
  },
  conferenceSid: {
    type: String // For conference calls
  },
  userCallSid: {
    type: String // SID for user's call leg
  },
  targetCallSid: {
    type: String // SID for target's call leg
  },
  status: {
    type: String,
    enum: ['initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer'],
    default: 'initiated'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  answerTime: {
    type: Date // When call was actually answered
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // Duration in seconds
    default: 0
  },
  billingDuration: {
    type: Number, // Actual billable duration in seconds
    default: 0
  },
  costPerSecond: {
    type: Number,
    default: 0.25 // ₹0.25 per second
  },
  totalCost: {
    type: Number,
    default: 0
  },
  walletBalanceBefore: {
    type: Number,
    required: [true, 'Wallet balance before call is required']
  },
  walletBalanceAfter: {
    type: Number
  },
  billingStarted: {
    type: Boolean,
    default: false
  },
  lastBillingUpdate: {
    type: Date
  },
  endReason: {
    type: String,
    enum: ['user_hangup', 'target_hangup', 'insufficient_balance', 'system_error', 'timeout']
  },
  errorMessage: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
callSchema.index({ userId: 1, createdAt: -1 });
callSchema.index({ callSid: 1 });
callSchema.index({ status: 1 });
callSchema.index({ isActive: 1 });

// Calculate total cost based on billing duration
callSchema.methods.calculateCost = function() {
  this.totalCost = this.billingDuration * this.costPerSecond;
  return this.totalCost;
};

// Update billing duration and cost
callSchema.methods.updateBilling = function() {
  if (this.answerTime && this.billingStarted) {
    const now = new Date();
    const endTime = this.endTime || now;
    this.billingDuration = Math.ceil((endTime - this.answerTime) / 1000);
    this.calculateCost();
    this.lastBillingUpdate = now;
  }
};

module.exports = mongoose.models.Call || mongoose.model('Call', callSchema);
