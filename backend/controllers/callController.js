const axios = require('axios');
const Call = require('../models/Call');
const User = require('../models/User');
const WalletHistory = require('../models/WalletHistory');

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TARGET_PHONE_NUMBER = process.env.TARGET_PHONE_NUMBER || process.env.ASTROLOGER_PHONE || '+911234567890';

// Public base URL that Twilio can reach (e.g., https://your-backend.example.com)
const BASE_WEBHOOK_URL = process.env.BACKEND_URL || process.env.BACKEND_PUBLIC_URL || process.env.SERVER_URL || 'http://localhost:9000';

// Twilio API base URL
const TWILIO_API_BASE = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}`;

// Helper function to make Twilio API calls
const twilioRequest = async (endpoint, method = 'POST', data = {}) => {
  try {
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const config = {
      method,
      url: `${TWILIO_API_BASE}${endpoint}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    if (method === 'POST' && Object.keys(data).length > 0) {
      const params = new URLSearchParams();
      Object.keys(data).forEach(key => {
        params.append(key, data[key]);
      });
      config.data = params.toString();
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('Twilio API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Twilio API request failed');
  }
};

// Start a conference call
const startCall = async (req, res) => {
  try {
    const { userPhoneNumber } = req.body;
    const userId = req.user.id;

    // Validate phone number format
    if (!userPhoneNumber || !/^\+?[1-9]\d{1,14}$/.test(userPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Get user and check wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check minimum balance (at least 10 seconds worth)
    const minimumBalance = 2.5; // ₹2.5 for 10 seconds
    if (user.walletBalance < minimumBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient wallet balance. Minimum ₹${minimumBalance} required.`
      });
    }

    // Format phone numbers
    const formattedUserPhone = userPhoneNumber.startsWith('+') ? userPhoneNumber : `+91${userPhoneNumber}`;
    
    // Create conference room
    const conference = await twilioRequest('/Conferences.json', 'POST', {
      FriendlyName: `Call_${userId}_${Date.now()}`,
      StatusCallback: `${BASE_WEBHOOK_URL}/api/call/webhook/conference`,
      StatusCallbackMethod: 'POST'
    });

    // Create call record
    const callRecord = new Call({
      userId,
      userPhoneNumber: formattedUserPhone,
      targetPhoneNumber: TARGET_PHONE_NUMBER,
      callSid: conference.sid,
      conferenceSid: conference.sid,
      walletBalanceBefore: user.walletBalance,
      status: 'initiated'
    });

    await callRecord.save();

    // Call user first
    const userCall = await twilioRequest('/Calls.json', 'POST', {
      To: formattedUserPhone,
      From: TWILIO_PHONE_NUMBER,
      Twiml: `<Response>
        <Say voice="alice">Connecting you to the astrologer. Please wait.</Say>
        <Dial>
          <Conference statusCallback="${BASE_WEBHOOK_URL}/api/call/webhook/participant" statusCallbackMethod="POST">${conference.sid}</Conference>
        </Dial>
      </Response>`,
      StatusCallback: `${BASE_WEBHOOK_URL}/api/call/webhook/status`,
      StatusCallbackMethod: 'POST'
    });

    // Call target number
    const targetCall = await twilioRequest('/Calls.json', 'POST', {
      To: TARGET_PHONE_NUMBER,
      From: TWILIO_PHONE_NUMBER,
      Twiml: `<Response>
        <Say voice="alice">You have an incoming consultation call.</Say>
        <Dial>
          <Conference statusCallback="${BASE_WEBHOOK_URL}/api/call/webhook/participant" statusCallbackMethod="POST">${conference.sid}</Conference>
        </Dial>
      </Response>`,
      StatusCallback: `${BASE_WEBHOOK_URL}/api/call/webhook/status`,
      StatusCallbackMethod: 'POST'
    });

    // Update call record with call SIDs
    callRecord.userCallSid = userCall.sid;
    callRecord.targetCallSid = targetCall.sid;
    callRecord.status = 'ringing';
    await callRecord.save();

    res.json({
      success: true,
      message: 'Conference call initiated successfully',
      data: {
        callId: callRecord._id,
        conferenceSid: conference.sid,
        userCallSid: userCall.sid,
        targetCallSid: targetCall.sid,
        status: 'ringing',
        walletBalance: user.walletBalance
      }
    });

  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to start call'
    });
  }
};

// Get call status and handle billing
const getCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const callRecord = await Call.findOne({ _id: callId, userId });
    if (!callRecord) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Get current status from Twilio
    try {
      const conferenceStatus = await twilioRequest(`/Conferences/${callRecord.conferenceSid}.json`, 'GET');
      
      // Update call status based on conference status
      if (conferenceStatus.status === 'in-progress' && callRecord.status !== 'in-progress') {
        callRecord.status = 'in-progress';
        callRecord.answerTime = new Date();
        callRecord.billingStarted = true;
        await callRecord.save();
      }

      // Handle billing for active calls
      if (callRecord.status === 'in-progress' && callRecord.billingStarted) {
        await handleRealTimeBilling(callRecord);
      }

    } catch (twilioError) {
      console.error('Twilio status check error:', twilioError);
      // Continue with stored status if Twilio API fails
    }

    // Get updated user wallet balance
    const user = await User.findById(userId);

    res.json({
      success: true,
      data: {
        callId: callRecord._id,
        status: callRecord.status,
        duration: callRecord.duration,
        billingDuration: callRecord.billingDuration,
        totalCost: callRecord.totalCost,
        walletBalance: user.walletBalance,
        isActive: callRecord.isActive,
        startTime: callRecord.startTime,
        answerTime: callRecord.answerTime,
        endTime: callRecord.endTime
      }
    });

  } catch (error) {
    console.error('Get call status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call status'
    });
  }
};

// Handle real-time billing
const handleRealTimeBilling = async (callRecord) => {
  try {
    if (!callRecord.answerTime || !callRecord.billingStarted) {
      return;
    }

    const now = new Date();
    const billingDuration = Math.ceil((now - callRecord.answerTime) / 1000);
    const totalCost = billingDuration * callRecord.costPerSecond;

    // Get current user wallet balance
    const user = await User.findById(callRecord.userId);
    
    // Check if user has sufficient balance
    if (user.walletBalance < totalCost) {
      // Insufficient balance - end call
      await endCall({ params: { callId: callRecord._id }, user: { id: callRecord.userId } }, null, 'insufficient_balance');
      return;
    }

    // Update call record
    callRecord.billingDuration = billingDuration;
    callRecord.totalCost = totalCost;
    callRecord.lastBillingUpdate = now;
    await callRecord.save();

  } catch (error) {
    console.error('Real-time billing error:', error);
  }
};

// End call
const endCall = async (req, res, endReason = 'user_hangup') => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    const callRecord = await Call.findOne({ _id: callId, userId });
    if (!callRecord) {
      if (res) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }
      return;
    }

    // End the conference
    try {
      await twilioRequest(`/Conferences/${callRecord.conferenceSid}.json`, 'POST', {
        Status: 'completed'
      });
    } catch (twilioError) {
      console.error('Error ending Twilio conference:', twilioError);
    }

    // Update call record
    callRecord.endTime = new Date();
    callRecord.status = 'completed';
    callRecord.endReason = endReason;
    callRecord.isActive = false;

    // Calculate final billing
    if (callRecord.answerTime && callRecord.billingStarted) {
      callRecord.updateBilling();
    }

    await callRecord.save();

    // Deduct amount from wallet if there was billing
    if (callRecord.totalCost > 0) {
      const user = await User.findById(userId);
      user.walletBalance = Math.max(0, user.walletBalance - callRecord.totalCost);
      callRecord.walletBalanceAfter = user.walletBalance;
      await user.save();
      await callRecord.save();

      // Create wallet history entry
      await WalletHistory.create({
        userId,
        type: 'debit',
        amount: callRecord.totalCost,
        reason: 'call_charges',
        description: `Voice call charges - ${callRecord.billingDuration} seconds`,
        balanceAfter: user.walletBalance,
        status: 'completed'
      });
    }

    if (res) {
      res.json({
        success: true,
        message: 'Call ended successfully',
        data: {
          callId: callRecord._id,
          duration: callRecord.billingDuration,
          totalCost: callRecord.totalCost,
          walletBalanceAfter: callRecord.walletBalanceAfter,
          endReason: callRecord.endReason
        }
      });
    }

  } catch (error) {
    console.error('End call error:', error);
    if (res) {
      res.status(500).json({
        success: false,
        message: 'Failed to end call'
      });
    }
  }
};

// Webhook handlers
const handleStatusWebhook = async (req, res) => {
  try {
    const { CallSid, CallStatus } = req.body;
    
    // Find call by SID
    const callRecord = await Call.findOne({
      $or: [
        { userCallSid: CallSid },
        { targetCallSid: CallSid }
      ]
    });

    if (callRecord) {
      // Update status based on Twilio webhook
      if (CallStatus === 'completed' || CallStatus === 'failed') {
        callRecord.status = CallStatus;
        callRecord.endTime = new Date();
        callRecord.isActive = false;
        await callRecord.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Status webhook error:', error);
    res.status(200).send('OK'); // Always respond OK to Twilio
  }
};

const handleConferenceWebhook = async (req, res) => {
  try {
    const { ConferenceSid, StatusCallbackEvent } = req.body;
    
    const callRecord = await Call.findOne({ conferenceSid: ConferenceSid });
    if (callRecord) {
      if (StatusCallbackEvent === 'conference-start') {
        callRecord.status = 'in-progress';
        callRecord.answerTime = new Date();
        callRecord.billingStarted = true;
        await callRecord.save();
      } else if (StatusCallbackEvent === 'conference-end') {
        callRecord.status = 'completed';
        callRecord.endTime = new Date();
        callRecord.isActive = false;
        await callRecord.save();
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Conference webhook error:', error);
    res.status(200).send('OK');
  }
};

// Get call history
const getCallHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const calls = await Call.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-userCallSid -targetCallSid -callSid -conferenceSid');

    const total = await Call.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        calls,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history'
    });
  }
};

module.exports = {
  startCall,
  getCallStatus,
  endCall,
  handleStatusWebhook,
  handleConferenceWebhook,
  getCallHistory
};
