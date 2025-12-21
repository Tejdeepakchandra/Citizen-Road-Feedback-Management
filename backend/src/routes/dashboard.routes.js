const express = require('express');
const router = express.Router();
const {
  getCitizenDashboard,
  getAdminDashboard,
  getStaffDashboard,
  getSystemAnalytics,
  getCitizenStats,
} = require('../controllers/dashboard.controller');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   GET /api/dashboard/citizen
// @desc    Get citizen dashboard
// @access  Private/Citizen
router.get('/citizen', (req, res, next) => {
  if (req.user.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      error: 'Only citizens can access this dashboard'
    });
  }
  next();
}, getCitizenDashboard);
router.get('/citizen', protect, getCitizenStats);

//router.get('/citizen/stats', getCitizenDashboard); // If you want /citizen/stats


// @route   GET /api/dashboard/admin
// @desc    Get admin dashboard
// @access  Private/Admin
router.get('/admin', authorize('admin'), getAdminDashboard);

// @route   GET /api/dashboard/staff
// @desc    Get staff dashboard
// @access  Private/Staff
router.get('/staff', (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      error: 'Only staff can access this dashboard'
    });
  }
  next();
}, getStaffDashboard);

// @route   GET /api/dashboard/analytics
// @desc    Get system analytics
// @access  Private/Admin
router.get('/analytics', authorize('admin'), getSystemAnalytics);

module.exports = router;