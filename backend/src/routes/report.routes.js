const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/reports';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const {
  createReport,
  getReports,
  getReport,
  updateReport,
  deleteReport,
  getMyReports,
  updateReportStatus,
  addProgressUpdate,
  getNearbyReports,
  upvoteReport,
  addComment,
  assignReport,
  getReportStats,
  getRecentActivities,
  getUserActivity,
  getReportsByCategory,
  getStaffPerformance,
  updateProgress,
  approveCompletion,
  rejectCompletion,
  completeForReview,
  updateReportProgress,
  completeTask,
  uploadGalleryImages,
  rejectReport
} = require('../controllers/report.controller');

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getReports);
router.get('/nearby', getNearbyReports);
router.get('/:id', getReport);

// Protected routes
router.use(protect);

// User reports
router.get('/user/myreports', getMyReports);
router.get('/recent-activities', getRecentActivities);

// CRUD routes with file upload
router.post('/', upload.array('images', 5), createReport);
router.put('/:id', upload.array('images', 5), updateReport);
router.delete('/:id', deleteReport);

// Status and updates
router.put('/:id/status', updateReportStatus);
router.post('/:id/progress', upload.array('images', 5), addProgressUpdate);

// Interactions
router.put('/:id/upvote', upvoteReport);
router.post('/:id/comments', addComment);

// Admin stats
router.get('/stats/dashboard', authorize('admin'), getReportStats);
router.get('/user/:userId/activity', authorize('admin'), getUserActivity);

// Assignment routes
router.put('/:id/assign', authorize('admin'), assignReport);
router.get('/category/:category', getReportsByCategory);
router.get('/staff/performance', authorize('admin'), getStaffPerformance);

// Progress routes - FIXED: Use the correct function names
router.put('/:id/progress', upload.array('images', 5), updateReportProgress); // For staff progress updates
router.post('/:id/gallery', upload.single('afterImage'), uploadGalleryImages);

// Admin completion review routes
router.put('/:id/approve', authorize('admin'), approveCompletion);
router.put('/:id/reject', authorize('admin'), rejectCompletion);

// Admin report rejection route (NEW FEATURE)
router.put('/:id/reject-report', authorize('admin'), rejectReport);

// Staff completion route - FIXED: Use the correct function
router.put('/:id/complete', upload.array('images', 5), completeTask); // For staff to mark as completed

module.exports = router;