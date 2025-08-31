const express = require('express');
const { body } = require('express-validator');
const {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAppointmentStats
} = require('../controllers/appointmentBookingController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Validation rules for appointment booking
const appointmentValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  body('phone')
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be a valid 10-digit number'),
  body('sessionType')
    .isIn(['call', 'chat'])
    .withMessage('Session type must be either "call" or "chat"'),
  body('preferredDate')
    .custom((value) => {
      // Check if it's a valid date (accepts both ISO8601 and YYYY-MM-DD formats)
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Please enter a valid date');
      }
      
      // Check if date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('Preferred date cannot be in the past');
      }
      return true;
    }),
  body('preferredTime')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please enter a valid time format (HH:MM)'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Message cannot exceed 500 characters')
];

// Validation rules for status update
const statusUpdateValidation = [
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Status must be one of: pending, confirmed, completed, cancelled'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// @route   POST /api/appointments
// @desc    Create new appointment booking
// @access  Public
router.post('/', appointmentValidation, createAppointment);

// @route   GET /api/appointments
// @desc    Get all appointments (Admin only)
// @access  Private/Admin
router.get('/', authMiddleware, adminMiddleware, getAllAppointments);

// @route   GET /api/appointments/stats
// @desc    Get appointment statistics (Admin only)
// @access  Private/Admin
router.get('/stats', authMiddleware, adminMiddleware, getAppointmentStats);

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID (Admin only)
// @access  Private/Admin
router.get('/:id', authMiddleware, adminMiddleware, getAppointmentById);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status (Admin only)
// @access  Private/Admin
router.put('/:id/status', authMiddleware, adminMiddleware, statusUpdateValidation, updateAppointmentStatus);

module.exports = router;
