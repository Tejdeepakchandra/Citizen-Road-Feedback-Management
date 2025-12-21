const User = require('../models/User');
const Report = require('../models/Report');
const Donation = require('../models/Donation');
const Feedback = require('../models/Feedback');
const BeforeAfter = require('../models/BeforeAfter');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const { createNotification } = require('../services/notification.service');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  // Get current date and calculate ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Run all queries in parallel
  const [
    totalUsers,
    totalReports,
    totalDonations,
    totalFeedback,
    recentUsers,
    recentReports,
    recentDonations,
    usersByRole,
    reportsByStatus,
    reportsByCategory,
    donationsByStatus,
    topDonors,
    activeStaff,
    pendingImages,
    financialStats
  ] = await Promise.all([
    // Total counts
    User.countDocuments({ isActive: true }),
    Report.countDocuments(),
    Donation.countDocuments({ status: 'completed' }),
    Feedback.countDocuments(),

    // Recent activity (last 7 days)
    User.countDocuments({ 
      createdAt: { $gte: lastWeek },
      isActive: true 
    }),
    Report.countDocuments({ createdAt: { $gte: lastWeek } }),
    Donation.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: lastWeek } 
    }),

    // Users by role
    User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),

    // Reports by status
    Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Reports by category
    Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]),

    // Donations by status
    Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    // Top donors (last 30 days)
    Donation.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: lastMonth }
        } 
      },
      {
        $group: {
          _id: '$user',
          totalAmount: { $sum: '$amount' },
          donationCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          avatar: '$userInfo.avatar',
          totalAmount: 1,
          donationCount: 1
        }
      }
    ]),

    // Active staff members
    User.find({ 
      role: 'staff', 
      isActive: true 
    })
      .select('name email staffCategory avatar lastLogin')
      .limit(5),

    // Pending image approvals
    BeforeAfter.countDocuments({ status: 'pending' }),

    // Financial stats
    Donation.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  // Get user growth data for charts (last 30 days)
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonth },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);

  // Get report trends for charts (last 30 days)
  const reportTrends = await Report.aggregate([
    {
      $match: {
        createdAt: { $gte: lastMonth }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 30 }
  ]);

  // Format the response
  const dashboardData = {
    summary: {
      totalUsers,
      totalReports,
      totalDonations: financialStats[0]?.count || 0,
      totalFeedback,
      pendingImages,
      activeUsers: await User.countDocuments({ 
        isActive: true,
        lastLogin: { $gte: lastWeek }
      })
    },
    recentActivity: {
      newUsers: recentUsers,
      newReports: recentReports,
      newDonations: recentDonations
    },
    analytics: {
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      reportsByStatus: reportsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      reportsByCategory: reportsByCategory.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      donationsByStatus: donationsByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    },
    financial: {
      totalRevenue: financialStats[0]?.totalAmount || 0,
      averageDonation: financialStats[0]?.averageAmount || 0,
      minDonation: financialStats[0]?.minAmount || 0,
      maxDonation: financialStats[0]?.maxAmount || 0,
      totalTransactions: financialStats[0]?.count || 0,
      topDonors
    },
    charts: {
      userGrowth,
      reportTrends
    },
    activeStaff,
    timestamp: new Date().toISOString()
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 20, 
    role, 
    isActive, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  let query = {};
  
  // Apply filters
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === 'true';
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const users = await User.find(query)
    .select('-password')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  // Get user stats
  const stats = await Promise.all([
    User.countDocuments({ role: 'citizen', isActive: true }),
    User.countDocuments({ role: 'staff', isActive: true }),
    User.countDocuments({ role: 'admin', isActive: true }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.countDocuments({ emailVerified: true })
  ]);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    stats: {
      total: stats[0] + stats[1] + stats[2],
      citizens: stats[0],
      staff: stats[1],
      admins: stats[2],
      active: stats[3],
      inactive: stats[4],
      verified: stats[5]
    },
    data: users
  });
});
// In admin.controller.js, add these functions:

// @desc    Get user by ID (admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id)
    .select('-password')
    .lean();

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Get user statistics
  const [
    reportsCount,
    donationsCount,
    feedbackCount,
    totalDonated
  ] = await Promise.all([
    Report.countDocuments({ user: id }),
    Donation.countDocuments({ user: id, status: 'completed' }),
    Feedback.countDocuments({ user: id }),
    Donation.aggregate([
      { $match: { user: mongoose.Types.ObjectId(id), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  const userStats = {
    reports: reportsCount,
    donations: donationsCount,
    feedback: feedbackCount,
    totalDonated: totalDonated[0]?.total || 0,
    completedReports: await Report.countDocuments({ 
      user: id, 
      status: { $in: ['completed', 'resolved'] } 
    })
  };

  res.status(200).json({
    success: true,
    data: {
      ...user,
      stats: userStats
    }
  });
});

// @desc    Get user statistics (admin only)
// @route   GET /api/admin/users/:id/stats
// @access  Private/Admin
// In admin.controller.js - fix the getUserStats function
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Verify user exists
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  try {
    // Get basic counts
    const totalReports = await Report.countDocuments({ user: id });
    const completedReports = await Report.countDocuments({ 
      user: id, 
      status: { $in: ['completed', 'resolved'] } 
    });
    
    const totalDonations = await Donation.countDocuments({ 
      user: id, 
      status: 'completed' 
    });
    
    const totalFeedback = await Feedback.countDocuments({ user: id });
    
    // Calculate total donated
    const donationTotal = await Donation.aggregate([
      { 
        $match: { 
          user: new mongoose.Types.ObjectId(id), 
          status: 'completed' 
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        reports: totalReports || 0,
        completedReports: completedReports || 0,
        donations: totalDonations || 0,
        feedback: totalFeedback || 0,
        totalDonated: donationTotal[0]?.total || 0
      }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user statistics'
    });
  }
});

// @desc    Create new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    email, 
    password, 
    role = 'citizen',
    phone,
    address,
    city,
    state,
    pincode,
    staffCategory,
    isActive = true
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Validate staff category for staff role
  if (role === 'staff' && !staffCategory) {
    return next(new ErrorResponse('Staff category is required for staff role', 400));
  }

  // Validate staff category
  if (role === 'staff' && !['pothole', 'lighting', 'drainage', 'garbage', 'signage'].includes(staffCategory)) {
    return next(new ErrorResponse('Invalid staff category', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    address,
    city,
    state,
    pincode,
    staffCategory: role === 'staff' ? staffCategory : null,
    isActive,
    emailVerified: role === 'staff' || role === 'admin' ? true : false
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: user.getFormattedUser()
  });
});

// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  // Find user
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent changing admin role for non-admin users
  if (user.role === 'admin' && updates.role && updates.role !== 'admin') {
    return next(new ErrorResponse('Cannot change admin role', 400));
  }

  // Validate staff category if changing to staff
  if (updates.role === 'staff' && updates.staffCategory) {
    const validCategories = ['pothole', 'lighting', 'drainage', 'garbage', 'signage'];
    if (!validCategories.includes(updates.staffCategory)) {
      return next(new ErrorResponse('Invalid staff category', 400));
    }
  }

  // Remove password from updates
  delete updates.password;
  
  // If changing role to staff, set email verified
  if (updates.role === 'staff' || updates.role === 'admin') {
    updates.emailVerified = true;
  }

  // Update user
  Object.keys(updates).forEach(key => {
    user[key] = updates[key];
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: user.getFormattedUser()
  });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (id === req.user.id) {
    return next(new ErrorResponse('Cannot delete your own account', 400));
  }

  const user = await User.findById(id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deleting admin accounts
  if (user.role === 'admin') {
    return next(new ErrorResponse('Cannot delete admin accounts', 400));
  }

  // Soft delete
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully'
  });
});

