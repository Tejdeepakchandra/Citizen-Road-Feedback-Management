const mongoose = require('mongoose');

const ErrorResponse = require('../utils/errorResponse');                                  //line 1331 update task progress
const asyncHandler = require('../utils/asyncHandler');                                    //line 143 image upload
const { uploadToCloudinary } = require('../config/cloudinary');
// ✅ FIXED: Use your existing notification service
const { createNotification } = require('../services/notification.service');
const notificationEmitter = require('../services/notificationEmitter.service');
const User = require('../models/User');
const Report = require('../models/Report');

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Admin)
exports.getStaff = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, category, isActive } = req.query;
  
  const query = { role: 'staff' };
  
  if (category) query.staffCategory = category;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  const staff = await User.find(query)
    .select('name email staffCategory phone avatar isActive lastLogin stats createdAt')
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: staff.length,
    total,
    pages: Math.ceil(total / limit),
    data: staff
  });
});

// @desc    Get staff tasks (Assigned Reports)
// @route   GET /api/staff/:id/tasks
// @access  Private (Staff)
exports.getStaffTasks = asyncHandler(async (req, res, next) => {
  const staffId = req.params.id;
  const { status, priority, page = 1, limit = 10 } = req.query;

  // Authorization check
  if (req.user.id !== staffId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }

  const query = { assignedTo: staffId };
  
  if (status) {
    if (status === 'active') {
      query.status = { $in: ['assigned', 'in_progress'] };
    } else {
      query.status = status;
    }
  }
  
  if (priority) query.priority = priority;

  const tasks = await Report.find(query)
    .select('title category severity priority status createdAt location estimatedCompletion progress beforeImages afterImages')
    .populate('user', 'name email phone')
    .sort({ 
      priority: -1, 
      createdAt: -1 
    })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Report.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    pages: Math.ceil(total / limit),
    data: tasks
  });
});

// @desc    Get staff task details
// @route   GET /api/staff/:id/tasks/:taskId
// @access  Private (Staff)
exports.getStaffTaskDetails = asyncHandler(async (req, res, next) => {
  const { id: staffId, taskId } = req.params;

  // Authorization check
  if (req.user.id !== staffId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }

  const task = await Report.findOne({
    _id: taskId,
    assignedTo: staffId
  })
  .populate('user', 'name email phone')
  .populate('assignedBy', 'name email')
  .populate('progressUpdates.updatedBy', 'name role');

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Update task progress (Staff updates)
// @route   PUT /api/staff/:id/tasks/:taskId/progress
// @access  Private (Staff)
exports.updateTaskProgress = asyncHandler(async (req, res, next) => {
  const { id: staffId, taskId } = req.params;
  const { status, progress, description, images } = req.body;

  // Authorization check
  if (req.user.id !== staffId) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  const task = await Report.findOne({
    _id: taskId,
    assignedTo: staffId
  });

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  const progressUpdate = {
    status: status || task.status,
    description: description || `Progress updated by ${req.user.name}`,
    percentage: progress || task.progress || 0,
    updatedBy: req.user.id,
    timestamp: new Date()
  };

  // ✅ FIXED: Handle image uploads with Cloudinary
  let uploadedImages = [];
  if (req.files && req.files.images) {
    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    
    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file.path, 'progress-updates');
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: req.user.id
        });
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    progressUpdate.images = uploadedImages;
  }

  // Update task
  task.status = status || task.status;
  task.progress = progress || task.progress || 0;
  task.updatedAt = new Date();

  // If status is completed, set completion date
  if (status === 'completed' && !task.actualCompletion) {
    task.actualCompletion = new Date();
    
    // Auto-mark as resolved after 24 hours if no admin action
    task.resolutionDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  // Add progress update
  task.progressUpdates.push(progressUpdate);

  // ✅ FIXED: Upload after images with Cloudinary
  if (status === 'completed' && req.files && req.files.afterImages) {
    const afterFiles = Array.isArray(req.files.afterImages) 
      ? req.files.afterImages 
      : [req.files.afterImages];
    
    for (const file of afterFiles) {
      try {
        const result = await uploadToCloudinary(file.path, 'after-images');
        task.afterImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: req.user.id,
          description: 'After repair image'
        });
      } catch (error) {
        console.error('Error uploading after image:', error);
      }
    }
  }

  await task.save();

  // ✅ FIXED: Use createNotification instead of Notification.sendAdminNotification
  if (status === 'completed') {
    try {
      await createNotification({
        user: req.user.id,
        type: 'TASK_COMPLETED',
        title: 'Task Marked as Completed',
        message: `${req.user.name} has marked task "${task.title}" as completed`,
        data: {
          taskId: task._id,
          staffId: staffId,
          staffName: req.user.name,
          images: uploadedImages
        },
        recipients: ['admin']
      });

      // Notify the user who reported
      await createNotification({
        user: req.user.id,
        type: 'REPORT_PROGRESS',
        title: 'Your Report is Being Reviewed',
        message: `Staff has completed work on your report "${task.title}". It's now under admin review.`,
        data: {
          reportId: task._id,
          status: 'under_review'
        },
        recipients: [task.user._id]
      });
    } catch (notificationError) {
      console.error('Notification failed:', notificationError);
      // Continue without notifications
    }
  }

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task progress updated successfully'
  });
});

// @desc    Submit task for admin review (Staff submits completed work)
// @route   POST /api/staff/:id/tasks/:taskId/submit
// @access  Private (Staff)
exports.submitTaskForReview = asyncHandler(async (req, res, next) => {
  const { id: staffId, taskId } = req.params;
  const { completionNotes, afterImagesDescription } = req.body;

  // Authorization check
  if (req.user.id !== staffId) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  const task = await Report.findOne({
    _id: taskId,
    assignedTo: staffId,
    status: { $in: ['in_progress', 'completed'] }
  });

  if (!task) {
    return next(new ErrorResponse('Task not found or not in progress', 404));
  }

  // ✅ FIXED: Upload after images with Cloudinary
  if (req.files && req.files.afterImages) {
    const afterFiles = Array.isArray(req.files.afterImages) 
      ? req.files.afterImages 
      : [req.files.afterImages];
    
    for (const file of afterFiles) {
      try {
        const result = await uploadToCloudinary(file.path, 'after-images');
        task.afterImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: req.user.id,
          description: afterImagesDescription || 'After repair image'
        });
      } catch (error) {
        console.error('Error uploading after image:', error);
      }
    }
  }

  // Update task status
  task.status = 'completed';
  task.progress = 100;
  task.actualCompletion = new Date();
  task.completionNotes = completionNotes;
  task.updatedAt = new Date();

  // Add completion update
  task.progressUpdates.push({
    status: 'completed',
    description: completionNotes || 'Task completed and submitted for review',
    percentage: 100,
    updatedBy: req.user.id,
    timestamp: new Date(),
    images: task.afterImages
  });

  await task.save();

  // ✅ FIXED: Use createNotification
  try {
    // Send notification to admin for review
    await createNotification({
      user: req.user.id,
      type: 'TASK_FOR_REVIEW',
      title: 'Task Ready for Review',
      message: `${req.user.name} has submitted task "${task.title}" for review`,
      data: {
        taskId: task._id,
        staffId: staffId,
        staffName: req.user.name,
        beforeImages: task.images,
        afterImages: task.afterImages
      },
      recipients: ['admin']
    });

    // Notify the user
    await createNotification({
      user: req.user.id,
      type: 'REPORT_COMPLETED',
      title: 'Your Report is Complete!',
      message: `Work has been completed on your report "${task.title}". Awaiting final admin verification.`,
      data: {
        reportId: task._id,
        beforeImages: task.images,
        afterImages: task.afterImages
      },
      recipients: [task.user._id]
    });
  } catch (notificationError) {
    console.error('Notification failed:', notificationError);
  }

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task submitted for admin review successfully'
  });
});

