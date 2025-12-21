// backend/src/controllers/feedback.controller.js

const Feedback = require('../models/Feedback');
const Report = require('../models/Report');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// =============================
// GET ALL FEEDBACK
// =============================
exports.getAllFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find()
    .populate('user', 'name email')
    .populate('report', 'title category')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: feedbacks
  });
});

// =============================
// GET MY FEEDBACK
// =============================
exports.getMyFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ user: req.user.id })
    .populate('report', 'title category')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: feedbacks
  });
});

// =============================
// GET FEEDBACK BY USER (ADMIN)
// =============================
exports.getFeedbackByUser = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) return next(new ErrorResponse('User not found', 404));

  const feedbacks = await Feedback.find({ user: userId })
    .populate('report', 'title category status')
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: feedbacks.length,
    data: feedbacks
  });
});
// =============================
// GET FEEDBACK BY REPORT
// =============================
exports.getFeedbackByReport = asyncHandler(async (req, res, next) => {
  const { reportId } = req.params;

  const report = await Report.findById(reportId);
  if (!report) return next(new ErrorResponse('Report not found', 404));

  const feedback = await Feedback.find({ report: reportId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// =============================
// CREATE FEEDBACK
// =============================
exports.createFeedback = asyncHandler(async (req, res, next) => {
  // Accept either "reportId" or "report" for resiliency
  const { reportId, report: reportField, rating, comment, aspects, anonymous } = req.body;
  const rid = reportId || reportField;

  if (!rid || rating === undefined || rating === null) {
    return next(new ErrorResponse('reportId and rating required', 400));
  }

  const report = await Report.findById(rid);
  if (!report) return next(new ErrorResponse('Report not found', 404));

  // Prevent duplicate feedback by same user
  const existing = await Feedback.findOne({ report: rid, user: req.user.id });
  if (existing) return next(new ErrorResponse('Feedback already submitted', 400));

  const feedback = await Feedback.create({
    report: rid,
    user: req.user.id,
    rating,
    comment,
    aspects,
    isPublic: !anonymous
  });

  // populate response for frontend convenience
  await feedback.populate('user', 'name email').execPopulate?.(); // for mongoose <6 safe call
  await feedback.populate('report', 'title category').execPopulate?.();

  res.status(201).json({
    success: true,
    message: 'Feedback submitted',
    data: feedback
  });
});

// =============================
// UPDATE FEEDBACK
// =============================
exports.updateFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return next(new ErrorResponse('Feedback not found', 404));

  if (feedback.user.toString() !== req.user.id)
    return next(new ErrorResponse('Not authorized', 403));

  const allowed = ['rating', 'comment', 'aspects', 'isPublic', 'tags', 'helpfulBy', 'helpfulCount'];
  allowed.forEach(f => {
    if (req.body[f] !== undefined) feedback[f] = req.body[f];
  });

  await feedback.save();

  await feedback.populate('user', 'name email').execPopulate?.();
  await feedback.populate('report', 'title category').execPopulate?.();

  res.status(200).json({
    success: true,
    message: 'Feedback updated',
    data: feedback
  });
});

// =============================
// DELETE FEEDBACK
// =============================
exports.deleteFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return next(new ErrorResponse('Feedback not found', 404));

  if (feedback.user.toString() !== req.user.id && req.user.role !== 'admin')
    return next(new ErrorResponse('Not authorized', 403));

  await feedback.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Feedback deleted',
    data: null
  });
});

// =============================
// RATE / LIKE FEEDBACK
// =============================
exports.rateFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return next(new ErrorResponse('Feedback not found', 404));

  const userId = req.user.id;
  const alreadyLiked = feedback.helpfulBy.some(u => u.toString() === userId);

  if (alreadyLiked) {
    feedback.helpfulBy = feedback.helpfulBy.filter(u => u.toString() !== userId);
    feedback.helpfulCount = Math.max(0, (feedback.helpfulCount || 0) - 1);
  } else {
    feedback.helpfulBy.push(userId);
    feedback.helpfulCount = (feedback.helpfulCount || 0) + 1;
  }

  await feedback.save();

  await feedback.populate('user', 'name email').execPopulate?.();
  await feedback.populate('report', 'title category').execPopulate?.();

  res.status(200).json({
    success: true,
    data: feedback
  });
});

// =============================
// FEEDBACK STATS
// =============================
exports.getFeedbackStats = asyncHandler(async (req, res) => {
  const stats = await Feedback.aggregate([
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);

  const summary = await Feedback.aggregate([
    { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats,
      summary: summary[0] || { avgRating: 0, total: 0 }
    }
  });
});