// @desc    Toggle user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return next(new ErrorResponse('isActive must be a boolean', 400));
  }

  const user = await User.findById(id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deactivating admin accounts
  if (user.role === 'admin' && !isActive) {
    return next(new ErrorResponse('Cannot deactivate admin accounts', 400));
  }

  // Prevent deactivating yourself
  if (id === req.user.id && !isActive) {
    return next(new ErrorResponse('Cannot deactivate your own account', 400));
  }

  user.isActive = isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    data: user.getFormattedUser()
  });
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { role, staffCategory } = req.body;

  const user = await User.findById(id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Validate role
  if (!['citizen', 'staff', 'admin'].includes(role)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  // Prevent changing admin role
  if (user.role === 'admin' && role !== 'admin') {
    return next(new ErrorResponse('Cannot change admin role', 400));
  }

  // Validate staff category if role is staff
  if (role === 'staff') {
    const validCategories = ['pothole', 'lighting', 'drainage', 'garbage', 'signage'];
    if (!staffCategory || !validCategories.includes(staffCategory)) {
      return next(new ErrorResponse('Valid staff category is required', 400));
    }
    user.staffCategory = staffCategory;
    user.emailVerified = true; // Auto-verify staff
  } else {
    user.staffCategory = null;
  }

  user.role = role;
  
  // Auto-verify admin accounts
  if (role === 'admin') {
    user.emailVerified = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    data: user.getFormattedUser()
  });
});

// @desc    Get pending image approvals
// @route   GET /api/admin/images/pending
// @access  Private/Admin
exports.getPendingImages = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const pendingImages = await BeforeAfter.find({ status: 'pending' })
    .populate('report', 'title description category location status user')
    .populate('staff', 'name email avatar staffCategory')
    .populate({
      path: 'report',
      populate: {
        path: 'user',
        select: 'name email avatar'
      }
    })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await BeforeAfter.countDocuments({ status: 'pending' });

  res.status(200).json({
    success: true,
    count: pendingImages.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: pendingImages
  });
});

// @desc    Approve image
// @route   PUT /api/admin/images/:id/approve
// @access  Private/Admin
exports.approveImage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { featured = false, caption } = req.body;

  const image = await BeforeAfter.findById(id)
    .populate('report', 'title user status')
    .populate('staff', 'name email');

  if (!image) {
    return next(new ErrorResponse('Image not found', 404));
  }

  if (image.status !== 'pending') {
    return next(new ErrorResponse('Image is not pending approval', 400));
  }

  // Update image
  image.status = 'approved';
  image.approvedAt = new Date();
  image.approvedBy = req.user.id;
  image.featured = featured;
  if (caption) image.caption = caption;

  await image.save();

  // Update report status if needed
  if (image.report && image.report.status !== 'completed') {
    await Report.findByIdAndUpdate(image.report._id, {
      status: 'completed',
      completedAt: new Date()
    });
  }

  // TODO: Send notification to citizen and staff

  res.status(200).json({
    success: true,
    message: 'Image approved successfully',
    data: image
  });
});

// @desc    Reject image
// @route   PUT /api/admin/images/:id/reject
// @access  Private/Admin
exports.rejectImage = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return next(new ErrorResponse('Please provide a reason for rejection', 400));
  }

  const image = await BeforeAfter.findById(id)
    .populate('staff', 'name email');

  if (!image) {
    return next(new ErrorResponse('Image not found', 404));
  }

  if (image.status !== 'pending') {
    return next(new ErrorResponse('Image is not pending approval', 400));
  }

  // Update image
  image.status = 'rejected';
  image.rejectedAt = new Date();
  image.rejectedBy = req.user.id;
  image.rejectionReason = reason;

  await image.save();

  // TODO: Send notification to staff with rejection reason

  res.status(200).json({
    success: true,
    message: 'Image rejected successfully',
    data: image
  });
});

