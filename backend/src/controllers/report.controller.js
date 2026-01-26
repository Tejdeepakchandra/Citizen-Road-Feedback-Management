const Report = require('../models/Report');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { uploadToCloudinary } = require('../config/cloudinary');
const { sendEmail } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');
const { emitToSocket } = require('../services/socket.service');
const notificationEmitter = require('../services/notificationEmitter.service');

// Helper function to calculate percentage based on status
const calculatePercentage = (status) => {
  const statusPercentages = {
    'pending': 0,
    'under_review': 10,
    'assigned': 25,
    'in_progress': 50,
    'completed': 100,
    'rejected': 0,
    'closed': 100
  };
  return statusPercentages[status] || 0;
};

// Helper to sort progress updates by timestamp (newest first)
const sortProgressUpdates = (progressUpdates) => {
  if (!progressUpdates || progressUpdates.length === 0) return [];
  return [...progressUpdates].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
};

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
exports.createReport = asyncHandler(async (req, res, next) => {
  console.log('Creating report with body:', req.body);
  console.log('Files received:', req.files);

  const { 
    title, 
    description, 
    category, 
    severity, 
    address, 
    landmark, 
    ward, 
    zone 
  } = req.body;

  // Parse location coordinates from string or object
  let coordinates = { lat: 0, lng: 0 };
  let locationData = {};
  
  try {
    if (req.body.location) {
      if (typeof req.body.location === 'string') {
        locationData = JSON.parse(req.body.location);
      } else {
        locationData = req.body.location;
      }
      
      if (locationData.coordinates) {
        coordinates = {
          lat: parseFloat(locationData.coordinates.lat) || 0,
          lng: parseFloat(locationData.coordinates.lng) || 0
        };
      }
      
      if (!address && locationData.address) {
        req.body.address = locationData.address;
      }
    }
  } catch (error) {
    console.error('Error parsing location:', error);
  }

  // Validate required fields
  if (!title || !title.trim()) {
    return next(new ErrorResponse('Title is required', 400));
  }
  if (!description || !description.trim()) {
    return next(new ErrorResponse('Description is required', 400));
  }
  if (!category || !category.trim()) {
    return next(new ErrorResponse('Category is required', 400));
  }
  if (!req.body.address || !req.body.address.trim()) {
    return next(new ErrorResponse('Address is required', 400));
  }

  // Upload images to Cloudinary
  let images = [];
  if (req.files && req.files.length > 0) {
    console.log(`Uploading ${req.files.length} images to Cloudinary`);
    
    try {
      for (const file of req.files) {
        console.log('Uploading file:', file.originalname);
        
        if (!file.path && file.buffer) {
          const result = await uploadToCloudinary(file.buffer, "reports", {
            folder: "reports",
            resource_type: "auto"
          });
          images.push({
            url: result.secure_url,
            public_id: result.public_id,
            caption: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        } else if (file.path) {
          const result = await uploadToCloudinary(file.path, "reports");
          images.push({
            url: result.secure_url,
            public_id: result.public_id,
            caption: file.originalname,
            mimetype: file.mimetype,
            size: file.size
          });
        } else {
          console.error('File has no path or buffer:', file);
        }
      }
      console.log(`Successfully uploaded ${images.length} images`);
    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
    }
  }

  // Prepare location object
  const location = {
    address: req.body.address.trim(),
    coordinates: {
      lat: coordinates.lat,
      lng: coordinates.lng
    },
    landmark: landmark ? landmark.trim() : '',
    ward: ward ? ward.trim() : '',
    zone: zone ? zone.trim() : ''
  };

  console.log('Creating report with data:', {
    title: title.trim(),
    category: category.trim(),
    severity: severity || 'medium',
    location
  });

  // Create report
  const report = await Report.create({
    user: req.user.id,
    title: title.trim(),
    description: description.trim(),
    category: category.trim(),
    severity: severity || 'medium',
    location,
    images,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceType: req.device?.type || 'desktop'
    }
  });

  // Populate user data
  const populatedReport = await Report.findById(report._id)
    .populate('user', 'name email avatar')
    .lean();

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { 'stats.reportsSubmitted': 1 }
  });

  // Create notification for admin
  try {
    await createNotification({
      user: req.user.id,
      type: 'report_created',
      title: 'New Report Submitted',
      message: `New ${category} report submitted by ${req.user.name}`,
      data: { reportId: report._id },
      recipients: ['admin']
    });
  } catch (notifError) {
    console.error('Notification creation failed:', notifError);
  }

  // Send email to user
  try {
    const userEmailContext = {
      name: req.user.name,
      email: req.user.email,
      reportId: report._id.toString().slice(-8),
      category: report.category,
      title: report.title,
      description: report.description,
      address: report.location.address,
      date: new Date(report.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      severity: report.severity || 'medium',
      landmark: report.location.landmark,
      ward: report.location.ward,
      zone: report.location.zone,
      appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
      supportEmail: 'support@smartroad.com',
      appName: 'Smart Road Management',
      year: new Date().getFullYear()
    };

    await sendEmail({
      to: req.user.email,
      subject: `Report Submitted: #${report._id.toString().slice(-6)} - ${report.title}`,
      template: 'report-submitted',
      context: userEmailContext
    });
    
    console.log(`✅ Email sent to user: ${req.user.email}`);
  } catch (userEmailError) {
    console.error('❌ User email sending failed:', userEmailError);
  }

  // Send email to admin for new report
  try {
    const admins = await User.find({ role: 'admin' }).select('email name');
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        const adminEmailContext = {
          adminName: admin.name,
          reportId: report._id.toString().slice(-8),
          title: report.title,
          category: report.category,
          description: report.description,
          address: report.location.address,
          severity: report.severity || 'medium',
          landmark: report.location.landmark,
          ward: report.location.ward,
          zone: report.location.zone,
          reportedBy: req.user.name,
          date: new Date(report.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
          appName: 'Smart Road Management',
          year: new Date().getFullYear()
        };

        await sendEmail({
          to: admin.email,
          subject: `🚨 New Report Submitted: #${report._id.toString().slice(-6)} - ${report.title}`,
          template: 'admin-report-submitted',
          context: adminEmailContext
        });
        
        console.log(`✅ Admin notification email sent to: ${admin.email}`);
      }
    }
  } catch (adminEmailError) {
    console.error('❌ Admin notification email failed:', adminEmailError);
  }

  // 📬 Emit real-time notification to admins
  try {
    await notificationEmitter.notifyReportSubmitted(report, req.user);
    console.log('✅ Real-time notification emitted to admins');
  } catch (notifError) {
    console.error('❌ Real-time notification failed:', notifError);
  }

  // Emit real-time update
  try {
    emitToSocket('new_report', {
      reportId: report._id,
      userId: req.user.id,
      category: report.category,
      location: report.location.address,
      timestamp: new Date()
    });
  } catch (socketError) {
    console.error('Socket emit failed:', socketError);
  }

  res.status(201).json({
    success: true,
    data: populatedReport,
    message: 'Report submitted successfully'
  });
});