// @desc    Get staff performance analytics
// @route   GET /api/staff/:id/analytics
// @access  Private (Staff/Admin)
exports.getStaffAnalytics = asyncHandler(async (req, res, next) => {
  const staffId = req.params.id;
  const { period = 'month' } = req.query;

  // Authorization check
  if (req.user.id !== staffId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }

  const dateFilter = getDateFilter(period);
  const startDate = dateFilter.createdAt.$gte;

  // Get task statistics
  const taskStats = await Report.aggregate([
    {
      $match: {
        assignedTo: staffId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'completed'] },
                { $ne: ['$actualCompletion', null] },
                { $ne: ['$assignedAt', null] }
              ]},
              { $divide: [
                { $subtract: ['$actualCompletion', '$assignedAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]},
              null
            ]
          }
        }
      }
    }
  ]);

  // Get category-wise distribution
  const categoryStats = await Report.aggregate([
    {
      $match: {
        assignedTo: staffId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        total: 1,
        completed: 1,
        completionRate: {
          $multiply: [{ $divide: ['$completed', '$total'] }, 100]
        }
      }
    }
  ]);

  // Get timeline data for chart
  const timelineData = await Report.aggregate([
    {
      $match: {
        assignedTo: staffId,
        createdAt: { $gte: startDate },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$actualCompletion" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Calculate overall stats
  const totalTasks = await Report.countDocuments({
    assignedTo: staffId,
    createdAt: { $gte: startDate }
  });

  const completedTasks = await Report.countDocuments({
    assignedTo: staffId,
    status: 'completed',
    createdAt: { $gte: startDate }
  });

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        completionRate: Math.round(completionRate)
      },
      taskStats: taskStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      categoryStats,
      timelineData,
      period
    }
  });
});

// @desc    Upload work images (Staff can upload progress images)
// @route   POST /api/staff/:id/tasks/:taskId/upload
// @access  Private (Staff)
exports.uploadWorkImages = asyncHandler(async (req, res, next) => {
  const { id: staffId, taskId } = req.params;
  const { type, description } = req.body; // type: 'progress', 'after', 'before'

  // Authorization check
  if (req.user.id !== staffId) {
    return next(new ErrorResponse('Not authorized', 401));
  }

  if (!req.files || !req.files.images) {
    return next(new ErrorResponse('Please upload images', 400));
  }

  const task = await Report.findOne({
    _id: taskId,
    assignedTo: staffId
  });

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  const files = Array.isArray(req.files.images) 
    ? req.files.images 
    : [req.files.images];

  const uploadedImages = [];

  for (const file of files) {
    try {
      // ✅ Already fixed: Using uploadToCloudinary
      const result = await uploadToCloudinary(file.path, `${type}-images`);
      uploadedImages.push({
        url: result.secure_url,
        public_id: result.public_id,
        type: type || 'progress',
        description: description || `${type} image`,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  // Add to appropriate array based on type
  if (type === 'after') {
    task.afterImages.push(...uploadedImages);
  } else if (type === 'before') {
    // Only allow before images if not already uploaded by user
    task.beforeImages = task.beforeImages || [];
    task.beforeImages.push(...uploadedImages);
  } else {
    // For progress images, add to progress updates
    task.progressUpdates.push({
      status: task.status,
      description: description || 'Added work images',
      percentage: task.progress,
      updatedBy: req.user.id,
      timestamp: new Date(),
      images: uploadedImages
    });
  }

  await task.save();

  res.status(200).json({
    success: true,
    data: uploadedImages,
    message: 'Images uploaded successfully'
  });
});

// @desc    Get before-after gallery for completed tasks
// @route   GET /api/staff/gallery
// @access  Public (With optional authentication)
exports.getBeforeAfterGallery = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 12, category, staffId } = req.query;

  const query = {
    status: 'resolved',
    beforeImages: { $exists: true, $ne: [] },
    afterImages: { $exists: true, $ne: [] }
  };

  if (category) query.category = category;
  if (staffId) query.assignedTo = staffId;

  const galleryItems = await Report.find(query)
    .select('title category description beforeImages afterImages resolvedAt location user assignedTo')
    .populate('user', 'name')
    .populate('assignedTo', 'name staffCategory')
    .sort('-resolvedAt')
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Report.countDocuments(query);

  // Format for gallery display
  const formattedGallery = galleryItems.map(item => ({
    id: item._id,
    title: item.title,
    category: item.category,
    description: item.description,
    location: item.location,
    beforeImage: item.beforeImages[0]?.url,
    afterImage: item.afterImages[0]?.url,
    resolvedAt: item.resolvedAt,
    user: item.user?.name,
    staff: item.assignedTo?.name,
    staffCategory: item.assignedTo?.staffCategory,
    totalImages: {
      before: item.beforeImages.length,
      after: item.afterImages.length
    }
  }));

  res.status(200).json({
    success: true,
    count: formattedGallery.length,
    total,
    pages: Math.ceil(total / limit),
    data: formattedGallery
  });
});

// @desc    Get single gallery item with all images
// @route   GET /api/staff/gallery/:reportId
// @access  Public
exports.getGalleryItem = asyncHandler(async (req, res, next) => {
  const reportId = req.params.reportId;

  const report = await Report.findById(reportId)
    .select('title category description beforeImages afterImages progressUpdates resolvedAt location user assignedTo')
    .populate('user', 'name avatar')
    .populate('assignedTo', 'name staffCategory avatar');

  if (!report || report.status !== 'resolved') {
    return next(new ErrorResponse('Gallery item not found', 404));
  }

  // Calculate time to resolve
  const timeToResolve = report.resolvedAt && report.createdAt
    ? Math.round((report.resolvedAt - report.createdAt) / (1000 * 60 * 60 * 24))
    : null;

  const galleryItem = {
    id: report._id,
    title: report.title,
    category: report.category,
    description: report.description,
    location: report.location,
    beforeImages: report.beforeImages.map(img => ({
      url: img.url,
      description: img.description,
      uploadedAt: img.uploadedAt
    })),
    afterImages: report.afterImages.map(img => ({
      url: img.url,
      description: img.description,
      uploadedAt: img.uploadedAt
    })),
    progressTimeline: report.progressUpdates.map(update => ({
      status: update.status,
      description: update.description,
      percentage: update.percentage,
      timestamp: update.timestamp,
      images: update.images
    })),
    resolvedAt: report.resolvedAt,
    timeToResolve: timeToResolve ? `${timeToResolve} days` : 'N/A',
    user: {
      name: report.user?.name,
      avatar: report.user?.avatar
    },
    staff: {
      name: report.assignedTo?.name,
      category: report.assignedTo?.staffCategory,
      avatar: report.assignedTo?.avatar
    }
  };

  res.status(200).json({
    success: true,
    data: galleryItem
  });
});

// Helper function to get date filter
const getDateFilter = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case 'quarter':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'year':
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  return { createdAt: { $gte: startDate } };
};

