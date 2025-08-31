const Review = require('../models/Review');
const Complaint = require('../models/Complaint');

// GET /api/admin/reviews
const listReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Review.find({})
        .populate('userId', 'name email')
        .populate('astrologerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({})
    ]);

    res.json({ success: true, data: items, pagination: { page, total, pages: Math.ceil(total / limit) } });
  } catch (e) {
    console.error('listReviews error:', e);
    res.status(500).json({ success: false, message: 'Server error fetching reviews' });
  }
};

// DELETE /api/admin/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Review.findByIdAndDelete(id);
    if (!r) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (e) {
    console.error('deleteReview error:', e);
    res.status(500).json({ success: false, message: 'Server error deleting review' });
  }
};

// GET /api/admin/complaints
const listComplaints = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = {};
    if (status) filter.status = status;

    const items = await Complaint.find(filter)
      .populate('userId', 'name email')
      .populate('astrologerId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: items });
  } catch (e) {
    console.error('listComplaints error:', e);
    res.status(500).json({ success: false, message: 'Server error fetching complaints' });
  }
};

// PATCH /api/admin/complaints/:id
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const c = await Complaint.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'name email').populate('astrologerId', 'name email');
    if (!c) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, message: 'Complaint updated', data: c });
  } catch (e) {
    console.error('updateComplaintStatus error:', e);
    res.status(500).json({ success: false, message: 'Server error updating complaint' });
  }
};

module.exports = { listReviews, deleteReview, listComplaints, updateComplaintStatus };
