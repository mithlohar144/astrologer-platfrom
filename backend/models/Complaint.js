const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  astrologerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
  ticketId: { type: String, required: true, unique: true, index: true },
  subject: { type: String, maxlength: 200 },
  description: { type: String, maxlength: 4000 },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