// staff.controller.js - Add these missing functions at the bottom:

// @desc    Get staff by category
// @route   GET /api/staff/category/:category
// @access  Private (Admin)
exports.getStaffByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { isActive = true } = req.query;

  const staff = await User.find({
    role: 'staff',
    staffCategory: category,
    isActive: isActive === 'true'
  })
  .select('name email staffCategory phone avatar isActive lastLogin stats')
  .sort('name');

  res.status(200).json({
    success: true,
    count: staff.length,
    data: staff
  });
});
// @desc    Complete a task and mark for admin review (sets needsReview flag)
// @route   PUT /api/staff/reports/:id/complete-task
// @access  Private (Staff)
// Add this function to your staffController.js
// @desc    Complete a task and mark for admin review (with needsReview flag)
// @route   PUT /api/staff/reports/:id/complete-for-review
// @access  Private (Staff)
exports.completeTaskForReview = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const { completionNotes } = req.body;

  const report = await Report.findOne({
    _id: reportId,
    assignedTo: req.user.id,
    status: { $in: ['assigned', 'in_progress'] }
  });

  if (!report) {
    return next(new ErrorResponse('Report not found or not assigned to you', 404));
  }

  // Handle after images upload
  let afterImages = [];
  if (req.files && req.files.afterImages) {
    const afterFiles = Array.isArray(req.files.afterImages) 
      ? req.files.afterImages 
      : [req.files.afterImages];
    
    for (const file of afterFiles) {
      try {
        const result = await uploadToCloudinary(file.path, 'after-images');
        afterImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: req.user.id,
          description: 'After repair image'
        });
      } catch (error) {
        console.error('Error uploading after image:', error);
      }
    }
  }

  // Create progress update
  const progressUpdate = {
    status: 'completed',
    description: completionNotes || 'Task completed by staff, awaiting admin review',
    percentage: 100,
    updatedBy: req.user.id,
    timestamp: new Date(),
    images: afterImages
  };

  // Update report with ALL necessary fields
  report.status = 'completed';
  report.progress = 100;
  report.staffCompletionTime = new Date(); // When staff marked it complete
  report.staffCompletedBy = req.user.id;   // Which staff completed it
  report.completionNotes = completionNotes;
  report.updatedAt = new Date();
  
  // CRITICAL: Set these flags for admin dashboard
  report.needsReview = true;           // Shows in "Needs Review" tab
  report.adminApproved = false;        // Not approved yet
  report.adminRejected = false;        // Not rejected yet
  
  // Don't set actualCompletion yet - that's for when admin approves
  // report.actualCompletion = new Date(); // DON'T set this yet!
  
  if (afterImages.length > 0) {
    report.afterImages = afterImages;
  }

  // Add progress update
  report.progressUpdates.push(progressUpdate);

  await report.save();

  // Send notifications using the new notificationEmitter
  try {
    await notificationEmitter.notifyTaskCompleted(report, req.user);
  } catch (notificationError) {
    console.error('Notification failed:', notificationError);
  }

  res.status(200).json({
    success: true,
    data: {
      report,
      progressUpdate,
      needsReview: true
    },
    message: 'Task completed successfully. Awaiting admin review.'
  });
});
// @desc    Get staff performance
// @route   GET /api/staff/performance
// @access  Private (Admin)
exports.getStaffPerformance = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query;
  
  const dateFilter = getDateFilter(period);
  const startDate = dateFilter.createdAt.$gte;

  const performance = await Report.aggregate([
    {
      $match: {
        assignedTo: { $ne: null },
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$assignedTo',
        totalAssigned: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'completed'] },
                { $ne: ['$actualCompletion', null] },
                { $ne: ['$assignedAt', null] }
              ]},
              { $divide: [
                { $subtract: ['$actualCompletion', '$assignedAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]},
              null
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'staffInfo'
      }
    },
    { $unwind: '$staffInfo' },
    {
      $project: {
        staffId: '$_id',
        staffName: '$staffInfo.name',
        staffCategory: '$staffInfo.staffCategory',
        staffEmail: '$staffInfo.email',
        totalAssigned: 1,
        completed: 1,
        inProgress: 1,
        completionRate: {
          $multiply: [
            { $divide: ['$completed', { $cond: [{ $eq: ['$totalAssigned', 0] }, 1, '$totalAssigned'] }] },
            100
          ]
        },
        avgCompletionTime: { $round: ['$avgCompletionTime', 1] }
      }
    },
    { $sort: { completionRate: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: performance
  });
});