// @desc    Get all reports (with filters)
// @route   GET /api/reports
// @access  Public/Private
exports.getReports = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    category,
    status,
    severity,
    sort = '-createdAt',
    search
  } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  let query = {}; // ✅ REMOVE isPublic

  if (category) query.category = category;
  if (status) query.status = status;
  if (severity) query.severity = severity;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'location.address': { $regex: search, $options: 'i' } }
    ];
  }

  const reports = await Report.find(query)
    .populate('user', 'name email avatar')
    .populate('assignedTo', 'name email staffCategory')
    .populate({
      path: 'progressUpdates.updatedBy',
      select: 'name role avatar'
    })
    .sort(sort)
    .skip(skip)
    .limit(limitNum);

  const total = await Report.countDocuments(query);

  reports.forEach(report => {
    if (report.progressUpdates?.length) {
      report.progressUpdates = sortProgressUpdates(report.progressUpdates);
    }
  });

  res.status(200).json({
    success: true,
    count: reports.length,
    total,
    pages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: reports
  });
});


// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public/Private
exports.getReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate('user', 'name email avatar phone')
    .populate('assignedTo', 'name email staffCategory avatar')
    .populate('assignedBy', 'name email avatar')
    .populate('completedBy', 'name email avatar')
    .populate({
      path: 'progressUpdates.updatedBy',
      select: 'name role avatar'
    })
    .populate('completionDetails.completedBy', 'name role avatar');

  if (!report) {
    return next(new ErrorResponse(`Report not found with id ${req.params.id}`, 404));
  }

  // Sort progress updates by timestamp (newest first)
  if (report.progressUpdates && report.progressUpdates.length > 0) {
    report.progressUpdates = sortProgressUpdates(report.progressUpdates);
  }

  // Increment view count
  await Report.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Get user's reports
// @route   GET /api/reports/user/myreports
// @access  Private
exports.getMyReports = asyncHandler(async (req, res, next) => {
  const { status, category, limit = 20 } = req.query;
  
  let query = { user: req.user.id };
  
  if (status) query.status = status;
  if (category) query.category = category;

  const reports = await Report.find(query)
    .populate('assignedTo', 'name email staffCategory avatar')
    .populate({
      path: 'progressUpdates.updatedBy',
      select: 'name role avatar',
    })
    .sort('-createdAt')
    .limit(parseInt(limit));

  // Sort progress updates in each report
  reports.forEach(report => {
    if (report.progressUpdates && report.progressUpdates.length > 0) {
      report.progressUpdates = sortProgressUpdates(report.progressUpdates);
    }
  });

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports
  });
});

// @desc    Get user activity (reports + feedback)
// @route   GET /api/reports/user/activity/:userId
// @access  Private
exports.getUserActivity = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  // Get user's reports
  const reports = await Report.find({ user: userId })
    .select('title category status createdAt updatedAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Get user's feedback
  const feedback = await Feedback.find({ user: userId })
    .populate('report', 'title')
    .select('rating comment createdAt')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // Combine and format
  const activities = [];

  reports.forEach(report => {
    activities.push({
      type: 'report',
      action: `Reported: ${report.title}`,
      status: report.status,
      date: report.createdAt,
      metadata: {
        reportId: report._id,
        category: report.category
      }
    });
  });

  feedback.forEach(fb => {
    activities.push({
      type: 'feedback',
      action: `Gave ${fb.rating} star feedback`,
      rating: fb.rating,
      date: fb.createdAt,
      metadata: {
        feedbackId: fb._id,
        reportTitle: fb.report?.title
      }
    });
  });

  // Sort by date
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.status(200).json({
    success: true,
    data: activities.slice(0, 15)
  });
});

