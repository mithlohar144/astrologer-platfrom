const express = require('express');
const {
  getDashboardSummary,
  getAllUsers,
  getAllAppointments,
  getAllAstrologers,
  toggleUserStatus,
  getRevenueAnalytics,
  updateAdminCredentials
} = require('../controllers/adminController');
const { listWithdrawRequests, updateWithdrawStatus } = require('../controllers/withdrawController');
const { listReviews, deleteReview, listComplaints, updateComplaintStatus } = require('../controllers/feedbackController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Routes
router.get('/summary', getDashboardSummary);
router.get('/users', getAllUsers);
router.get('/appointments', getAllAppointments);
router.get('/astrologers', getAllAstrologers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.get('/analytics/revenue', getRevenueAnalytics);
router.put('/update', updateAdminCredentials);
// Withdraw requests
router.get('/withdraw-requests', listWithdrawRequests);
router.patch('/withdraw-requests/:id', updateWithdrawStatus);
// Reviews
router.get('/reviews', listReviews);
router.delete('/reviews/:id', deleteReview);
// Complaints
router.get('/complaints', listComplaints);
router.patch('/complaints/:id', updateComplaintStatus);

module.exports = router;
