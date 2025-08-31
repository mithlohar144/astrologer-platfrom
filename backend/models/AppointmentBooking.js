const mongoose = require('mongoose');

const appointmentBookingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  sessionType: {
    type: String,
    required: [true, 'Session type is required'],
    enum: ['call', 'chat'],
    lowercase: true
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function(date) {
        return date >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Preferred date cannot be in the past'
    }
  },
  preferredTime: {
    type: String,
    required: [true, 'Preferred time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedAstrologer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Astrologer'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
appointmentBookingSchema.index({ email: 1 });
appointmentBookingSchema.index({ status: 1 });
appointmentBookingSchema.index({ preferredDate: 1 });
appointmentBookingSchema.index({ createdAt: -1 });

// Virtual for formatted date
appointmentBookingSchema.virtual('formattedDate').get(function() {
  return this.preferredDate.toLocaleDateString('en-IN');
});

// Virtual for formatted time
appointmentBookingSchema.virtual('formattedTime').get(function() {
  return this.preferredTime;
});

// Pre-save middleware to update updatedAt
appointmentBookingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get status badge color
appointmentBookingSchema.methods.getStatusColor = function() {
  const colors = {
    pending: 'warning',
    confirmed: 'info',
    completed: 'success',
    cancelled: 'danger'
  };
  return colors[this.status] || 'secondary';
};

module.exports = mongoose.model('AppointmentBooking', appointmentBookingSchema);