// @desc    Get system health
// @route   GET /api/admin/system/health
// @access  Private/Admin
exports.getSystemHealth = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalReports,
    totalDonations,
    recentUsers,
    recentReports,
    recentDonations,
    activeSessions,
    pendingTasks
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Report.countDocuments(),
    Donation.countDocuments({ status: 'completed' }),
    User.countDocuments({ 
      createdAt: { $gte: oneHourAgo },
      isActive: true 
    }),
    Report.countDocuments({ createdAt: { $gte: oneHourAgo } }),
    Donation.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: oneHourAgo } 
    }),
    User.countDocuments({ lastLogin: { $gte: oneHourAgo } }),
    BeforeAfter.countDocuments({ status: 'pending' })
  ]);

  const healthData = {
    users: {
      total: totalUsers,
      recent: recentUsers,
      activeSessions
    },
    reports: {
      total: totalReports,
      recent: recentReports,
      growthRate: recentReports / (totalReports || 1) * 100
    },
    donations: {
      total: totalDonations,
      recent: recentDonations,
      growthRate: recentDonations / (totalDonations || 1) * 100
    },
    tasks: {
      pendingApprovals: pendingTasks
    },
    system: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    timestamp: now.toISOString(),
    status: 'healthy'
  };

  res.status(200).json({
    success: true,
    data: healthData
  });
});

// @desc    Get admin activity log
// @route   GET /api/admin/activity
// @access  Private/Admin
exports.getAdminActivity = asyncHandler(async (req, res, next) => {
  const { limit = 20 } = req.query;

  // Get recent reports
  const recentReports = await Report.find()
    .populate('user', 'name email avatar')
    .sort('-createdAt')
    .limit(5);

  // Get recent users
  const recentUsers = await User.find()
    .select('name email role avatar createdAt')
    .sort('-createdAt')
    .limit(5);

  // Get recent donations
  const recentDonations = await Donation.find({ status: 'completed' })
    .populate('user', 'name email avatar')
    .sort('-createdAt')
    .limit(5);

  // Get recent image approvals
  const recentImages = await BeforeAfter.find({ status: 'approved' })
    .populate('report', 'title')
    .populate('staff', 'name')
    .populate('approvedBy', 'name')
    .sort('-approvedAt')
    .limit(5);

  // Format as activity log
  const activities = [
    ...recentReports.map(report => ({
      type: 'report',
      action: 'created',
      title: `New Report: ${report.title}`,
      user: report.user,
      timestamp: report.createdAt,
      details: {
        category: report.category,
        status: report.status,
        priority: report.priority
      }
    })),
    ...recentUsers.map(user => ({
      type: 'user',
      action: 'registered',
      title: `New ${user.role}: ${user.name}`,
      user: user,
      timestamp: user.createdAt,
      details: {
        role: user.role
      }
    })),
    ...recentDonations.map(donation => ({
      type: 'donation',
      action: 'completed',
      title: `Donation: ₹${donation.amount}`,
      user: donation.user,
      timestamp: donation.createdAt,
      details: {
        amount: donation.amount,
        paymentMethod: donation.paymentMethod
      }
    })),
    ...recentImages.map(image => ({
      type: 'image',
      action: 'approved',
      title: `Image Approved: ${image.report?.title || 'Report'}`,
      user: image.approvedBy,
      timestamp: image.approvedAt,
      details: {
        staff: image.staff?.name,
        featured: image.featured
      }
    }))
  ];

  // Sort by timestamp
  activities.sort((a, b) => b.timestamp - a.timestamp);

  res.status(200).json({
    success: true,
    count: activities.length,
    data: activities.slice(0, parseInt(limit))
  });
});

