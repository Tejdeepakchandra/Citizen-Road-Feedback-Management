const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const reportRoutes = require('./report.routes');
const userRoutes = require('./user.routes');
const staffRoutes = require('./staff.routes');
const donationRoutes = require('./donation.routes');
const dashboardRoutes = require('./dashboard.routes');
const notificationRoutes = require('./notification.routes');
const galleryRoutes = require('./gallery.routes');
const adminRoutes = require('./admin.routes'); // Add this line


// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date()
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);
router.use('/staff', staffRoutes);
router.use('/donations', donationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/gallery', galleryRoutes);
router.use('/feedback', require('./feedback.routes'));
router.use('/admin', adminRoutes); // Add this line



// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;
