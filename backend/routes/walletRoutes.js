const express = require('express');
const { body } = require('express-validator');
const {
  topupWallet,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getWalletHistory,
  getWalletBalance
} = require('../controllers/walletController');
const { createWithdrawRequest } = require('../controllers/withdrawController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Validation rules
const topupValidation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1, max: 5000 })
    .withMessage('Amount must be between ₹1 and ₹5000'),
  body('paymentMethod')
    .optional()
    .isIn(['mock', 'razorpay'])
    .withMessage('Invalid payment method')
];

const createOrderValidation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1, max: 5000 })
    .withMessage('Amount must be between ₹1 and ₹5000')
];

const verifyPaymentValidation = [
  body('razorpay_order_id')
    .notEmpty()
    .withMessage('Order ID is required'),
  body('razorpay_payment_id')
    .notEmpty()
    .withMessage('Payment ID is required'),
  body('razorpay_signature')
    .notEmpty()
    .withMessage('Payment signature is required'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount is required')
];

const withdrawValidation = [
  body('amount')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least ₹1'),
  body('method')
    .isIn(['upi', 'bank'])
    .withMessage('Method must be either upi or bank'),
  body('upiId')
    .if(body('method').equals('upi'))
    .notEmpty()
    .withMessage('UPI ID is required for UPI method'),
  body('bankDetails')
    .if(body('method').equals('bank'))
    .custom((val) => !!val && typeof val === 'object')
    .withMessage('Bank details are required for bank method'),
  body('bankDetails.bankName')
    .if(body('method').equals('bank'))
    .notEmpty()
    .withMessage('Bank name is required'),
  body('bankDetails.accountNumber')
    .if(body('method').equals('bank'))
    .notEmpty()
    .withMessage('Account number is required'),
  body('bankDetails.ifsc')
    .if(body('method').equals('bank'))
    .notEmpty()
    .withMessage('IFSC is required'),
  body('bankDetails.accountHolder')
    .if(body('method').equals('bank'))
    .notEmpty()
    .withMessage('Account holder name is required')
];

// Routes
router.post('/topup', authMiddleware, topupValidation, topupWallet);
router.post('/create-order', authMiddleware, createOrderValidation, createRazorpayOrder);
router.post('/verify-payment', authMiddleware, verifyPaymentValidation, verifyRazorpayPayment);
router.get('/balance', authMiddleware, getWalletBalance);
router.get('/history/:userId?', authMiddleware, getWalletHistory);
router.post('/withdraw', authMiddleware, withdrawValidation, createWithdrawRequest);

module.exports = router;
