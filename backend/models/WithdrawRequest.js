const mongoose = require('mongoose');

const WithdrawRequestSchema = new mongoose.Schema({
  // Either userId or astrologerId will be present based on requesterType
  requesterType: { type: String, enum: ['user', 'astrologer'], default: 'user', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  astrologerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer' },
  amount: { type: Number, required: true, min: 1 },
  method: { type: String, enum: ['bank', 'upi'], required: true },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    ifsc: String,
    accountHolder: String
  },
  upiId: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  notes: { type: String },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('WithdrawRequest', WithdrawRequestSchema);
