const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserRole,
  getUserStats,
  getUserActivity,
  syncUserStats
} = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { schemas } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// =================== ADMIN ONLY ROUTES ===================
// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', authorize('admin'), getUsers);

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats', authorize('admin'), getUserStats);

// =================== USER PROFILE ROUTES ===================
// @route   PUT /api/users/sync-stats
// @desc    Sync user statistics with reports
// @access  Private
router.put('/sync-stats', syncUserStats); // User can sync their own stats

// @route   GET /api/users/activity
// @desc    Get current user's activity
// @access  Private
router.get('/activity', getUserActivity); // Get current user's activity

// =================== SPECIFIC USER ROUTES ===================
// IMPORTANT: These routes come after all non-ID routes
// @route   GET /api/users/:id
// @desc    Get user by ID (Admin can get any, users can get own)
// @access  Private
router.get('/:id', getUser);

// @route   GET /api/users/:id/activity
// @desc    Get specific user's activity (Admin only)
// @access  Private/Admin
router.get('/:id/activity', authorize('admin'), getUserActivity);

// @route   PUT /api/users/:id
// @desc    Update user profile (Admin can update any, users can update own)
// @access  Private
router.put('/:id', validate(schemas.updateUser), updateUser);

// @route   PUT /api/users/:id/sync-stats
// @desc    Sync specific user's statistics (Admin only)
// @access  Private/Admin
router.put('/:id/sync-stats', authorize('admin'), syncUserStats);

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private/Admin
router.put('/:id/role', authorize('admin'), updateUserRole);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private/Admin
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;