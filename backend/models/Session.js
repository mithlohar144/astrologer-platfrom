const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  astrologerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Astrologer',
    required: [true, 'Astrologer ID is required']
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  type: {
    type: String,
    enum: ['call', 'chat'],
    required: [true, 'Session type is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  isFreeSession: {
    type: Boolean,
    default: false
  },
  ratePerMinute: {
    type: Number,
    required: [true, 'Rate per minute is required'],
    min: [0, 'Rate cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
  },
  freeMinutesUsed: {
    type: Number,
    default: 0,
    min: [0, 'Free minutes cannot be negative']
  },
  paidMinutes: {
    type: Number,
    default: 0,
    min: [0, 'Paid minutes cannot be negative']
  },
  walletDeducted: {
    type: Number,
    default: 0,
    min: [0, 'Wallet deduction cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ astrologerId: 1, createdAt: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ type: 1 });

// Method to calculate session duration
sessionSchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    this.duration = Math.ceil((this.endTime - this.startTime) / (1000 * 60)); // in minutes
  }
  return this.duration;
};

// Method to calculate total amount
sessionSchema.methods.calculateAmount = function() {
  const totalMinutes = this.duration || 0;
  const freeMinutes = Math.min(totalMinutes, this.isFreeSession ? 5 : 0);
  const paidMinutes = Math.max(0, totalMinutes - freeMinutes);
  
  this.freeMinutesUsed = freeMinutes;
  this.paidMinutes = paidMinutes;
  this.totalAmount = paidMinutes * this.ratePerMinute;
  
  return this.totalAmount;
};

module.exports = mongoose.model('Session', sessionSchema);
