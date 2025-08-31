const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  startCall,
  getCallStatus,
  endCall,
  handleStatusWebhook,
  handleConferenceWebhook,
  getCallHistory
} = require('../controllers/callController');

// Public base URL that Twilio can reach (e.g., https://your-backend.example.com)
const BASE_WEBHOOK_URL = process.env.BACKEND_URL || process.env.BACKEND_PUBLIC_URL || process.env.SERVER_URL || 'http://localhost:9000';

// Protected routes (require authentication)
router.post('/start', protect, startCall);
router.get('/status/:callId', protect, getCallStatus);
router.post('/end/:callId', protect, endCall);
router.get('/history', protect, getCallHistory);

// Webhook routes (no authentication required for Twilio webhooks)
router.post('/webhook/status', handleStatusWebhook);
router.post('/webhook/conference', handleConferenceWebhook);
router.post('/webhook/participant', (req, res) => res.status(200).send('OK'));

// TwiML endpoint for call instructions
router.post('/twiml', (req, res) => {
  const { action } = req.query;
  
  let twiml = '';
  
  switch (action) {
    case 'conference':
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the conference. Please wait.</Say>
  <Dial>
    <Conference statusCallback="${BASE_WEBHOOK_URL}/api/call/webhook/conference" statusCallbackMethod="POST">${req.query.conferenceSid}</Conference>
  </Dial>
</Response>`;
      break;
    case 'welcome':
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Welcome to the astrologer consultation platform. You will be connected shortly.</Say>
  <Pause length="1"/>
</Response>`;
      break;
    default:
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please wait while we connect you.</Say>
</Response>`;
  }
  
  res.type('text/xml');
  res.send(twiml);
});

module.exports = router;
