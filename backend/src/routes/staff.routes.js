const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadMultiple, uploadSingle } = require('../middleware/upload');

// All routes require authentication
router.use(protect);

// ========== STAFF-ONLY ROUTES (without ID in URL) ==========
router.get('/reports/assigned', authorize('staff'), staffController.getMyAssignedReports);
router.put('/reports/:id/progress', authorize('staff'), staffController.updateReportProgress);
router.put('/reports/:id/complete', authorize('staff'), staffController.markReportComplete);
router.get('/my-performance', authorize('staff'), staffController.getMyPerformance);
router.get('/dashboard', authorize('staff'), staffController.getDashboard);
router.get('/mystats', authorize('staff'), staffController.getMyStats);
router.get('/mytasks', authorize('staff'), staffController.getMyTasks);

// ========== EXISTING ROUTES ==========
// Staff task management routes
router.get('/:id/tasks', authorize('staff', 'admin'), staffController.getStaffTasks);
router.get('/:id/tasks/:taskId', authorize('staff', 'admin'), staffController.getStaffTaskDetails);
router.put('/:id/tasks/:taskId/progress', authorize('staff'), staffController.updateTaskProgress);
router.post('/:id/tasks/:taskId/submit', authorize('staff'), staffController.submitTaskForReview);
router.post('/:id/tasks/:taskId/upload', 
  authorize('staff'),
  uploadMultiple('images', 10),
  staffController.uploadWorkImages
);

// Staff analytics
router.get('/:id/analytics', authorize('staff', 'admin'), staffController.getStaffAnalytics);

// Before-After Gallery (Public routes)
router.get('/gallery', staffController.getBeforeAfterGallery);
router.get('/gallery/:reportId', staffController.getGalleryItem);

// Admin routes
router.get('/', authorize('admin'), staffController.getStaff);
router.get('/performance', authorize('admin'), staffController.getStaffPerformance);
router.get('/category/:category', authorize('admin'), staffController.getStaffByCategory);
router.get('/dashboard/:id', staffController.getStaffDashboard);
router.get('/:id', staffController.getStaffMember);
router.post('/', authorize('admin'), staffController.createStaff);
router.put('/:id', authorize('admin'), staffController.updateStaff);
router.put('/:id/deactivate', authorize('admin'), staffController.deactivateStaff);
router.put('/reports/:id/complete-task', authorize(['staff', 'worker']), staffController.completeTaskForReview);


// ===================== STAFF SETTINGS ROUTES =====================
// router.route('/preferences')
//   .get(protect, authorize('staff'),staffController.getPreferences)
//   .put(protect, authorize('staff'), staffController.savePreferences);

router.route('/profile')
  .put(protect, authorize('staff'), staffController.updateProfile);
router.route('/password')
  .put(protect, authorize('staff'), staffController.changePassword);

router.route('/export-data')
  .post(protect, authorize('staff'), staffController.exportData);

router.route('/history')
  .delete(protect, authorize('staff'), staffController.clearHistory);

router.route('/account')
  .delete(protect, authorize('staff'), staffController.deleteAccount);
router.get('/preferences', protect, authorize('staff', 'admin'), staffController.getStaffPreferences);
router.put('/preferences', protect, authorize('staff', 'admin'), staffController.saveStaffPreferences);
router.put('/notifications', protect, authorize('staff', 'admin'), staffController.updateStaffNotifications);
router.put('/save-all-preferences', protect, authorize('staff', 'admin'), staffController.saveAllStaffPreferences);


router.get('/reports/gallery-eligible', protect, authorize('staff'), staffController.getGalleryEligibleReports);
router.post('/reports/:reportId/gallery', 
  protect, 
  authorize('staff'), 
  uploadSingle('afterImage'), 
  staffController.uploadGalleryImages
);

router.get('/gallery/uploads', protect, authorize('staff'), staffController.getMyGalleryUploads);
router.get('/gallery/stats', protect, authorize('staff'), staffController.getGalleryUploadStats);

module.exports = router;