// @desc    Get staff dashboard
// @route   GET /api/staff/dashboard/:id
// @access  Private (Staff)
exports.getStaffDashboard = asyncHandler(async (req, res, next) => {
  const staffId = req.params.id;

  // Authorization check
  if (req.user.id !== staffId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }

  const [
    assignedTasks,
    completedTasks,
    inProgressTasks,
    recentActivity,
    staffInfo
  ] = await Promise.all([
    Report.find({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] }
    })
    .select('title category severity priority createdAt location estimatedCompletion')
    .sort('priority -createdAt')
    .limit(10),

    Report.countDocuments({
      assignedTo: staffId,
      status: 'completed'
    }),

    Report.countDocuments({
      assignedTo: staffId,
      status: 'in_progress'
    }),

    Report.find({ assignedTo: staffId })
      .select('progressUpdates')
      .sort('-updatedAt')
      .limit(5)
      .populate('progressUpdates.updatedBy', 'name role'),

    User.findById(staffId).select('name email staffCategory avatar stats')
  ]);

  const dashboardData = {
    staffInfo,
    assignedTasks,
    completedTasks,
    inProgressTasks,
    recentActivity: recentActivity.flatMap(report => report.progressUpdates),
    stats: {
      totalAssigned: await Report.countDocuments({ assignedTo: staffId }),
      totalCompleted: completedTasks,
      completionRate: completedTasks > 0 ? Math.round((completedTasks / (completedTasks + inProgressTasks)) * 100) : 0
    }
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get staff member details
// @route   GET /api/staff/:id
// @access  Private (Admin/Staff)
exports.getStaffMember = asyncHandler(async (req, res, next) => {
  const staff = await User.findById(req.params.id);

  if (!staff || staff.role !== 'staff') {
    return next(new ErrorResponse('Staff member not found', 404));
  }

  // Get assigned reports
  const assignedReports = await Report.find({ assignedTo: staff._id })
    .select('title category status priority createdAt')
    .sort('-createdAt')
    .limit(10);

  // Get performance stats
  const performance = await Report.aggregate([
    {
      $match: {
        assignedTo: staff._id,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalCompleted: { $sum: 1 },
        avgCompletionTime: {
          $avg: {
            $divide: [
              { $subtract: ['$actualCompletion', '$assignedAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        },
        byCategory: { $push: '$category' }
      }
    }
  ]);

  const staffData = staff.toObject();
  staffData.assignedReports = assignedReports;
  staffData.performance = performance[0] || {
    totalCompleted: 0,
    avgCompletionTime: 0,
    byCategory: []
  };

  res.status(200).json({
    success: true,
    data: staffData
  });
});

// @desc    Create new staff member
// @route   POST /api/staff
// @access  Private (Admin)
exports.createStaff = asyncHandler(async (req, res, next) => {
  const { name, email, password, staffCategory, phone, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  const staff = await User.create({
    name,
    email,
    password,
    role: 'staff',
    staffCategory,
    phone,
    address,
    emailVerified: true
  });

  res.status(201).json({
    success: true,
    data: staff,
    message: 'Staff member created successfully'
  });
});

// @desc    Update staff member
// @route   PUT /api/staff/:id
// @access  Private (Admin)
exports.updateStaff = asyncHandler(async (req, res, next) => {
  let staff = await User.findById(req.params.id);

  if (!staff || staff.role !== 'staff') {
    return next(new ErrorResponse('Staff member not found', 404));
  }

  // Remove password from update data if present
  const { password, ...updateData } = req.body;

  staff = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: staff,
    message: 'Staff member updated successfully'
  });
});

// @desc    Deactivate staff member
// @route   PUT /api/staff/:id/deactivate
// @access  Private (Admin)
exports.deactivateStaff = asyncHandler(async (req, res, next) => {
  const staff = await User.findById(req.params.id);

  if (!staff || staff.role !== 'staff') {
    return next(new ErrorResponse('Staff member not found', 404));
  }

  staff.isActive = false;
  await staff.save();

  // Reassign any active reports
  await Report.updateMany(
    {
      assignedTo: staff._id,
      status: { $in: ['assigned', 'in_progress'] }
    },
    {
      $set: {
        assignedTo: null,
        status: 'pending'
      },
      $push: {
        progressUpdates: {
          status: 'pending',
          description: `Reassigned due to staff deactivation`,
          percentage: 0,
          updatedBy: req.user.id,
          timestamp: new Date()
        }
      }
    }
  );

  res.status(200).json({
    success: true,
    data: staff,
    message: 'Staff member deactivated successfully'
  });
});

// Helper function to get date filter (make sure this is defined)
// Add these functions to your staff.controller.js file:

// @desc    Get assigned reports for logged-in staff (Staff access)
// @route   GET /api/staff/reports/assigned
// @access  Private (Staff)
exports.getMyAssignedReports = asyncHandler(async (req, res, next) => {
  const { status, priority, page = 1, limit = 10 } = req.query;
  

  
  // Convert to ObjectId for comparison
  const userId = req.user.id;
  const userIdObj = new mongoose.Types.ObjectId(userId);
  

  
  // Check the actual task in database BEFORE building query
  const specificTask = await Report.findById('6941bfb1dd88df392d532a28')
    .select('assignedTo title status adminApproved metadata')
    .lean();

  
  // Check if IDs match

  
  // Build query with ObjectId
  let query = { assignedTo: userIdObj }; // Use ObjectId
  

  // Apply status filters
  if (status && status !== 'all') {
    
    if (status === 'active') {
      query.status = { $in: ['assigned', 'in_progress'] };
    } else if (status === 'completed_approved') {
      query.status = 'completed';
      query.$or = [
        { 'metadata.adminApproved': true },
        { adminApproved: true }
      ];
    } else if (status === 'in_review') {
      query.status = 'completed';
      query.$and = [
        { 
          $or: [
            { 'metadata.needsReview': true },
            { needsReview: true }
          ]
        },
        {
          $or: [
            { 'metadata.adminApproved': { $ne: true } },
            { adminApproved: { $ne: true } }
          ]
        },
        {
          $or: [
            { 'metadata.adminRejected': { $ne: true } },
            { adminRejected: { $ne: true } }
          ]
        }
      ];
    } else if (status === 'needs_revision') {
      query.$or = [
        { 'metadata.adminRejected': true },
        { adminRejected: true }
      ];
      query.assignedTo = userIdObj;
    } else {
      query.status = status;
    }
  }
  
  if (priority) query.priority = priority;
  

  
  // Test the query BEFORE populating
 
  const testTasks = await Report.find(query)
    .select('title status assignedTo adminApproved metadata')
    .lean();
  
  console.log(`Query found ${testTasks.length} tasks`);
  testTasks.forEach((task, i) => {
    console.log(`${i + 1}. ${task.title} - ${task.status} - adminApproved: ${task.adminApproved}`);
  });
  
  // Now run the full query with populate
  const reports = await Report.find(query)
    .select('title category severity priority status createdAt location estimatedCompletion progress beforeImages afterImages images assignedAt actualCompletion metadata adminApproved adminRejected needsReview approvedAt rejectedAt adminNotes rejectionReason completionNotes staffCompletedBy staffCompletionTime')
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name staffCategory')
    .sort({ 
      priority: -1, 
      createdAt: -1 
    })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Report.countDocuments(query);
  

  // Process reports
  const processedReports = reports.map(report => {
    const reportObj = report.toObject();
    const metadata = reportObj.metadata || {};
    
    const adminApproved = metadata.adminApproved === true || reportObj.adminApproved === true;
    const adminRejected = metadata.adminRejected === true || reportObj.adminRejected === true;
    const needsReview = metadata.needsReview === true || reportObj.needsReview === true;
    
    let displayStatus = reportObj.status;
    
    if (adminApproved && reportObj.status === 'completed') {
      displayStatus = 'completed_approved';
    } else if (adminRejected) {
      displayStatus = 'needs_revision';
    } else if (needsReview && reportObj.status === 'completed') {
      displayStatus = 'in_review';
    } else if (reportObj.status === 'completed' && !adminApproved && !adminRejected) {
      displayStatus = 'in_review';
    }
    
    console.log(`Processing: ${reportObj.title} - status: ${reportObj.status} -> display: ${displayStatus}`);
    
    return {
      ...reportObj,
      displayStatus,
      isAdminApproved: adminApproved,
      isAdminRejected: adminRejected,
      needsReview: needsReview,
      actualCompletionDate: reportObj.actualCompletion || reportObj.approvedAt || reportObj.staffCompletionTime,
      metadata: metadata
    };
  });

  // Calculate stats
  const allAssigned = await Report.find({ assignedTo: userIdObj });
  
  console.log(`\n=== STATS CALCULATION ===`);
  console.log(`Total assigned to user: ${allAssigned.length}`);
  
  const pendingCount = allAssigned.filter(r => 
    r.status === 'assigned' || r.status === 'in_progress'
  ).length;
  
  const completedApprovedCount = allAssigned.filter(r => {
    const metadata = r.metadata || {};
    const adminApproved = metadata.adminApproved === true || r.adminApproved === true;
    return r.status === 'completed' && adminApproved;
  }).length;
  
  console.log(`Pending: ${pendingCount}, Completed Approved: ${completedApprovedCount}`);

  res.status(200).json({
    success: true,
    count: processedReports.length,
    total,
    pages: Math.ceil(total / limit),
    data: processedReports,
    stats: {
      pending: pendingCount,
      completed: completedApprovedCount,
      total: allAssigned.length
    }
  });
});

// @desc    Update report progress (Staff access without ID in params)
// @route   PUT /api/staff/reports/:id/progress
// @access  Private (Staff)
exports.updateReportProgress = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const { status, progress, description } = req.body;

  const report = await Report.findOne({
    _id: reportId,
    assignedTo: req.user.id
  });

  if (!report) {
    return next(new ErrorResponse('Report not found or not assigned to you', 404));
  }

  const progressUpdate = {
    status: status || report.status,
    description: description || `Progress updated by ${req.user.name}`,
    percentage: progress || report.progress || 0,
    updatedBy: req.user.id,
    timestamp: new Date()
  };

  // Handle image uploads
  let uploadedImages = [];
  if (req.files && req.files.images) {
    const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    
    for (const file of files) {
      try {
        const result = await uploadToCloudinary(file.path, 'progress-updates');
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: req.user.id
        });
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
    progressUpdate.images = uploadedImages;
  }

  // Update report
  report.status = status || report.status;
  report.progress = progress || report.progress || 0;
  report.updatedAt = new Date();

  // If status is completed, set completion date
  if (status === 'completed' && !report.actualCompletion) {
    report.actualCompletion = new Date();
  }

  // Add progress update
  report.progressUpdates.push(progressUpdate);

  await report.save();

  // Send notifications
  if (status === 'completed') {
    try {
      await createNotification({
        user: req.user.id,
        type: 'TASK_COMPLETED',
        title: 'Task Marked as Completed',
        message: `${req.user.name} has marked task "${report.title}" as completed`,
        data: {
          taskId: report._id,
          staffId: req.user.id,
          staffName: req.user.name,
          images: uploadedImages
        },
        recipients: ['admin']
      });

      // Notify the user who reported
      await createNotification({
        user: req.user.id,
        type: 'REPORT_PROGRESS',
        title: 'Your Report is Being Reviewed',
        message: `Staff has completed work on your report "${report.title}". It's now under admin review.`,
        data: {
          reportId: report._id,
          status: 'under_review'
        },
        recipients: [report.user._id]
      });
    } catch (notificationError) {
      console.error('Notification failed:', notificationError);
    }
  }

  res.status(200).json({
    success: true,
    data: report,
    message: 'Report progress updated successfully'
  });
});

// @desc    Mark report as complete (Staff access without ID in params)
// @route   PUT /api/staff/reports/:id/complete
// @access  Private (Staff)
exports.markReportComplete = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const { completionNotes } = req.body;

  const report = await Report.findOne({
    _id: reportId,
    assignedTo: req.user.id
  });

  if (!report) {
    return next(new ErrorResponse('Report not found or not assigned to you', 404));
  }

  // Handle after images upload
  if (req.files && req.files.afterImages) {
    const afterFiles = Array.isArray(req.files.afterImages) 
      ? req.files.afterImages 
      : [req.files.afterImages];
    
    for (const file of afterFiles) {
      try {
        const result = await uploadToCloudinary(file.path, 'after-images');
        report.afterImages.push({
          url: result.secure_url,
          public_id: result.public_id,
          uploadedAt: new Date(),
          uploadedBy: req.user.id,
          description: 'After repair image'
        });
      } catch (error) {
        console.error('Error uploading after image:', error);
      }
    }
  }

  // Update report status
  report.status = 'completed';
  report.progress = 100;
  report.actualCompletion = new Date();
  report.completionNotes = completionNotes;
  report.updatedAt = new Date();

  // Add completion update
  report.progressUpdates.push({
    status: 'completed',
    description: completionNotes || 'Report completed and submitted for review',
    percentage: 100,
    updatedBy: req.user.id,
    timestamp: new Date(),
    images: report.afterImages
  });

  await report.save();

  // Send notifications using the new notificationEmitter
  try {
    await notificationEmitter.notifyTaskCompleted(report, req.user);
  } catch (notificationError) {
    console.error('Notification failed:', notificationError);
  }

  res.status(200).json({
    success: true,
    data: report,
    message: 'Report marked as complete successfully'
  });
});

// @desc    Get staff's performance (for logged-in staff)
// @route   GET /api/staff/my-performance
// @access  Private (Staff)
exports.getMyPerformance = asyncHandler(async (req, res, next) => {
  const staffId = req.user.id;
  const { period = 'month' } = req.query;

  const dateFilter = getDateFilter(period);
  const startDate = dateFilter.createdAt.$gte;

  // Get performance data
  const performance = await Report.aggregate([
    {
      $match: {
        assignedTo: staffId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAssigned: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $and: [
                { $eq: ['$status', 'completed'] },
                { $ne: ['$actualCompletion', null] },
                { $ne: ['$assignedAt', null] }
              ]},
              { $divide: [
                { $subtract: ['$actualCompletion', '$assignedAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]},
              null
            ]
          }
        },
        byCategory: { $push: '$category' }
      }
    }
  ]);

  // Get category-wise stats
  const categoryStats = await Report.aggregate([
    {
      $match: {
        assignedTo: staffId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        category: '$_id',
        total: 1,
        completed: 1,
        completionRate: {
          $multiply: [{ $divide: ['$completed', '$total'] }, 100]
        }
      }
    }
  ]);

  // Get timeline data
  const timelineData = await Report.aggregate([
    {
      $match: {
        assignedTo: staffId,
        status: 'completed',
        actualCompletion: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$actualCompletion" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const perfData = performance[0] || {
    totalAssigned: 0,
    completed: 0,
    inProgress: 0,
    avgCompletionTime: 0
  };

  const completionRate = perfData.totalAssigned > 0 
    ? (perfData.completed / perfData.totalAssigned) * 100 
    : 0;

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalAssigned: perfData.totalAssigned,
        completed: perfData.completed,
        inProgress: perfData.inProgress,
        completionRate: Math.round(completionRate),
        avgCompletionTime: Math.round(perfData.avgCompletionTime || 0)
      },
      categoryStats,
      timelineData,
      period
    }
  });
});

