const { validationResult } = require('express-validator');
const AppointmentBooking = require('../models/AppointmentBooking');

// @desc    Create new appointment booking
// @route   POST /api/appointments
// @access  Public
const createAppointment = async (req, res) => {
  try {
    console.log('📅 New appointment booking request:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Extract and validate required fields
    const { name, email, phone, sessionType, preferredDate, preferredTime, message } = req.body;

    // Check for missing required fields
    if (!name || !email || !phone || !sessionType || !preferredDate || !preferredTime) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');
      if (!sessionType) missingFields.push('sessionType');
      if (!preferredDate) missingFields.push('preferredDate');
      if (!preferredTime) missingFields.push('preferredTime');
      
      console.log('❌ Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validate field types and formats
    if (typeof name !== 'string' || name.trim().length < 2) {
      console.log('❌ Invalid name format');
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    if (typeof email !== 'string' || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      console.log('❌ Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (typeof phone !== 'string' || !/^[0-9]{10}$/.test(phone)) {
      console.log('❌ Invalid phone format');
      return res.status(400).json({
        success: false,
        message: 'Phone must be a valid 10-digit number'
      });
    }

    if (!['call', 'chat'].includes(sessionType.toLowerCase())) {
      console.log('❌ Invalid session type');
      return res.status(400).json({
        success: false,
        message: 'Session type must be either "call" or "chat"'
      });
    }

    // Validate date is not in the past
    const appointmentDate = new Date(preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      console.log('❌ Date in the past');
      return res.status(400).json({
        success: false,
        message: 'Preferred date cannot be in the past'
      });
    }

    // Validate time format
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(preferredTime)) {
      console.log('❌ Invalid time format');
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid time format (HH:MM)'
      });
    }

    // Check for validation errors from express-validator
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      console.log('❌ Express validation errors:', validationErrors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors.array().map(err => err.msg)
      });
    }

    // Prepare appointment data
    const appointmentData = {
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      phone: String(phone).trim(),
      sessionType: String(sessionType).toLowerCase(),
      preferredDate: new Date(preferredDate),
      preferredTime: String(preferredTime),
      message: message ? String(message).trim() : ''
    };

    console.log('📝 Creating appointment with data:', {
      name: appointmentData.name,
      email: appointmentData.email,
      phone: appointmentData.phone,
      sessionType: appointmentData.sessionType,
      preferredDate: appointmentData.preferredDate.toISOString(),
      preferredTime: appointmentData.preferredTime
    });

    // Create appointment
    const appointment = await AppointmentBooking.create(appointmentData);
    console.log('✅ Appointment created successfully with ID:', appointment._id);

    alert('🎉 Appointment booking completed successfully for:', appointment.email);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully! We will contact you soon.',
      data: {
        appointmentId: appointment._id,
        name: appointment.name,
        email: appointment.email,
        sessionType: appointment.sessionType,
        preferredDate: appointment.formattedDate,
        preferredTime: appointment.preferredTime,
        status: appointment.status
      }
    });

  } catch (error) {
    // Comprehensive error logging
    console.error('💥 Appointment booking error occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      console.log('❌ Mongoose validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Appointment data validation failed',
        errors: validationErrors.map(err => `${err.field}: ${err.message}`)
      });
    }
    
    // Handle MongoDB duplicate key errors (E11000)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      console.log('❌ Duplicate key error for field:', duplicateField);
      return res.status(409).json({
        success: false,
        message: 'An appointment with this information already exists.'
      });
    }
    
    // Handle MongoDB connection errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.log('❌ Database connection error');
      return res.status(503).json({
        success: false,
        message: 'Database service temporarily unavailable. Please try again later.'
      });
    }
    
    // Generic server error (fallback)
    console.log('❌ Unhandled server error during appointment booking');
    res.status(500).json({
      success: false,
      message: 'Internal server error occurred during appointment booking. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          errorName: error.name,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        }
      })
    });
  }
};

// @desc    Get all appointments (Admin only)
// @route   GET /api/appointments
// @access  Private/Admin
const getAllAppointments = async (req, res) => {
  try {
    console.log('📋 Fetching all appointments for admin');

    const appointments = await AppointmentBooking.find()
      .sort({ createdAt: -1 })
      .populate('assignedAstrologer', 'name email');

    console.log(`✅ Found ${appointments.length} appointments`);

    res.json({
      success: true,
      message: 'Appointments retrieved successfully',
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private/Admin
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await AppointmentBooking.findById(req.params.id)
      .populate('assignedAstrologer', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('❌ Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment'
    });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Admin
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const appointment = await AppointmentBooking.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        notes: notes || '',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    console.log(`✅ Appointment ${appointment._id} status updated to: ${status}`);

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('❌ Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status'
    });
  }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private/Admin
const getAppointmentStats = async (req, res) => {
  try {
    const stats = await AppointmentBooking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await AppointmentBooking.countDocuments();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await AppointmentBooking.countDocuments({
      createdAt: { $gte: today }
    });

    const formattedStats = {
      total,
      today: todayCount,
      byStatus: {}
    };

    stats.forEach(stat => {
      formattedStats.byStatus[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    console.error('❌ Error fetching appointment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment statistics'
    });
  }
};

module.exports = {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAppointmentStats
};
