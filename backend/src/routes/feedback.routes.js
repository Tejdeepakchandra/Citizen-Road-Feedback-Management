const express = require('express');
const router = express.Router();
const { protect , authorize} = require('../middleware/auth');
const controller = require('../controllers/feedback.controller');

// ✅ PUBLIC ROUTES (no authentication required)
router.get('/', controller.getAllFeedback);
router.get('/report/:reportId', controller.getFeedbackByReport);
router.get('/stats', controller.getFeedbackStats);

// 🔒 PROTECTED ROUTES (authentication required)
router.use(protect);

router.get('/my', controller.getMyFeedback);
router.get('/user/:userId', authorize('admin'), controller.getFeedbackByUser);
router.post('/', controller.createFeedback);
router.put('/:id', controller.updateFeedback);
router.delete('/:id', controller.deleteFeedback);
router.post('/:id/rate', controller.rateFeedback);

module.exports = router;