// @desc    Get staff dashboard (without ID in URL - uses logged-in user)
// @route   GET /api/staff/dashboard
// @access  Private (Staff)
exports.getDashboard = asyncHandler(async (req, res, next) => {
  const staffId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    assignedTasks,
    completedToday,
    pendingTasks,
    recentActivity,
    staffInfo,
    totalAssigned,
    totalCompleted
  ] = await Promise.all([
    // Get assigned tasks
    Report.find({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] }
    })
    .select('title category severity priority createdAt location estimatedCompletion')
    .sort('priority -createdAt')
    .limit(10),

    // Count tasks completed today
    Report.countDocuments({
      assignedTo: staffId,
      status: 'completed',
      actualCompletion: { $gte: today }
    }),

    // Count pending tasks
    Report.countDocuments({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] }
    }),

    // Get recent activity
    Report.find({ 
      assignedTo: staffId,
      'progressUpdates': { $exists: true, $not: { $size: 0 } }
    })
      .select('title progressUpdates')
      .sort('-updatedAt')
      .limit(5)
      .populate('progressUpdates.updatedBy', 'name role'),

    // Get staff info
    User.findById(staffId).select('name email staffCategory avatar stats'),

    // Total assigned count
    Report.countDocuments({ assignedTo: staffId }),

    // Total completed count
    Report.countDocuments({
      assignedTo: staffId,
      status: 'completed'
    })
  ]);

  // Calculate performance score
  const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

  const dashboardData = {
    staffInfo,
    assignedTasks,
    completedToday,
    pendingTasks,
    recentActivity: recentActivity.flatMap(report => 
      report.progressUpdates.slice(0, 2).map(update => ({
        reportTitle: report.title,
        ...update.toObject()
      }))
    ),
    stats: {
      totalAssigned,
      totalCompleted,
      pendingTasks,
      completedToday,
      completionRate: Math.round(completionRate)
    }
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get staff statistics for sidebar
// @route   GET /api/staff/mystats
// @access  Private (Staff)
exports.getMyStats = asyncHandler(async (req, res, next) => {
  const staffId = req.user.id;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    assignedTasks,
    completedToday,
    pendingTasks,
    totalCompleted
  ] = await Promise.all([
    Report.countDocuments({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] }
    }),
    
    Report.countDocuments({
      assignedTo: staffId,
      status: 'completed',
      actualCompletion: { $gte: today }
    }),
    
    Report.countDocuments({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] }
    }),
    
    Report.countDocuments({
      assignedTo: staffId,
      status: 'completed'
    })
  ]);

  // Calculate performance score (completion rate)
  const totalAssigned = assignedTasks + totalCompleted;
  const performanceScore = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      assignedTasks,
      pendingTasks,
      completedToday,
      performanceScore,
      totalCompleted
    }
  });
});