// @desc    Get recent activities for logged-in user
// @route   GET /api/reports/user/recent-activities
// @access  Private
exports.getRecentActivities = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  
  // Get recent reports
  const recentReports = await Report.find({ user: userId })
    .sort('-createdAt')
    .limit(5)
    .select('title category status createdAt updatedAt');
  
  // Get recent feedback
  const recentFeedback = await Feedback.find({ user: userId })
    .populate('report', 'title')
    .sort('-createdAt')
    .limit(3)
    .select('rating comment createdAt');
  
  // Combine into activities
  const activities = [];
  
  // Helper functions
  const getActivityTitle = (status) => {
    const titles = {
      'pending': 'Report Submitted',
      'in_progress': 'Report In Progress',
      'completed': 'Report Completed',
      'resolved': 'Report Resolved'
    };
    return titles[status] || 'Activity';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };
  
  // Add report activities
  recentReports.forEach(report => {
    let activityType = 'report_created';
    let icon = 'report';
    let color = '#3B82F6';
    
    if (report.status === 'completed' || report.status === 'resolved') {
      activityType = 'report_resolved';
      icon = 'check';
      color = '#10B981';
    } else if (report.status === 'in_progress') {
      activityType = 'report_in_progress';
      icon = 'progress';
      color = '#F59E0B';
    }
    
    activities.push({
      id: report._id,
      type: activityType,
      title: getActivityTitle(report.status),
      description: report.title,
      time: formatTimeAgo(report.updatedAt || report.createdAt),
      icon,
      color,
    });
  });
  
  // Add feedback activities
  recentFeedback.forEach(feedback => {
    activities.push({
      id: feedback._id,
      type: 'feedback_given',
      title: 'Feedback Submitted',
      description: `Rated ${feedback.report?.title || 'a report'} ${feedback.rating} stars`,
      time: formatTimeAgo(feedback.createdAt),
      icon: 'feedback',
      color: '#8B5CF6',
    });
  });
  
  // Sort by time
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  
  res.status(200).json({
    success: true,
    data: activities.slice(0, 6)
  });
});

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private (Owner or Admin)
exports.updateReport = asyncHandler(async (req, res, next) => {
  let report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id ${req.params.id}`, 404));
  }

  // Check ownership or admin privileges
  if (report.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this report', 401));
  }

  // Parse location data if provided
  if (req.body.location) {
    try {
      let locationData = req.body.location;
      if (typeof locationData === 'string') {
        locationData = JSON.parse(locationData);
      }
      
      req.body.location = {
        ...report.location.toObject(),
        ...locationData
      };
    } catch (error) {
      console.error('Error parsing location update:', error);
    }
  }

  // Handle image updates
  if (req.files && req.files.length > 0) {
    const newImages = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, 'reports');
      newImages.push({
        url: result.secure_url,
        public_id: result.public_id,
        caption: file.originalname
      });
    }
    
    req.body.images = [...(report.images || []), ...newImages];
  }

  // Update report
  const updatedReport = await Report.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('user', 'name email avatar');

  res.status(200).json({
    success: true,
    data: updatedReport,
    message: 'Report updated successfully'
  });
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Owner or Admin)
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse(`Report not found with id ${req.params.id}`, 404));
  }

  // Check ownership or admin privileges
  if (report.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this report', 401));
  }

  // Delete images from Cloudinary
  if (report.images && report.images.length > 0) {
    const cloudinary = require('../config/cloudinary');
    for (const image of report.images) {
      try {
        await cloudinary.uploader.destroy(image.public_id);
      } catch (cloudinaryError) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryError);
      }
    }
  }

  await report.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Report deleted successfully'
  });
});

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private (Admin/Staff)
exports.updateReportStatus = asyncHandler(async (req, res, next) => {
  const { status, description } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  const oldStatus = report.status;
  report.status = status;
  
  // Update main progress field based on status
  if (report.progress === undefined) {
    report.progress = calculatePercentage(status);
  }

  // Add progress update
  const progressUpdate = {
    status: status,
    description: description || `Status changed from ${oldStatus} to ${status}`,
    percentage: calculatePercentage(status),
    updatedBy: req.user.id,
    timestamp: new Date()
  };

  report.progressUpdates.push(progressUpdate);
  await report.save();

  // Create notification for user
  if (report.user.toString() !== req.user.id) {
    try {
      await createNotification({
        user: req.user.id,
        type: 'status_update',
        title: 'Report Status Updated',
        message: `Your report status changed from ${oldStatus} to ${status}`,
        data: { reportId: report._id, oldStatus, newStatus: status },
        recipients: [report.user]
      });

      // Send email to user
      await sendEmail({
        to: report.user.email,
        subject: 'Report Status Updated',
        template: 'user-status-updated',
        context: {
          name: report.user.name,
          reportId: report._id.toString().slice(-8),
          title: report.title,
          status: status,
          progress: report.progress || calculatePercentage(status),
          updateDescription: description || `Status changed from ${oldStatus} to ${status}`,
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
          appName: 'Smart Road Feedback',
          year: new Date().getFullYear()
        }
      });
    } catch (error) {
      console.error('Notification/email failed:', error);
    }
  }

  // Emit real-time update
  try {
    emitToSocket('status_updated', {
      reportId: report._id,
      userId: report.user,
      oldStatus,
      newStatus: status,
      updatedBy: req.user.id,
      timestamp: new Date()
    });
  } catch (socketError) {
    console.error('Socket emit failed:', socketError);
  }

  res.status(200).json({
    success: true,
    data: report,
    message: 'Status updated successfully'
  });
});

// @desc    Add progress update
// @route   POST /api/reports/:id/progress
// @access  Private (Staff/Admin)
exports.addProgressUpdate = asyncHandler(async (req, res, next) => {
  const { description, percentage } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  // Check if user is assigned staff or admin
  if (report.assignedTo?.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this report', 401));
  }

  let images = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        // Handle both file path and buffer
        let result;
        if (!file.path && file.buffer) {
          result = await uploadToCloudinary(file.buffer, "progress", {
            folder: "progress",
            resource_type: "auto"
          });
        } else if (file.path) {
          result = await uploadToCloudinary(file.path, "progress");
        } else {
          console.error('File has no path or buffer:', file);
          continue;
        }
        
        images.push({
          url: result.secure_url,
          public_id: result.public_id,
          caption: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
          uploadedBy: req.user.id
        });
      } catch (uploadError) {
        console.error('Error uploading progress image:', uploadError);
        // Continue with other files even if one fails
      }
    }
  }

  // Use the provided percentage or keep current
  const progressValue = parseInt(percentage) || report.progress || calculatePercentage(report.status);
  
  // Update main progress field
  report.progress = progressValue;

  const progressUpdate = {
    status: report.status,
    description: description || 'Progress update added',
    images,
    percentage: progressValue,
    updatedBy: req.user.id,
    timestamp: new Date()
  };

  report.progressUpdates.push(progressUpdate);
  await report.save();

  // Send progress update email to user/citizen
  try {
    await sendEmail({
      to: report.user.email,
      subject: `📊 Progress Update: ${report.title}`,
      template: 'progress-update',
      context: {
        name: report.user.name,
        reportId: report._id.toString().slice(-8),
        title: report.title,
        progress: progressValue,
        progressPercentage: `${progressValue}%`,
        updateDescription: description || 'Progress update added by staff',
        staffName: req.user.name,
        date: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        appName: 'Smart Road Feedback',
        year: new Date().getFullYear()
      }
    });
    console.log(`✅ Progress update email sent to user: ${report.user.email}`);
  } catch (emailError) {
    console.error('❌ Progress update email failed:', emailError);
  }

  // Send progress update email to all admins
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('email name');
    for (const admin of admins) {
      try {
        await sendEmail({
          to: admin.email,
          subject: `📊 Progress Update: ${report.title}`,
          template: 'progress-update',
          context: {
            name: admin.name,
            reportId: report._id.toString().slice(-8),
            title: report.title,
            progress: progressValue,
            progressPercentage: `${progressValue}%`,
            updateDescription: description || 'Progress update added by staff',
            staffName: req.user.name,
            reporterName: report.user.name,
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
            appName: 'Smart Road Feedback',
            year: new Date().getFullYear()
          }
        });
        console.log(`✅ Progress update email sent to admin: ${admin.email}`);
      } catch (err) {
        console.error(`❌ Progress update email failed for admin ${admin.email}:`, err);
      }
    }
  } catch (emailError) {
    console.error('❌ Failed to send progress update emails to admins:', emailError);
  }

  // Create notifications
  try {
    await createNotification({
      user: req.user.id,
      type: 'progress_update',
      title: 'Progress Update Added',
      message: `${req.user.name} added a progress update for report #${report._id}`,
      data: { reportId: report._id, progressId: progressUpdate._id },
      recipients: ['admin', report.user]
    });
  } catch (error) {
    console.error('Notification creation failed:', error);
  }

  // 📬 Emit real-time notification to admin & user
  try {
    const populatedReport = await Report.findById(report._id).populate('user');
    await notificationEmitter.notifyProgressUpdate(
      populatedReport,
      req.user,
      progressValue,
      description || 'Progress update added by staff'
    );
    console.log('✅ Real-time progress notification emitted');
  } catch (notifError) {
    console.error('❌ Real-time notification failed:', notifError);
  }

  // Emit real-time update
  try {
    emitToSocket('progress_updated', {
      reportId: report._id,
      progressUpdate,
      updatedBy: req.user.id,
      timestamp: new Date()
    });
  } catch (socketError) {
    console.error('Socket emit failed:', socketError);
  }

  res.status(200).json({
    success: true,
    data: progressUpdate,
    message: 'Progress update added successfully'
  });
});

