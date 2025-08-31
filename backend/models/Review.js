const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  astrologerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Astrologer', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 2000 },
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
