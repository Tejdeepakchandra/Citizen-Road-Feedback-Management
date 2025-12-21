const express = require('express');
const router = express.Router();
const {
  createDonationOrder,
  verifyDonation,
  getDonations,
  getMyDonations,
  getDonationStats,
  getDonation,
  updateDonationStatus,
  getDonationLeaderboard
} = require('../controllers/donation.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

// CRITICAL: Public routes MUST come BEFORE router.use(protect) middleware
// @route   GET /api/donations/stats
// @desc    Get donation statistics
// @access  Public
router.get('/stats', getDonationStats);

// @route   GET /api/donations/leaderboard
// @desc    Get donation leaderboard
// @access  Public
router.get('/leaderboard', getDonationLeaderboard);

// @route   GET /api/donations
// @desc    Get all donations (public list)
// @access  Public
router.get('/', getDonations);

// Protected routes - apply protect middleware from here on
// All routes defined after this line require authentication
router.use(protect);

// Special routes - MUST come before /:id route
// @route   GET /api/donations/my
// @desc    Get user's own donations
// @access  Private
router.get('/my', getMyDonations);

// @route   POST /api/donations/create-order
// @desc    Create donation order
// @access  Private
router.post('/create-order', validate(schemas.createDonation), createDonationOrder);

// @route   POST /api/donations/verify
// @desc    Verify donation payment
// @access  Private
router.post('/verify', verifyDonation);

// @route   GET /api/donations/:id
// @desc    Get donation by ID
// @access  Private
router.get('/:id', getDonation);

// @route   PUT /api/donations/:id/status
// @desc    Update donation status (Admin only)
// @access  Private/Admin
router.put('/:id/status', authorize('admin'), updateDonationStatus);

module.exports = router;