// @desc    Assign report to staff
// @route   PUT /api/reports/:id/assign
// @access  Private/Admin
exports.assignReport = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { staffId, dueDate, notes } = req.body;

  const report = await Report.findById(id);
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  const staff = await User.findById(staffId);
  if (!staff || staff.role !== 'staff') {
    return next(new ErrorResponse('Invalid staff member', 400));
  }

  // Check if staff category matches report category
  if (staff.staffCategory !== report.category) {
    return next(new ErrorResponse(`Staff member is not assigned to ${report.category} category`, 400));
  }

  // Update report
  report.assignedTo = staffId;
  report.assignedBy = req.user.id;
  report.status = 'assigned';
  report.assignmentDate = new Date();
  report.dueDate = dueDate ? new Date(dueDate) : null;
  report.assignmentNotes = notes;
  
  // Update progress to assigned percentage
  report.progress = 25;

  await report.save();


  try {
    await sendEmail({
      to: staff.email,
      subject: `New Task Assigned: ${report.title}`,
      template: 'report-assigned',
      context: {
        staffName: staff.name,
        reportId: report._id.toString().slice(-8),
        title: report.title,
        category: report.category,
        priority: report.severity,
        location: report.location?.address,
        dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : null,
        assignedBy: req.user.name,
        appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
        year: new Date().getFullYear()
      }
    });
    console.log(`✅ Assignment email sent to staff: ${staff.email}`);
  } catch (emailError) {
    console.error('❌ Assignment email failed:', emailError);
  }

  // Create notification
  try {
    await createNotification({
      user: req.user.id,
      type: 'report_assigned',
      title: 'New Report Assigned',
      message: `You have been assigned to handle report: "${report.title}"`,
      data: {
        reportId: report._id,
        reportTitle: report.title,
        category: report.category,
        priority: report.priority,
        location: report.location?.address,
        dueDate: dueDate
      },
      recipients: [staffId],
      priority: 'high'
    });
  } catch (notifError) {
    console.error('Notification service error:', notifError);
  }

  // 📬 Emit real-time notification to staff
  try {
    await notificationEmitter.notifyTaskAssigned(report, staff);
    console.log('✅ Real-time notification emitted to staff');
  } catch (notifError) {
    console.error('❌ Real-time notification failed:', notifError);
  }

  res.status(200).json({
    success: true,
    message: 'Report assigned successfully',
    data: await report.populate([
      { path: 'user', select: 'name email avatar' },
      { path: 'assignedTo', select: 'name email avatar staffCategory' },
      { path: 'assignedBy', select: 'name email avatar' },
    ]),
  });
});

