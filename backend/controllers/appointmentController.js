const { validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/UserNew');
const Astrologer = require('../models/Astrologer');

// @desc    Book an appointment
// @route   POST /api/appointment/book
// @access  Private
const bookAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { astrologerId, datetime, duration, mode, notes } = req.body;
    const userId = req.user.id;

    // Validate astrologer exists
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      return res.status(404).json({
        success: false,
        message: 'Astrologer not found'
      });
    }

    if (!astrologer.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Astrologer is not available for appointments'
      });
    }

    // Check if appointment time is in the future
    const appointmentDate = new Date(datetime);
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      astrologerId,
      datetime: {
        $gte: new Date(appointmentDate.getTime() - (duration * 60000)),
        $lte: new Date(appointmentDate.getTime() + (duration * 60000))
      },
      status: { $in: ['pending', 'accepted'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Astrologer is not available at this time slot'
      });
    }

    // Calculate total amount
    const rate = mode === 'call' ? astrologer.callRate : astrologer.chatRate;
    const totalAmount = rate * duration;

    // Create appointment
    const appointment = await Appointment.create({
      userId,
      astrologerId,
      datetime: appointmentDate,
      duration,
      mode,
      totalAmount,
      userNotes: notes
    });

    // Populate astrologer details
    await appointment.populate('astrologerId', 'name expertise rating languages');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error booking appointment'
    });
  }
};

// @desc    Get user's appointments
// @route   GET /api/appointment/user/:id?
// @access  Private
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    
    // Check if user is requesting their own appointments or is admin
    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own appointments.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.mode) {
      filter.mode = req.query.mode;
    }

    const appointments = await Appointment.find(filter)
      .populate('astrologerId', 'name expertise rating languages profileImage')
      .sort({ datetime: -1 })
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
    console.error('Get user appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointments'
    });
  }
};

// @desc    Get astrologer's appointments
// @route   GET /api/appointment/astrologer/:id
// @access  Private (Admin or Astrologer)
const getAstrologerAppointments = async (req, res) => {
  try {
    const astrologerId = req.params.id;
    
    // For now, only admin can access this (in future, add astrologer authentication)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { astrologerId };
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.mode) {
      filter.mode = req.query.mode;
    }

    const appointments = await Appointment.find(filter)
      .populate('userId', 'name email contact')
      .populate('astrologerId', 'name expertise rating')
      .sort({ datetime: -1 })
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
    console.error('Get astrologer appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching astrologer appointments'
    });
  }
};

// @desc    Update appointment status
// @route   PATCH /api/appointment/update-status
// @access  Private (Admin or Astrologer)
const updateAppointmentStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { appointmentId, status, notes } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // For now, only admin can update status (in future, add astrologer check)
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Validate status transition
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Update appointment
    appointment.status = status;
    if (notes) {
      appointment.astrologerNotes = notes;
    }

    // Set session times for completed appointments
    if (status === 'completed' && !appointment.sessionEndTime) {
      appointment.sessionEndTime = new Date();
      if (!appointment.sessionStartTime) {
        appointment.sessionStartTime = appointment.datetime;
      }
      appointment.actualDuration = Math.ceil(
        (appointment.sessionEndTime - appointment.sessionStartTime) / (1000 * 60)
      );
    }

    await appointment.save();

    res.json({
      success: true,
      message: `Appointment ${status} successfully`,
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating appointment status'
    });
  }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointment/cancel/:id
// @access  Private
const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user owns this appointment or is admin
    if (appointment.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only cancel your own appointments.'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this appointment'
      });
    }

    // Check cancellation time (allow cancellation up to 1 hour before appointment)
    const appointmentTime = new Date(appointment.datetime);
    const currentTime = new Date();
    const timeDifference = appointmentTime - currentTime;
    const oneHour = 60 * 60 * 1000;

    if (timeDifference < oneHour && timeDifference > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointment less than 1 hour before scheduled time'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user.isAdmin ? 'admin' : 'user';
    appointment.cancellationReason = req.body.reason || 'Cancelled by user';
    
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointment
      }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling appointment'
    });
  }
};

// @desc    Rate appointment
// @route   POST /api/appointment/rate/:id
// @access  Private
const rateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { rating, feedback } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user owns this appointment
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only rate your own appointments.'
      });
    }

    // Check if appointment is completed
    if (appointment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed appointments'
      });
    }

    // Check if already rated
    if (appointment.rating) {
      return res.status(400).json({
        success: false,
        message: 'Appointment already rated'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Update appointment
    appointment.rating = rating;
    appointment.feedback = feedback;
    await appointment.save();

    // Update astrologer rating
    const astrologer = await Astrologer.findById(appointment.astrologerId);
    if (astrologer) {
      await astrologer.updateRating(rating);
    }

    res.json({
      success: true,
      message: 'Appointment rated successfully',
      data: {
        rating,
        feedback
      }
    });
  } catch (error) {
    console.error('Rate appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error rating appointment'
    });
  }
};

// @desc    Get pending appointments for admin
// @route   GET /api/appointment/pending
// @access  Private (Admin only)
const getPendingAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      status: 'pending'
    })
    .populate('userId', 'name email contact')
    .populate('astrologerId', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      success: true,
      message: 'Pending appointments retrieved successfully',
      data: appointments
    });
  } catch (error) {
    console.error('Get pending appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending appointments'
    });
  }
};

module.exports = {
  bookAppointment,
  getUserAppointments,
  getPendingAppointments,
  getAstrologerAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  rateAppointment
};
