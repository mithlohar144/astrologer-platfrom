const express = require('express');
const { body } = require('express-validator');
const {
  bookAppointment,
  getUserAppointments,
  getPendingAppointments,
  getAstrologerAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  rateAppointment
} = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Validation rules
const bookAppointmentValidation = [
  body('astrologerId')
    .isMongoId()
    .withMessage('Valid astrologer ID is required'),
  body('datetime')
    .isISO8601()
    .withMessage('Valid datetime is required'),
  body('duration')
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),
  body('mode')
    .isIn(['call', 'chat'])
    .withMessage('Mode must be either call or chat'),
  body('notes')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Notes cannot exceed 300 characters')
];

const updateStatusValidation = [
  body('appointmentId')
    .isMongoId()
    .withMessage('Valid appointment ID is required'),
  body('status')
    .isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

const rateAppointmentValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Feedback cannot exceed 500 characters')
];

// Routes
router.post('/book', authMiddleware, bookAppointmentValidation, bookAppointment);
router.get('/user/:id?', authMiddleware, getUserAppointments);
router.get('/pending', authMiddleware, adminMiddleware, getPendingAppointments);
router.get('/astrologer/:id', authMiddleware, adminMiddleware, getAstrologerAppointments);
router.patch('/update-status', authMiddleware, adminMiddleware, updateStatusValidation, updateAppointmentStatus);
router.delete('/cancel/:id', authMiddleware, cancelAppointment);
router.post('/rate/:id', authMiddleware, rateAppointmentValidation, rateAppointment);

module.exports = router;