// @desc    Get reports by staff category
// @route   GET /api/reports/category/:category
// @access  Private/Admin
exports.getReportsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { status, priority, page = 1, limit = 20 } = req.query;

  let query = { category };

  if (status && status !== 'all') {
    query.status = status;
  }

  if (priority && priority !== 'all') {
    query.priority = priority;
  }

  const skip = (page - 1) * limit;

  const reports = await Report.find(query)
    .populate('user', 'name email avatar')
    .populate('assignedTo', 'name email avatar staffCategory')
    .populate({
      path: 'progressUpdates.updatedBy',
      select: 'name role avatar',
      options: { limit: 1, sort: { timestamp: -1 } }
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Report.countDocuments(query);

  // Sort progress updates
  reports.forEach(report => {
    if (report.progressUpdates && report.progressUpdates.length > 0) {
      report.progressUpdates = sortProgressUpdates(report.progressUpdates);
    }
  });

  res.status(200).json({
    success: true,
    count: reports.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: reports,
  });
});

// @desc    Get staff performance stats
// @route   GET /api/reports/staff/performance
// @access  Private/Admin
exports.getStaffPerformance = asyncHandler(async (req, res) => {
  const performance = await Report.aggregate([
    {
      $match: {
        assignedTo: { $ne: null },
        status: { $in: ['completed', 'in_progress'] },
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        totalAssigned: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] },
        },
        avgCompletionTime: { $avg: '$completionTime' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'staff',
      },
    },
    { $unwind: '$staff' },
    {
      $project: {
        staffId: '$_id',
        staffName: '$staff.name',
        staffCategory: '$staff.staffCategory',
        totalAssigned: 1,
        completed: 1,
        inProgress: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalAssigned', 0] },
            { $multiply: [{ $divide: ['$completed', '$totalAssigned'] }, 100] },
            0,
          ],
        },
        avgCompletionTime: 1,
      },
    },
    { $sort: { completed: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: performance,
  });
});

// @desc    Update report progress
// @route   PUT /api/reports/:id/progress
// @access  Private/Staff



// @desc    Get nearby reports
// @route   GET /api/reports/nearby
// @access  Public
exports.getNearbyReports = asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 5, limit = 20 } = req.query;

  if (!lat || !lng) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }

  const coordinates = [parseFloat(lng), parseFloat(lat)];

  const reports = await Report.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    },
    isPublic: true,
    status: { $ne: 'completed' }
  })
  .limit(parseInt(limit))
  .select('title category severity location status createdAt progress')
  .lean();

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports
  });
});

// @desc    Upvote report
// @route   PUT /api/reports/:id/upvote
// @access  Private
exports.upvoteReport = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  // Check if user already upvoted
  const alreadyUpvoted = report.upvotes.includes(req.user.id);

  if (alreadyUpvoted) {
    // Remove upvote
    report.upvotes.pull(req.user.id);
    report.upvoteCount -= 1;
  } else {
    // Add upvote
    report.upvotes.push(req.user.id);
    report.upvoteCount += 1;
  }

  await report.save();

  res.status(200).json({
    success: true,
    data: {
      upvoted: !alreadyUpvoted,
      upvoteCount: report.upvoteCount
    },
    message: alreadyUpvoted ? 'Upvote removed' : 'Report upvoted successfully'
  });
});

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const { text } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  const comment = {
    user: req.user.id,
    text: text || '',
    createdAt: new Date()
  };

  report.comments.push(comment);
  await report.save();

  // Emit real-time update
  try {
    emitToSocket('comment_added', {
      reportId: report._id,
      comment,
      userId: req.user.id,
      timestamp: new Date()
    });
  } catch (socketError) {
    console.error('Socket emit failed:', socketError);
  }

  res.status(200).json({
    success: true,
    data: comment,
    message: 'Comment added successfully'
  });
});

// @desc    Get report statistics for dashboard
// @route   GET /api/reports/stats/dashboard
// @access  Private (Admin)
exports.getReportStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today.setDate(today.getDate() - 7));
  const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));

  const [
    totalReports,
    pendingReports,
    inProgressReports,
    completedReports,
    todayReports,
    weekReports,
    monthReports,
    categoryStats,
    severityStats,
    statusStats
  ] = await Promise.all([
    Report.countDocuments(),
    Report.countDocuments({ status: 'pending' }),
    Report.countDocuments({ status: 'in_progress' }),
    Report.countDocuments({ status: 'completed' }),
    Report.countDocuments({ createdAt: { $gte: startOfToday } }),
    Report.countDocuments({ createdAt: { $gte: startOfWeek } }),
    Report.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]),
    Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);

  // Calculate average resolution time
  const completedWithDates = await Report.find({
    status: 'completed',
    actualCompletion: { $exists: true }
  }).select('createdAt actualCompletion');

  const avgResolutionTime = completedWithDates.length > 0
    ? completedWithDates.reduce((acc, report) => {
        const days = (report.actualCompletion - report.createdAt) / (1000 * 60 * 60 * 24);
        return acc + days;
      }, 0) / completedWithDates.length
    : 0;

  res.status(200).json({
    success: true,
    data: {
      totalReports,
      pendingReports,
      inProgressReports,
      completedReports,
      todayReports,
      weekReports,
      monthReports,
      categoryStats,
      severityStats,
      statusStats,
      avgResolutionTime: avgResolutionTime.toFixed(1),
      completionRate: totalReports > 0 ? ((completedReports / totalReports) * 100).toFixed(1) : 0
    }
  });
});

