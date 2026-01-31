// routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getAdminDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.get('/users/:id', adminController.getUserById); 
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.put('/users/:id/role', adminController.updateUserRole);
router.get('/users/:id/stats', adminController.getUserStats); 

// Image approvals
router.get('/images/pending', adminController.getPendingImages);
router.put('/images/:id/approve', adminController.approveImage);
router.put('/images/:id/reject', adminController.rejectImage);

// System
router.get('/system/health', adminController.getSystemHealth);

// Activity
router.get('/activity', adminController.getAdminActivity);
// In your admin.routes.js, add these routes:
router.put('/reports/:id/approve-completion', adminController.approveStaffCompletion);
router.put('/reports/:id/reject-completion', adminController.rejectStaffCompletion);

// Gallery routes - NO /admin prefix (already mounted on /admin path)
router.get('/gallery/pending', adminController.getPendingGalleryImages);

router.put(
  '/reports/:reportId/gallery/:galleryImageId/approve', 
  adminController.approveGalleryImage
);

router.put(
  '/reports/:reportId/gallery/:galleryImageId/reject', 
  adminController.rejectGalleryImage
);

router.get('/gallery/stats', adminController.getGalleryStats);

module.exports = router;