const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  sendBroadcast,
  getPreferences,
  updatePreferences,
  getNotificationStats
} = require('../controllers/notification.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', getNotifications);

// @route   GET /api/notifications/preferences
// @desc    Get notification preferences
// @access  Private
router.get('/preferences', getPreferences);

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', updatePreferences);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', deleteNotification);

// @route   DELETE /api/notifications
// @desc    Clear all notifications
// @access  Private
router.delete('/', clearAllNotifications);

// @route   POST /api/notifications/broadcast
// @desc    Send broadcast notification (Admin only)
// @access  Private/Admin
router.post('/broadcast', authorize('admin'), sendBroadcast);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics (Admin only)
// @access  Private/Admin
router.get('/stats', authorize('admin'), getNotificationStats);

module.exports = router;