// @desc    Get staff's tasks
// @route   GET /api/staff/mytasks
// @access  Private (Staff)
exports.getMyTasks = asyncHandler(async (req, res, next) => {
 
  
  const { status, priority, page = 1, limit = 10 } = req.query;
  
  // Start with base query - ALWAYS filter by assignedTo
  let query = { assignedTo: req.user.id };
  
  
  // Handle the new display status filters
  if (status && status !== 'all') {
    if (status === 'active') {
      query.status = { $in: ['assigned', 'in_progress'] };
    } else if (status === 'completed_approved') {
      // For completed and approved
      query.status = 'completed';
      query.$or = [
        { 'metadata.adminApproved': true },
        { adminApproved: true }
      ];
    } else if (status === 'in_review') {
      // For completed but not approved/rejected
      query.status = 'completed';
      query.$and = [
        { 
          $or: [
            { 'metadata.needsReview': true },
            { needsReview: true }
          ]
        },
        {
          $or: [
            { 'metadata.adminApproved': { $ne: true } },
            { adminApproved: { $ne: true } }
          ]
        },
        {
          $or: [
            { 'metadata.adminRejected': { $ne: true } },
            { adminRejected: { $ne: true } }
          ]
        }
      ];
    } else if (status === 'needs_revision') {
      // For rejected tasks - keep assignedTo filter
      query.$or = [
        { 'metadata.adminRejected': true },
        { adminRejected: true }
      ];
      // IMPORTANT: Keep assignedTo filter for rejected tasks too
      query.assignedTo = req.user.id;
    } else {
      // For standard statuses: pending, assigned, in_progress, completed
      query.status = status;
    }
  }
  
  if (priority) query.priority = priority;

  
  // Include ALL necessary fields
  const tasks = await Report.find(query)
    .select('title category severity priority status createdAt location estimatedCompletion progress beforeImages afterImages assignedAt actualCompletion metadata adminApproved adminRejected needsReview approvedAt rejectedAt adminNotes rejectionReason completionNotes staffCompletedBy staffCompletionTime')
    .populate('user', 'name email phone')
    .populate('assignedTo', 'name staffCategory')
    .sort({ 
      priority: -1, 
      createdAt: -1 
    })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Report.countDocuments(query);
  
  
 

  // Process tasks for consistent status display
  const processedTasks = tasks.map(task => {
    const taskObj = task.toObject();
    const metadata = taskObj.metadata || {};
    
    const adminApproved = metadata.adminApproved === true || taskObj.adminApproved === true;
    const adminRejected = metadata.adminRejected === true || taskObj.adminRejected === true;
    const needsReview = metadata.needsReview === true || taskObj.needsReview === true;
    
    let displayStatus = taskObj.status;
    
    if (adminApproved && taskObj.status === 'completed') {
      displayStatus = 'completed_approved';
    } else if (adminRejected) {
      displayStatus = 'needs_revision';
    } else if (needsReview && taskObj.status === 'completed') {
      displayStatus = 'in_review';
    } else if (taskObj.status === 'completed' && !adminApproved && !adminRejected) {
      displayStatus = 'in_review';
    }
    
    return {
      ...taskObj,
      displayStatus,
      isAdminApproved: adminApproved,
      isAdminRejected: adminRejected,
      needsReview: needsReview,
      actualCompletionDate: taskObj.actualCompletion || taskObj.approvedAt || taskObj.staffCompletionTime,
      metadata: metadata
    };
  });

  
  res.status(200).json({
    success: true,
    count: processedTasks.length,
    total,
    pages: Math.ceil(total / limit),
    data: processedTasks
  });
});
// ===================== STAFF SETTINGS CONTROLLERS =====================

// @desc    Get staff preferences
// @route   GET /api/staff/preferences
// @access  Private/Staff
// controllers/staffController.js


