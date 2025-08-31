const express = require('express');
const { body } = require('express-validator');
const {
  startCall,
  startChat,
  endSession,
  getActiveSessions,
  getSessionHistory
} = require('../controllers/sessionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation rules
const startSessionValidation = [
  body('astrologerId')
    .isMongoId()
    .withMessage('Valid astrologer ID is required')
];

// Routes
router.post('/start-call', authMiddleware, startSessionValidation, startCall);
router.post('/start-chat', authMiddleware, startSessionValidation, startChat);
router.post('/end/:sessionId', authMiddleware, endSession);
router.get('/active', authMiddleware, getActiveSessions);
router.get('/history', authMiddleware, getSessionHistory);

module.exports = router;