// @desc    Review and resolve staff completed tasks
// @route   PUT /api/admin/tasks/:taskId/resolve
// @access  Private (Admin)
exports.resolveTask = asyncHandler(async (req, res, next) => {
  const { taskId } = req.params;
  const { 
    resolutionNotes, 
    verificationNotes, 
    finalImages,
    publicNotes 
  } = req.body;

  const task = await Report.findById(taskId)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email staffCategory');

  if (!task) {
    return next(new ErrorResponse('Task not found', 404));
  }

  if (task.status !== 'completed') {
    return next(new ErrorResponse('Task is not completed yet', 400));
  }

  // Handle final images upload (admin verification images)
  let uploadedFinalImages = [];
  if (req.files && req.files.finalImages) {
    const files = Array.isArray(req.files.finalImages) 
      ? req.files.finalImages 
      : [req.files.finalImages];
    
    for (const file of files) {
      try {
        const result = await uploadToS3(file, 'verification-images');
        uploadedFinalImages.push({
          url: result.Location,
          key: result.Key,
          type: 'verification',
          description: 'Admin verification image',
          uploadedAt: new Date(),
          uploadedBy: req.user.id
        });
      } catch (error) {
        console.error('Error uploading verification image:', error);
      }
    }
  }

  // Update task status
  task.status = 'resolved';
  task.resolvedAt = new Date();
  task.resolvedBy = req.user.id;
  task.resolutionNotes = resolutionNotes;
  task.verificationNotes = verificationNotes;
  task.publicNotes = publicNotes;
  task.updatedAt = new Date();

  // Add admin verification images
  if (uploadedFinalImages.length > 0) {
    task.verificationImages = uploadedFinalImages;
  }

  // Add resolution update
  task.progressUpdates.push({
    status: 'resolved',
    description: resolutionNotes || 'Task resolved by admin',
    percentage: 100,
    updatedBy: req.user.id,
    timestamp: new Date(),
    images: uploadedFinalImages,
    isAdminUpdate: true
  });

  await task.save();

  // Send notification to user
  await Notification.sendUserNotification(task.user._id, {
    type: 'REPORT_RESOLVED',
    title: 'Your Report Has Been Resolved!',
    message: `Great news! Your report "${task.title}" has been resolved by our team.`,
    data: {
      reportId: task._id,
      resolutionNotes: publicNotes || resolutionNotes,
      beforeImages: task.beforeImages,
      afterImages: task.afterImages,
      verificationImages: uploadedFinalImages
    }
  });

  // Send notification to staff
  if (task.assignedTo) {
    await Notification.sendUserNotification(task.assignedTo._id, {
      type: 'TASK_RESOLVED',
      title: 'Your Task Has Been Approved!',
      message: `Admin has approved and resolved your task "${task.title}". Great work!`,
      data: {
        taskId: task._id,
        adminNotes: resolutionNotes
      }
    });
  }

  // Update staff stats
  await User.findByIdAndUpdate(task.assignedTo._id, {
    $inc: {
      'stats.resolvedTasks': 1,
      'stats.totalTasksCompleted': 1
    },
    $set: {
      lastTaskCompleted: new Date()
    }
  });

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task resolved successfully'
  });
});

// @desc    Get tasks pending admin review
// @route   GET /api/admin/tasks/pending-review
// @access  Private (Admin)
exports.getPendingReviewTasks = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, category, staffCategory } = req.query;

  const query = {
    status: 'completed',
    resolvedAt: null
  };

  if (category) query.category = category;
  if (staffCategory) {
    // Find staff with this category and get their IDs
    const staff = await User.find({ staffCategory, role: 'staff' }).select('_id');
    const staffIds = staff.map(s => s._id);
    query.assignedTo = { $in: staffIds };
  }

  const tasks = await Report.find(query)
    .select('title category priority assignedAt actualCompletion beforeImages afterImages user assignedTo')
    .populate('user', 'name email')
    .populate('assignedTo', 'name staffCategory phone')
    .sort('-actualCompletion')
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
// In adminController.js
// @desc    Approve staff completion
// @route   PUT /api/admin/reports/:id/approve-completion
// @access  Private (Admin)
exports.approveStaffCompletion = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { adminNotes } = req.body;

  const report = await Report.findById(id);

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  // Check if it needs review
  if (!report.needsReview || report.status !== 'completed') {
    return next(new ErrorResponse('This report does not need review', 400));
  }

  // Approve the completion
  report.needsReview = false;
  report.adminApproved = true;
  report.approvedBy = req.user.id;
  report.approvedAt = new Date();
  report.adminNotes = adminNotes;
  report.actualCompletion = new Date(); // Now set the actual completion
  report.status = 'completed'; // Keep as completed

  await report.save();

  res.status(200).json({
    success: true,
    data: report,
    message: 'Staff completion approved successfully'
  });
});