// @desc    Get staff preferences
// @route   GET /api/staff/preferences
// @access  Private/Staff
exports.getStaffPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('preferences staffCategory role');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'staff' && user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access staff preferences', 403));
  }

  // Default staff preferences if not set
  const defaultStaffPreferences = {
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      newAssignments: true,
      assignmentUpdates: true,
      emergencyReports: true,
      dailySummary: true,
      reportResolved: true,
      feedbackReceived: true,
      priorityAlerts: true,
      shiftReminders: false,
      teamUpdates: false,
    },
    workPreferences: {
      maxAssignments: 5,
      autoAcceptAssignments: false,
      showEmergencyFirst: true,
      enableLocationTracking: true,
      offlineMode: false,
      workRadius: 10, // in km
      preferredShift: 'morning',
      notificationSound: true,
      mapType: 'standard',
    },
    availability: {
      monday: { morning: true, afternoon: true, evening: false },
      tuesday: { morning: true, afternoon: true, evening: false },
      wednesday: { morning: true, afternoon: true, evening: false },
      thursday: { morning: true, afternoon: true, evening: false },
      friday: { morning: true, afternoon: true, evening: false },
      saturday: { morning: false, afternoon: false, evening: false },
      sunday: { morning: false, afternoon: false, evening: false },
    }
  };

  // Merge with existing preferences
  const staffPreferences = {
    notifications: {
      ...defaultStaffPreferences.notifications,
      ...(user.preferences?.notifications || {})
    },
    workPreferences: user.preferences?.workPreferences || defaultStaffPreferences.workPreferences,
    availability: user.preferences?.availability || defaultStaffPreferences.availability,
    language: user.preferences?.language || { language: 'en', timezone: 'Asia/Kolkata' },
    theme: user.preferences?.theme || { mode: 'system', fontSize: 'medium' }
  };

  res.status(200).json({
    success: true,
    data: {
      preferences: staffPreferences,
      staffCategory: user.staffCategory,
      role: user.role
    }
  });
});

// @desc    Save staff preferences
// @route   PUT /api/staff/preferences
// @access  Private/Staff
exports.saveStaffPreferences = asyncHandler(async (req, res, next) => {
  const { preferences, availability } = req.body;

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'staff' && user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update staff preferences', 403));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }

  // Update preferences
  if (preferences) {
    if (preferences.workPreferences) {
      user.preferences.workPreferences = preferences.workPreferences;
    }
  }

  if (availability) {
    user.preferences.availability = availability;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: {
      preferences: user.preferences,
      staffCategory: user.staffCategory
    },
    message: 'Staff preferences saved successfully'
  });
});

// @desc    Update staff notifications
// @route   PUT /api/staff/notifications
// @access  Private/Staff
exports.updateStaffNotifications = asyncHandler(async (req, res, next) => {
  const notifications = req.body;

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'staff' && user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }

  // Update notifications
  user.preferences.notifications = {
    ...user.preferences.notifications,
    ...notifications
  };

  await user.save();

  res.status(200).json({
    success: true,
    data: user.preferences.notifications,
    message: 'Notification settings updated successfully'
  });
});

// @desc    Save all staff settings
// @route   PUT /api/staff/save-all-preferences
// @access  Private/Staff
exports.saveAllStaffPreferences = asyncHandler(async (req, res, next) => {
  const { notifications, language, theme, preferences, availability } = req.body;

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  if (user.role !== 'staff' && user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }

  // Update all preferences
  if (notifications) {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...notifications
    };
  }

  if (language) {
    user.preferences.language = {
      ...user.preferences.language,
      ...language
    };
  }

  if (theme) {
    user.preferences.theme = {
      ...user.preferences.theme,
      ...theme
    };
  }

  if (preferences?.workPreferences) {
    user.preferences.workPreferences = preferences.workPreferences;
  }

  if (availability) {
    user.preferences.availability = availability;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.preferences,
    message: 'All settings saved successfully'
  });
});

// @desc    Update staff profile
// @route   PUT /api/staff/profile
// @access  Private/Staff
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { name, phone, emergencyContact, address, department, designation } = req.body;

  const staff = await Staff.findOne({ user: req.user.id });
  
  if (!staff) {
    return next(new ErrorResponse('Staff profile not found', 404));
  }

  // Update user profile
  const user = await User.findById(req.user.id);
  if (user) {
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (address) user.address = address;
    await user.save();
  }

  // Update staff profile
  if (department) staff.department = department;
  if (designation) staff.designation = designation;
  await staff.save();

  res.status(200).json({
    success: true,
    data: {
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        emergencyContact: user.emergencyContact,
        address: user.address
      },
      staff: {
        department: staff.department,
        designation: staff.designation,
        employeeId: staff.employeeId
      }
    },
    message: 'Profile updated successfully'
  });
});

// @desc    Change staff password
// @route   PUT /api/staff/password
// @access  Private/Staff
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    message: 'Password updated successfully'
  });
});

// @desc    Export staff data
// @route   POST /api/staff/export-data
// @access  Private/Staff
exports.exportData = asyncHandler(async (req, res, next) => {
  const { type, startDate, endDate } = req.body;

  const staff = await Staff.findOne({ user: req.user.id });
  
  if (!staff) {
    return next(new ErrorResponse('Staff profile not found', 404));
  }

  // Build query for data export
  const query = { assignedTo: staff._id };
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  let data;
  switch (type) {
    case 'reports':
      data = await Report.find(query)
        .populate('reportedBy', 'name')
        .select('-__v');
      break;
    case 'tasks':
      data = await Task.find(query)
        .populate('createdBy', 'name')
        .select('-__v');
      break;
    case 'all':
      const reports = await Report.find(query).select('-__v');
      const tasks = await Task.find(query).select('-__v');
      data = { reports, tasks };
      break;
    default:
      return next(new ErrorResponse('Invalid export type', 400));
  }

  res.status(200).json({
    success: true,
    data,
    message: 'Data exported successfully'
  });
});

// @desc    Clear staff work history
// @route   DELETE /api/staff/history
// @access  Private/Staff
exports.clearHistory = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({ user: req.user.id });
  
  if (!staff) {
    return next(new ErrorResponse('Staff profile not found', 404));
  }

  // You can implement soft delete or archive here
  // For now, just reset counters
  staff.totalTasks = 0;
  staff.completedTasks = 0;
  staff.efficiency = 0;
  staff.assignedReports = [];
  staff.assignedTasks = [];
  await staff.save();

  res.status(200).json({
    success: true,
    message: 'Work history cleared successfully'
  });
});

// @desc    Delete staff account
// @route   DELETE /api/staff/account
// @access  Private/Staff
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { confirmation } = req.body;

  if (confirmation !== 'DELETE STAFF ACCOUNT') {
    return next(new ErrorResponse('Confirmation text does not match', 400));
  }

  const staff = await Staff.findOne({ user: req.user.id });
  
  if (!staff) {
    return next(new ErrorResponse('Staff profile not found', 404));
  }

  // Soft delete staff
  staff.isActive = false;
  staff.deletedAt = Date.now();
  await staff.save();

  // Update user role
  const user = await User.findById(req.user.id);
  if (user) {
    user.role = 'user';
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Staff account deleted successfully'
  });
});