// @desc    Staff completes task for admin review
// @route   PUT /api/reports/:id/complete-for-review
// @access  Private (Staff)
exports.completeForReview = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { completionNotes } = req.body;

  const report = await Report.findById(id);
  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  // Check if user is assigned to this report
  if (report.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to complete this report', 403));
  }

  // Upload completion images
  let afterImages = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, "completion");
      afterImages.push({
        url: result.secure_url,
        public_id: result.public_id,
        caption: file.originalname,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      });
    }
  }

  // Update report with needsReview flag
  report.status = 'completed';
  report.progress = 100;
  report.staffCompletedAt = new Date();
  report.staffCompletedBy = req.user.id;
  report.completionNotes = completionNotes;
  report.needsReview = true; // THIS IS CRITICAL
  report.updatedAt = new Date();

  if (afterImages.length > 0) {
    report.afterImages = afterImages;
  }

  // Add final progress update
  report.progressUpdates.push({
    status: 'completed',
    description: completionNotes || 'Work completed by staff, awaiting admin review',
    percentage: 100,
    updatedBy: req.user.id,
    timestamp: new Date()
  });

  await report.save();

  // Send admin review notification email
  try {
    const admins = await User.find({ role: 'admin' }).select('email name');
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `📋 Task Ready for Review: ${report.title}`,
        template: 'admin-task-completed',
        context: {
          adminName: admin.name,
          reportId: report._id.toString().slice(-8),
          title: report.title,
          category: report.category,
          staffName: req.user.name,
          status: 'Under Review',
          completionDate: report.staffCompletedAt.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          completionTime: report.staffCompletedAt.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          completionNotes: completionNotes || 'Task completed by staff member',
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
          appName: 'Smart Road Feedback',
          year: new Date().getFullYear()
        }
      });
    }
    console.log(`✅ Task completion review email sent to all admins`);
  } catch (emailError) {
    console.error('❌ Task completion email failed:', emailError);
  }

  // Create notification for admin
  try {
    await createNotification({
      user: req.user.id,
      type: 'report_needs_review',
      title: 'Report Completed - Needs Review',
      message: `${req.user.name} has completed report "${report.title}" and it requires admin review.`,
      data: {
        reportId: report._id,
        staffId: req.user.id,
        staffName: req.user.name,
        beforeImages: report.images,
        afterImages: report.afterImages,
        needsReview: true
      },
      recipients: ['admin']
    });
  } catch (error) {
    console.error('Notification failed:', error);
  }

  // 📬 Emit real-time notification to admins
  try {
    await notificationEmitter.notifyTaskForReview(report, req.user);
    console.log('✅ Real-time task review notification emitted to admins');
  } catch (notifError) {
    console.error('❌ Real-time notification failed:', notifError);
  }

  res.status(200).json({
    success: true,
    data: report,
    message: 'Report completed successfully. Awaiting admin review.'
  });
});