// @desc    Reject staff completion
// @route   PUT /api/admin/reports/:id/reject-completion
// @access  Private (Admin)
exports.rejectStaffCompletion = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  const report = await Report.findById(id);

  if (!report) {
    return next(new ErrorResponse('Report not found', 404));
  }

  // Check if it needs review
  if (!report.needsReview || report.status !== 'completed') {
    return next(new ErrorResponse('This report does not need review', 400));
  }

  // Reject and send back to staff
  report.needsReview = false;
  report.adminRejected = true;
  report.rejectedBy = req.user.id;
  report.rejectedAt = new Date();
  report.rejectionReason = rejectionReason;
  report.status = 'in_progress'; // Send back to in progress
  report.progress = 75; // Reset progress a bit

  // Add rejection to progress updates
  report.progressUpdates.push({
    status: 'in_progress',
    description: `Admin rejected completion: ${rejectionReason}`,
    percentage: 75,
    updatedBy: req.user.id,
    timestamp: new Date()
  });

  await report.save();

  res.status(200).json({
    success: true,
    data: report,
    message: 'Staff completion rejected. Task returned to in progress.'
  });
});


// Get pending gallery images for approval
exports.getPendingGalleryImages = async (req, res) => {
  try {
    const reports = await Report.find({
      'galleryImages.status': 'pending'
    })
    .populate('user', 'name email avatar')
    .populate('assignedTo', 'name email avatar')
    .populate('galleryImages.uploadedBy', 'name email avatar')
    .select('title description category status location galleryImages createdAt')
    .sort({ 'galleryImages.uploadedAt': 1 }); // Oldest first

    // Transform the response to flatten gallery images with report context
    const galleryImages = [];
    reports.forEach(report => {
      report.galleryImages.forEach(galleryImg => {
        if (galleryImg.status === 'pending') {
          galleryImages.push({
            ...galleryImg.toObject ? galleryImg.toObject() : galleryImg,
            _id: galleryImg._id,
            report: {
              _id: report._id,
              title: report.title,
              description: report.description,
              category: report.category,
              status: report.status,
              location: report.location,
              createdAt: report.createdAt
            }
          });
        }
      });
    });

    res.json({
      success: true,
      data: galleryImages,
      count: galleryImages.length,
      totalPending: galleryImages.length
    });
  } catch (error) {
    console.error('Get pending gallery images error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Approve gallery image
// In your admin.controller.js - FIXED approveGalleryImage function
// In your admin.controller.js - UPDATED approveGalleryImage function
exports.approveGalleryImage = async (req, res) => {
  try {
    const { reportId, galleryImageId } = req.params;
    const { adminNotes, featured } = req.body;

    console.log('🔵 APPROVE REQUEST:', {
      reportId,
      galleryImageId,
      adminNotes,
      featured,
      user: req.user._id
    });

    // Find report
    const report = await Report.findById(reportId);
    if (!report) {
      console.log('❌ Report not found:', reportId);
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    console.log('✅ Found report:', report._id);
    console.log('📸 Gallery images count:', report.galleryImages?.length || 0);

    // Debug: Log all gallery image IDs
    if (report.galleryImages && report.galleryImages.length > 0) {
      report.galleryImages.forEach((img, index) => {
        console.log(`   [${index}] _id: ${img._id}, status: ${img.status}`);
      });
    }

    // Find gallery image - use .id() method for subdocuments
    const galleryImage = report.galleryImages.id(galleryImageId);
    
    if (!galleryImage) {
      console.log('❌ Gallery image not found with ID:', galleryImageId);
      console.log('Available IDs:', report.galleryImages.map(img => img._id));
      return res.status(404).json({ 
        success: false, 
        error: 'Gallery image not found' 
      });
    }

    console.log('✅ Found gallery image:', {
      _id: galleryImage._id,
      status: galleryImage.status,
      beforeImage: galleryImage.beforeImage?.caption,
      afterImage: galleryImage.afterImage?.caption
    });

    // Check if already processed
    if (galleryImage.status !== 'pending') {
      console.log('⚠️ Image already processed. Status:', galleryImage.status);
      return res.status(400).json({ 
        success: false, 
        error: `Gallery image is already ${galleryImage.status}` 
      });
    }

    // Update gallery image status in Report
    galleryImage.status = 'approved';
    galleryImage.approvedBy = req.user._id;
    galleryImage.approvedAt = new Date();
    galleryImage.featured = featured || false;
    
    if (adminNotes && adminNotes.trim()) {
      galleryImage.adminNotes = adminNotes.trim();
    }

    // Save the report FIRST
    await report.save();
    console.log('💾 Report saved. New status:', galleryImage.status);

    // ===========================================
    // CRITICAL: Create entry in Gallery collection
    // ===========================================
    try {
      const Gallery = require('../models/Gallery');
      
      // Check if gallery entry already exists for this galleryImageId
      const existingGallery = await Gallery.findOne({
        'galleryImageRef': galleryImage._id
      });

      if (existingGallery) {
        console.log('⚠️ Gallery entry already exists, updating...');
        // Update existing entry
        existingGallery.beforeImage = galleryImage.beforeImage;
        existingGallery.afterImage = galleryImage.afterImage;
        existingGallery.title = report.title;
        existingGallery.description = report.description || `${report.category} transformation`;
        existingGallery.category = report.category;
        existingGallery.location = report.location;
        existingGallery.uploadedBy = galleryImage.uploadedBy;
        existingGallery.approvedBy = req.user._id;
        existingGallery.approvedAt = new Date();
        existingGallery.featured = featured || false;
        existingGallery.status = 'active';
        
        await existingGallery.save();
        console.log('✅ Existing gallery entry updated');
      } else {
        // Create new gallery entry
        const newGallery = new Gallery({
          galleryImageRef: galleryImage._id, // Reference to the galleryImage in Report
          report: report._id,
          beforeImage: galleryImage.beforeImage,
          afterImage: galleryImage.afterImage,
          title: report.title,
          description: report.description || `${report.category} transformation`,
          category: report.category,
          location: report.location,
          uploadedBy: galleryImage.uploadedBy,
          approvedBy: req.user._id,
          approvedAt: new Date(),
          featured: featured || false,
          views: 0,
          likes: [],
          likeCount: 0,
          tags: [report.category, 'transformation', 'before-after'],
          status: 'active'
        });

        await newGallery.save();
        console.log('✅ New gallery entry created with ID:', newGallery._id);
        console.log('Gallery data saved:', {
          title: newGallery.title,
          category: newGallery.category,
          featured: newGallery.featured
        });
      }
    } catch (galleryError) {
      console.error('❌ Gallery creation error:', galleryError.message);
      console.error('Gallery error stack:', galleryError.stack);
      // Don't fail the entire request if gallery fails, but log it
    }

    // Return success response
    res.json({
      success: true,
      message: 'Gallery image approved successfully',
      data: {
        galleryImage: {
          _id: galleryImage._id,
          status: galleryImage.status,
          featured: galleryImage.featured,
          approvedAt: galleryImage.approvedAt,
          adminNotes: galleryImage.adminNotes
        },
        report: {
          _id: report._id,
          title: report.title,
          category: report.category
        }
      }
    });

  } catch (error) {
    console.error('❌ Approve gallery image error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// FIXED rejectGalleryImage function
exports.rejectGalleryImage = async (req, res) => {
  try {
    const { reportId, galleryImageId } = req.params;
    const { reason, adminNotes } = req.body; // Added adminNotes

    console.log('Rejecting gallery image:', {
      reportId,
      galleryImageId,
      reason,
      user: req.user._id
    });

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Find the gallery image in the array
    const galleryImage = report.galleryImages.find(
      img => img._id.toString() === galleryImageId
    );

    if (!galleryImage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gallery image not found in report' 
      });
    }

    if (galleryImage.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Gallery image is not in pending status' 
      });
    }

    // Update gallery image status
    galleryImage.status = 'rejected';
    galleryImage.rejectionReason = reason || '';
    galleryImage.rejectedBy = req.user._id;
    galleryImage.rejectedAt = new Date();
    
    // Add admin notes if provided
    if (adminNotes) {
      galleryImage.adminNotes = adminNotes;
    }

    await report.save();

    // Create notification for staff who uploaded
    try {
      await createNotification({
        user: req.user._id,
        type: 'gallery_rejected',
        title: 'Gallery Images Rejected',
        message: `Your gallery images for "${report.title}" have been rejected`,
        data: { 
          reportId: report._id, 
          galleryImageId: galleryImageId,
          reason: reason || ''
        },
        recipients: [galleryImage.uploadedBy.toString()]
      });
    } catch (notificationError) {
      console.error('Error creating rejection notification:', notificationError.message);
    }

    res.json({
      success: true,
      message: 'Gallery image rejected',
      data: {
        galleryImage,
        report: {
          _id: report._id,
          title: report.title
        }
      }
    });
  } catch (error) {
    console.error('Reject gallery image error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get gallery statistics for admin
exports.getGalleryStats = async (req, res) => {
  try {
    const reports = await Report.find({ 'galleryImages': { $exists: true, $not: { $size: 0 } } });
    
    const allGalleryImages = reports.flatMap(report => report.galleryImages);

    const stats = {
      totalImages: allGalleryImages.length,
      pending: allGalleryImages.filter(img => img.status === 'pending').length,
      approved: allGalleryImages.filter(img => img.status === 'approved').length,
      rejected: allGalleryImages.filter(img => img.status === 'rejected').length,
      featured: allGalleryImages.filter(img => img.featured).length,
      byCategory: {},
      byStaff: {},
      byMonth: {},
      approvalRate: 0
    };

    // Calculate by category
    reports.forEach(report => {
      if (!stats.byCategory[report.category]) {
        stats.byCategory[report.category] = 0;
      }
      stats.byCategory[report.category] += report.galleryImages.length;
    });

    // Calculate by staff
    const staffIds = [...new Set(allGalleryImages.map(img => img.uploadedBy.toString()))];
    for (const staffId of staffIds) {
      const staffImages = allGalleryImages.filter(img => img.uploadedBy.toString() === staffId);
      stats.byStaff[staffId] = {
        total: staffImages.length,
        approved: staffImages.filter(img => img.status === 'approved').length,
        pending: staffImages.filter(img => img.status === 'pending').length,
        rejected: staffImages.filter(img => img.status === 'rejected').length
      };
    }

    // Calculate by month
    const currentYear = new Date().getFullYear();
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0);
      
      const monthImages = allGalleryImages.filter(img => {
        const uploadDate = new Date(img.uploadedAt);
        return uploadDate >= monthStart && uploadDate <= monthEnd;
      });
      
      stats.byMonth[monthStart.toLocaleString('default', { month: 'short' })] = {
        total: monthImages.length,
        approved: monthImages.filter(img => img.status === 'approved').length,
        pending: monthImages.filter(img => img.status === 'pending').length
      };
    }

    // Calculate approval rate
    const totalProcessed = stats.approved + stats.rejected;
    if (totalProcessed > 0) {
      stats.approvalRate = Math.round((stats.approved / totalProcessed) * 100);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get gallery stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};