const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateProfile,
  adminLogin
} = require('../controllers/authController');
const {
  requestPasswordReset,
  resetPassword,
  verifyResetToken
} = require('../controllers/forgotPasswordController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('contact')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit contact number')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('contact')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit contact number')
];

// Forgot password validation
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/admin/login', loginValidation, adminLogin);
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, profileUpdateValidation, updateProfile);

// Forgot password routes
router.post('/forgot-password', forgotPasswordValidation, requestPasswordReset);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/verify-reset-token/:token', verifyResetToken);

module.exports = router;
