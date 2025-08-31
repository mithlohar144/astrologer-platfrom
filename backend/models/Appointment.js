const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  datetime: {
    type: Date,
    required: [true, 'Appointment date and time is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: [15, 'Minimum appointment duration is 15 minutes'],
    max: [120, 'Maximum appointment duration is 120 minutes']
  },
  mode: {
    type: String,
    enum: ['call', 'chat'],
    required: [true, 'Appointment mode is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'no_show'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  userNotes: {
    type: String,
    maxlength: [300, 'User notes cannot exceed 300 characters']
  },
  astrologerNotes: {
    type: String,
    maxlength: [500, 'Astrologer notes cannot exceed 500 characters']
  },
  sessionStartTime: {
    type: Date
  },
  sessionEndTime: {
    type: Date
  },
  actualDuration: {
    type: Number // in minutes
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  feedback: {
    type: String,
    maxlength: [500, 'Feedback cannot exceed 500 characters']
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'astrologer', 'admin']
  },
  cancellationReason: {
    type: String,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ astrologerId: 1, datetime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ datetime: 1 });

// Virtual for checking if appointment is upcoming
appointmentSchema.virtual('isUpcoming').get(function() {
  return this.datetime > new Date() && this.status === 'accepted';
});

module.exports = mongoose.model('Appointment', appointmentSchema);