// Get reports eligible for gallery upload (completed, assigned to staff, no gallery images)
exports.getGalleryEligibleReports = async (req, res) => {
  try {
    // Get all completed and approved reports assigned to this staff
    const reports = await Report.find({
      assignedTo: req.user._id,
      status: 'completed'
    })
    .populate('user', 'name email avatar')
    .populate('assignedTo', 'name email avatar')
    .select('title description category status images galleryImages location createdAt')
    .sort({ completedAt: -1 });

    // Filter reports: only return those that have at least one before image 
    // that hasn't had both before and after images uploaded
    const eligibleReports = reports.filter(report => {
      if (!report.images || report.images.length === 0) {
        return false; // No images to upload
      }

      // Check if there's at least one image from report.images[] that hasn't been fully uploaded yet
      const hasEligibleImages = report.images.some(reportImage => {
        // Check if this specific image already has a completed gallery entry (both before and after)
        const hasCompleteGalleryEntry = report.galleryImages && report.galleryImages.some(galleryImg => 
          galleryImg.beforeImage.originalImageId?.toString() === reportImage._id.toString() &&
          galleryImg.status !== 'rejected' // Include approved and pending, exclude rejected
        );
        
        return !hasCompleteGalleryEntry;
      });

      return hasEligibleImages;
    });

    res.json({
      success: true,
      data: eligibleReports,
      count: eligibleReports.length
    });
  } catch (error) {
    console.error('Get gallery eligible reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Upload gallery images (before/after pair)
// Upload gallery images (before/after pair)
exports.uploadGalleryImages = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { beforeImageId, afterCaption } = req.body;
    const afterImageFile = req.file;

    // Validate inputs
    if (!beforeImageId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Before image ID is required' 
      });
    }

    if (!afterImageFile) {
      return res.status(400).json({ 
        success: false, 
        error: 'After image file is required' 
      });
    }

    // Find report
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Check if staff is assigned to this report
    if (report.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to upload gallery images for this report' 
      });
    }

    // Check if report is completed
    if (report.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Report must be completed first before uploading gallery images' 
      });
    }

    // Find before image in report images
    const beforeImage = report.images.find(img => 
      img._id.toString() === beforeImageId
    );

    if (!beforeImage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Before image not found in report' 
      });
    }

    // Upload after image to Cloudinary with error handling
    let afterImageResult;
    try {
      if (!afterImageFile.path && afterImageFile.buffer) {
        afterImageResult = await uploadToCloudinary(afterImageFile.buffer, 'gallery/after', {
          folder: "gallery/after",
          resource_type: "auto"
        });
      } else if (afterImageFile.path) {
        afterImageResult = await uploadToCloudinary(afterImageFile.path, 'gallery/after');
      } else {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid file format' 
        });
      }
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to upload image to Cloudinary: ' + uploadError.message 
      });
    }

    // Create gallery image object
    const galleryImage = {
      beforeImage: {
        originalImageId: beforeImage._id,
        url: beforeImage.url,
        public_id: beforeImage.public_id,
        caption: beforeImage.caption || 'Before work',
        uploadedBy: report.user,
        uploadedAt: beforeImage.uploadedAt || report.createdAt
      },
      afterImage: {
        url: afterImageResult.secure_url,
        public_id: afterImageResult.public_id,
        caption: afterCaption || 'After completion',
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
        mimetype: afterImageFile.mimetype,
        size: afterImageFile.size || afterImageResult.bytes
      },
      status: 'pending',
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    // Initialize galleryImages array if it doesn't exist
    if (!report.galleryImages) {
      report.galleryImages = [];
    }

    // Check if this before image already has a pending gallery entry
    const existingIndex = report.galleryImages.findIndex(
      img => img.beforeImage.originalImageId.toString() === beforeImageId && img.status === 'pending'
    );

    if (existingIndex !== -1) {
      // Update existing entry
      report.galleryImages[existingIndex] = galleryImage;
    } else {
      // Add new gallery image
      report.galleryImages.push(galleryImage);
    }

    await report.save();

    try {
      // Create notification for admin (wrapped in try-catch to prevent blocking the response)
      await createNotification({
        user: req.user._id,
        type: 'progress_update',
        title: 'New Gallery Images Uploaded',
        message: `${req.user.name} uploaded gallery images for: ${report.title}`,
        data: { 
          reportId: report._id, 
          galleryImageId: galleryImage._id || report.galleryImages[report.galleryImages.length - 1]._id 
        },
        recipients: ['admin']
      });
    } catch (notifError) {
      console.warn('Notification creation error (non-fatal):', notifError);
      // Continue with response even if notification fails
    }

    res.json({
      success: true,
      message: 'Gallery images uploaded successfully. Awaiting admin approval.',
      data: {
        galleryImage: galleryImage._id ? galleryImage : report.galleryImages[report.galleryImages.length - 1],
        report: {
          _id: report._id,
          title: report.title,
          category: report.category
        }
      }
    });

  } catch (error) {
    console.error('Upload gallery images error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get staff's gallery upload history
exports.getMyGalleryUploads = async (req, res) => {
  try {
    const reports = await Report.find({
      'galleryImages.uploadedBy': req.user._id
    })
    .select('title category status galleryImages location createdAt')
    .sort({ 'galleryImages.uploadedAt': -1 });

    // Extract all gallery images uploaded by this staff
    const galleryUploads = reports.flatMap(report => 
      report.galleryImages
        .filter(img => img.uploadedBy.toString() === req.user._id.toString())
        .map(img => ({
          ...img.toObject(),
          report: {
            _id: report._id,
            title: report.title,
            category: report.category,
            location: report.location
          }
        }))
    );

    res.json({
      success: true,
      data: galleryUploads,
      count: galleryUploads.length
    });
  } catch (error) {
    console.error('Get my gallery uploads error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get gallery upload stats for staff
exports.getGalleryUploadStats = async (req, res) => {
  try {
    const reports = await Report.find({
      'galleryImages.uploadedBy': req.user._id
    });

    const allGalleryImages = reports.flatMap(report => 
      report.galleryImages.filter(img => img.uploadedBy.toString() === req.user._id.toString())
    );

    const stats = {
      totalUploads: allGalleryImages.length,
      pending: allGalleryImages.filter(img => img.status === 'pending').length,
      approved: allGalleryImages.filter(img => img.status === 'approved').length,
      rejected: allGalleryImages.filter(img => img.status === 'rejected').length,
      featured: allGalleryImages.filter(img => img.featured).length,
      byCategory: {},
      byMonth: {}
    };

    // Calculate by category
    reports.forEach(report => {
      const categoryImages = report.galleryImages.filter(
        img => img.uploadedBy.toString() === req.user._id.toString()
      );
      
      if (categoryImages.length > 0) {
        if (!stats.byCategory[report.category]) {
          stats.byCategory[report.category] = 0;
        }
        stats.byCategory[report.category] += categoryImages.length;
      }
    });

    // Calculate by month
    const currentYear = new Date().getFullYear();
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      const monthUploads = allGalleryImages.filter(img => {
        const uploadDate = new Date(img.uploadedAt);
        return uploadDate >= monthStart && uploadDate <= monthEnd;
      }).length;
      
      stats.byMonth[monthStart.toLocaleString('default', { month: 'short' })] = monthUploads;
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get gallery upload stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};