// @desc    Admin approves staff completion
// @route   PUT /api/reports/:id/approve
// @access  Private (Admin)
exports.approveCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    // Check if report needs review
    if (!report.needsReview) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report does not need review' 
      });
    }
    
    // Check if already approved or rejected
    if (report.adminApproved) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report already approved' 
      });
    }
    
    if (report.adminRejected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report already rejected' 
      });
    }
    
    // Admin approves
    report.needsReview = false;
    report.adminApproved = true;
    report.adminRejected = false;
    report.adminNotes = adminNotes;
    report.approvedAt = new Date();
    report.approvedBy = req.user.id;
    report.actualCompletion = new Date(); // Official completion date
    
    // Add progress update for admin approval
    report.progressUpdates.push({
      progress: 100,
      description: `Admin approved: ${adminNotes || 'Task approved'}`,
      updatedBy: req.user.id,
      timestamp: new Date(),
      percentage: 100
    });
    
    await report.save();
    

     try {
      const resolutionTime = report.completionTime 
        ? `${report.completionTime.toFixed(1)} hours` 
        : 'N/A';
      
      await sendEmail({
        to: report.user.email,
        subject: `Your Report Has Been Resolved: ${report.title}`,
        template: 'user-report-completed',
        context: {
          name: report.user.name,
          reportId: report._id.toString().slice(-8),
          title: report.title,
          category: report.category,
          location: report.location?.address,
          staffName: report.assignedTo?.name || 'Our team',
          resolutionTime: resolutionTime,
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          appUrl: process.env.CLIENT_URL || 'http://localhost:3000'
        }
      });
      console.log(`✅ Report resolved email sent to user: ${report.user.email}`);
    } catch (emailError) {
      console.error('❌ Report resolved email failed:', emailError);
    }

    // Send staff approval email
    if (report.assignedTo) {
      try {
        await sendEmail({
          to: report.assignedTo.email,
          subject: `✅ Your Task Has Been Approved: ${report.title}`,
          template: 'staff-task-approved',
          context: {
            staffName: report.assignedTo.name,
            reportId: report._id.toString().slice(-8),
            title: report.title,
            category: report.category,
            status: 'Completed',
            approvedBy: req.user.name,
            adminNotes: adminNotes || 'Great work on this task!',
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
            appName: 'Smart Road Feedback',
            year: new Date().getFullYear()
          }
        });
        console.log(`✅ Task approval email sent to staff: ${report.assignedTo.email}`);
      } catch (emailError) {
        console.error('❌ Task approval email failed:', emailError);
      }
    }

    // Notify staff that their work was approved
    try {
      await createNotification({
        user: req.user.id,
        type: 'task_approved',
        title: 'Task Approved by Admin',
        message: `Admin approved your completed task: ${report.title}`,
        data: { reportId: report._id },
        recipients: [report.assignedTo]
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }

    // 📬 Emit real-time notification to staff & user
    try {
      const populatedReport = await Report.findById(report._id)
        .populate('assignedTo')
        .populate('user');
      await notificationEmitter.notifyTaskApproved(populatedReport, req.user);
      console.log('✅ Real-time task approval notification emitted');
    } catch (notifError) {
      console.error('❌ Real-time notification failed:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Report approved successfully',
      data: report
    });
    
  } catch (error) {
    console.error('Approve completion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.rejectCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    // Check if report needs review
    if (!report.needsReview) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report does not need review' 
      });
    }
    
    // Check if already approved or rejected
    if (report.adminApproved) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report already approved' 
      });
    }
    
    if (report.adminRejected) {
      return res.status(400).json({ 
        success: false, 
        error: 'Report already rejected' 
      });
    }
    
    // Admin rejects
    report.needsReview = false;
    report.adminApproved = false;
    report.adminRejected = true;
    report.status = 'in_progress'; // Return to in progress
    report.progress = 75; // Set progress back
    report.rejectionReason = rejectionReason;
    report.rejectedAt = new Date();
    report.rejectedBy = req.user.id;
    
    // Add rejection update
    report.progressUpdates.push({
      progress: 75,
      description: `Admin rejected: ${rejectionReason || 'Needs revision'}`,
      updatedBy: req.user.id,
      timestamp: new Date(),
      percentage: 75
    });
    
    await report.save();
    
    // Send staff revision request email
    if (report.assignedTo) {
      try {
        await sendEmail({
          to: report.assignedTo.email,
          subject: `🔄 Revision Required: ${report.title}`,
          template: 'staff-needs-revision',
          context: {
            staffName: report.assignedTo.name,
            reportId: report._id.toString().slice(-8),
            title: report.title,
            category: report.category,
            status: 'Needs Revision',
            reviewedBy: req.user.name,
            rejectionReason: rejectionReason || 'Please review and make necessary corrections',
            adminNotes: rejectionReason || 'The admin has requested changes to this task',
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
            appName: 'Smart Road Feedback',
            year: new Date().getFullYear()
          }
        });
        console.log(`✅ Revision request email sent to staff: ${report.assignedTo.email}`);
      } catch (emailError) {
        console.error('❌ Revision request email failed:', emailError);
      }
    }
    
    // Notify staff that their work was rejected
    try {
      await createNotification({
        user: req.user.id,
        type: 'task_rejected',
        title: 'Task Needs Revision',
        message: `Admin requested revision for: ${report.title}. Reason: ${rejectionReason}`,
        data: { reportId: report._id },
        recipients: [report.assignedTo]
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }

    // 📬 Emit real-time notification to staff
    try {
      const populatedReport = await Report.findById(report._id)
        .populate('assignedTo');
      await notificationEmitter.notifyRevisionRequested(
        populatedReport,
        req.user,
        rejectionReason || 'Please review and make necessary corrections'
      );
      console.log('✅ Real-time revision request notification emitted');
    } catch (notifError) {
      console.error('❌ Real-time notification failed:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Report rejected and returned to in progress',
      data: report
    });
    
  } catch (error) {
    console.error('Reject completion error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
// In your report.controller.js, ensure you have these endpoints:

// For staff to update progress
// Remove these duplicate functions and use this one instead:
exports.updateReportProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, description, status } = req.body;
    
    // Find the report
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    // Check if user is assigned to this report
    if (report.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to update this report' 
      });
    }
    
    // Update progress
    if (progress !== undefined) {
      report.progress = progress;
    }

    if (status) {
      report.status = status;
      if (status === 'completed') {
        report.completedAt = new Date();
        report.completedBy = req.user.id;
        // Calculate completion time in hours
        if (report.assignedDate) {
          const assignedDate = new Date(report.assignedDate);
          const completedDate = new Date();
          report.completionTime = (completedDate - assignedDate) / (1000 * 60 * 60); // hours
        }
      }
    }
    
    // Upload images to Cloudinary if any (using the same pattern as createReport)
    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} images to Cloudinary for progress update`);
      
      for (const file of req.files) {
        try {
          // Use the uploadToCloudinary function (expects file.path)
          if (!file.path) {
            console.error('File has no path:', file.originalname);
            continue;
          }
          
          const result = await uploadToCloudinary(file.path, "progress-updates");
          
          uploadedImages.push({
            url: result.secure_url,
            public_id: result.public_id,
            caption: description || 'Progress update image',
            uploadedAt: new Date(),
            uploadedBy: req.user.id,
            mimetype: file.mimetype,
            size: file.size || result.bytes
          });
          console.log('Successfully uploaded progress image:', result.secure_url);
        } catch (uploadError) {
          console.error('Failed to upload progress image:', uploadError);
          // Continue with other images even if one fails
        }
      }
    }
    
    // Add progress update history with images
    if (description || uploadedImages.length > 0) {
      const progressUpdate = {
        progress: report.progress,
        status: report.status,
        description: description || `Progress updated to ${report.progress}%`,
        updatedBy: req.user.id,
        timestamp: new Date(),
        percentage: report.progress
      };
      
      // Add images to progress update if any
      if (uploadedImages.length > 0) {
        progressUpdate.images = uploadedImages;
      }
      
      report.progressUpdates.push(progressUpdate);
    }
    
    // Also add to main images array for backward compatibility
    if (uploadedImages.length > 0) {
      report.images.push(...uploadedImages);
    }
    
    await report.save();


    try {
      await sendEmail({
        to: report.user.email,
        subject: `Progress Update: ${report.title}`,
        template: 'progress-update',
        context: {
          name: report.user.name,
          reportId: report._id.toString().slice(-8),
          title: report.title,
          status: report.status,
          progress: report.progress,
          description: description || 'Work is progressing',
          imageCount: uploadedImages.length,
          updatedBy: req.user.name,
          date: new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          appUrl: process.env.CLIENT_URL || 'http://localhost:3000'
        }
      });
      console.log(`✅ Progress update email sent to user: ${report.user.email}`);
    } catch (emailError) {
      console.error('❌ Progress update email failed:', emailError);
    }
    
    // Create notification for admin/user
    try {
      await createNotification({
        user: req.user.id,
        type: 'progress_update',
        title: 'Report Progress Update',
        message: `Progress updated for report: ${report.title}`,
        data: { 
          reportId: report._id, 
          progress: report.progress,
          imageCount: uploadedImages.length 
        },
        recipients: ['admin', report.user]
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
    
    res.status(200).json({
      success: true,
      data: await report.populate([
        { path: 'user', select: 'name email avatar' },
        { path: 'assignedTo', select: 'name email avatar staffCategory' },
      ]),
      imagesUploaded: uploadedImages.length
    });
    
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, completionNotes } = req.body;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    // Check if user is assigned to this report
    if (report.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to complete this task' 
      });
    }
    
    // Upload completion images to Cloudinary
    const completionImages = [];
    if (req.files && req.files.length > 0) {
      console.log(`Uploading ${req.files.length} completion images to Cloudinary`);
      
      for (const file of req.files) {
        try {
          // Use the uploadToCloudinary function (expects file.path)
          if (!file.path) {
            console.error('File has no path:', file.originalname);
            continue;
          }
          
          const result = await uploadToCloudinary(file.path, "completion");
          
          completionImages.push({
            url: result.secure_url,
            public_id: result.public_id,
            caption: 'Completion image',
            uploadedAt: new Date(),
            uploadedBy: req.user.id,
            mimetype: file.mimetype,
            size: file.size || result.bytes
          });
          console.log('Successfully uploaded completion image:', result.secure_url);
        } catch (uploadError) {
          console.error('Failed to upload completion image:', uploadError);
          // Continue with other images even if one fails
        }
      }
    }
    
    // MARK AS COMPLETED WITH NEEDS REVIEW FLAG
    report.progress = 100;
    report.status = 'completed';
    report.needsReview = true; // CRITICAL: This triggers admin review
    report.adminApproved = false; // Not approved yet
    report.adminRejected = false; // Not rejected
    report.completionNotes = completionNotes;
    report.completedAt = new Date();
    report.completedBy = req.user.id;
    report.staffCompletionTime = new Date(); // Staff completion time
    report.staffCompletedBy = req.user.id; // Staff who completed it
    
    // Calculate completion time in hours
    if (report.assignedDate) {
      const assignedDate = new Date(report.assignedDate);
      const completedDate = new Date();
      report.completionTime = (completedDate - assignedDate) / (1000 * 60 * 60); // hours
    }
    
    // Add completion progress update with images
    const progressUpdate = {
      progress: 100,
      description: description || 'Task marked as completed (Awaiting admin review)',
      updatedBy: req.user.id,
      timestamp: new Date(),
      percentage: 100
    };
    
    // Add completion images to progress update
    if (completionImages.length > 0) {
      progressUpdate.images = completionImages;
    }
    
    report.progressUpdates.push(progressUpdate);
    
    // Also add to main images array for backward compatibility
    if (completionImages.length > 0) {
      report.images.push(...completionImages);
    }
    
    // Store completion images separately for easy access
    if (completionImages.length > 0) {
      report.completionImages = completionImages;
    }
    
    await report.save();
    

    try {
      const admins = await User.find({ role: 'admin' }).select('email name');
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `📋 Task Completed - Needs Review: ${report.title}`,
          template: 'admin-task-completed',
          context: {
            adminName: admin.name,
            reportId: report._id.toString().slice(-8),
            title: report.title,
            category: report.category,
            staffName: req.user.name,
            status: 'Under Review',
            completionDate: report.staffCompletionTime.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            completionTime: report.staffCompletionTime.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            }),
            completionNotes: completionNotes,
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }),
            appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
            appName: 'Smart Road Feedback',
            year: new Date().getFullYear()
          }
        });
        console.log(`✅ Task completion email sent to admin: ${admin.email}`);
      }
    } catch (emailError) {
      console.error('❌ Task completion email failed:', emailError);
    }
    
    // Create notification for admin
    try {
      await createNotification({
        user: req.user.id,
        type: 'task_completed',
        title: 'Task Completed - Needs Review',
        message: `${req.user.name} has completed task: ${report.title}`,
        data: { 
          reportId: report._id,
          imageCount: completionImages.length,
          hasImages: completionImages.length > 0
        },
        recipients: ['admin']
      });
    } catch (error) {
      console.error('Notification failed:', error);
    }
    
    res.json({
      success: true,
      message: 'Task marked as completed and sent for admin review',
      data: report,
      imagesUploaded: completionImages.length
    });
    
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// NEW: For gallery image upload (staff uploads before/after pairs)
// Add this to your report controller
exports.uploadGalleryImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      beforeImageId, // ID of user's image from report.images
      beforeCaption, 
      afterCaption 
    } = req.body;
    
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    // Check if user is assigned to this report
    if (report.assignedTo.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Not authorized to upload gallery images' 
      });
    }
    
    // Find the before image from user's images
    const beforeImage = report.images.find(img => 
      img._id.toString() === beforeImageId
    );
    
    if (!beforeImage) {
      return res.status(400).json({ 
        success: false, 
        error: 'Before image not found in report' 
      });
    }
    
    // Check if after image is uploaded
    if (!req.file || !req.file.path) {
      return res.status(400).json({ 
        success: false, 
        error: 'After image is required' 
      });
    }
    
    // Upload after image to Cloudinary
    let afterImageData;
    try {
      const result = await uploadToCloudinary(req.file.path, "gallery/after");
      
      afterImageData = {
        url: result.secure_url,
        public_id: result.public_id,
        caption: afterCaption || 'After completion',
        uploadedAt: new Date(),
        uploadedBy: req.user.id,
        mimetype: req.file.mimetype,
        size: req.file.size || result.bytes
      };
    } catch (uploadError) {
      console.error('Failed to upload after image:', uploadError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to upload after image' 
      });
    }
    
    // Create gallery image pair
    const galleryImage = {
      beforeImage: {
        originalImageId: beforeImage._id,
        url: beforeImage.url,
        public_id: beforeImage.public_id,
        caption: beforeCaption || beforeImage.caption || 'Before',
        uploadedBy: report.user,
        uploadedAt: report.createdAt
      },
      afterImage: afterImageData,
      status: 'pending',
      uploadedAt: new Date(),
      uploadedBy: req.user.id
    };
    
    // Add to galleryImages array
    report.galleryImages.push(galleryImage);
    
    await report.save();
    
    res.json({
      success: true,
      message: 'Gallery images uploaded successfully. Awaiting admin approval.',
      data: {
        galleryImage,
        reportId: report._id
      }
    });
    
  } catch (error) {
    console.error('Upload gallery images error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};