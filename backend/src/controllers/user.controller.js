const User = require('../models/User');
const Report = require('../models/Report');
const Donation = require('../models/Donation');
const Feedback = require('../models/Feedback');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, role, isActive, search } = req.query;
  
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

  const users = await User.find(query)
    .select('-password')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check authorization
  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this user', 401));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check authorization
  if (req.user.id !== user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this user', 401));
  }

  // Fields that can be updated
  const updatableFields = [
    'name', 'phone', 'address', 'city', 'state', 'pincode',
    'avatar', 'preferences'
  ];

  // Admins can update more fields
  if (req.user.role === 'admin') {
    updatableFields.push('email', 'isActive', 'staffCategory');
  }

  // Filter request body
  const filteredBody = {};
  updatableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      filteredBody[field] = req.body[field];
    }
  });

  user = await User.findByIdAndUpdate(req.params.id, filteredBody, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    data: user,
    message: 'User updated successfully'
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Prevent deleting admin accounts
  if (user.role === 'admin') {
    return next(new ErrorResponse('Cannot delete admin accounts', 400));
  }

  // Soft delete - mark as inactive
  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    data: {},
    message: 'User deactivated successfully'
  });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role, staffCategory } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Validate role
  if (!['citizen', 'staff', 'admin'].includes(role)) {
    return next(new ErrorResponse('Invalid role', 400));
  }

  // Validate staff category if role is staff
  if (role === 'staff') {
    const validCategories = ['pothole', 'lighting', 'drainage', 'garbage', 'signage'];
    if (!staffCategory || !validCategories.includes(staffCategory)) {
      return next(new ErrorResponse('Valid staff category is required', 400));
    }
    user.staffCategory = staffCategory;
  } else {
    user.staffCategory = null;
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
    message: `User role updated to ${role}`
  });
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const [
    totalUsers,
    activeUsers,
    usersByRole,
    userGrowth,
    topContributors,
    userActivity
  ] = await Promise.all([
    // Total users
    User.countDocuments(),
    
    // Active users
    User.countDocuments({ isActive: true }),
    
    // Users by role
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    
    // User growth (last 30 days)
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
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
      { $sort: { _id: 1 } }
    ]),
    
    // Top contributors
    Report.aggregate([
      {
        $group: {
          _id: '$user',
          reportsSubmitted: { $sum: 1 },
          reportsResolved: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { reportsSubmitted: -1 } },
      { $limit: 10 },
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
          reportsSubmitted: 1,
          reportsResolved: 1,
          resolutionRate: {
            $multiply: [
              { $divide: ['$reportsResolved', '$reportsSubmitted'] },
              100
            ]
          }
        }
      }
    ]),
    
    // User activity (recent logins)
    User.find({ lastLogin: { $ne: null } })
      .select('name email role lastLogin loginCount')
      .sort('-lastLogin')
      .limit(10)
  ]);

  const stats = {
    total: totalUsers,
    active: activeUsers,
    byRole: usersByRole,
    growth: userGrowth,
    topContributors,
    recentActivity: userActivity,
    summary: {
      activeRate: ((activeUsers / totalUsers) * 100).toFixed(1),
      avgLogins: userActivity.reduce((sum, user) => sum + user.loginCount, 0) / userActivity.length
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// In your user controller file, add this function:

// @desc    Sync user stats with reports
// @route   PUT /api/users/:userId/sync-stats
// @access  Private
exports.syncUserStats = asyncHandler(async (req, res, next) => {
  const userId = req.params.userId;
  
  // Only allow users to sync their own stats or admin to sync any
  if (req.user.role !== 'admin' && req.user.id !== userId) {
    return next(new ErrorResponse('Not authorized to sync stats', 403));
  }

  // Count user's reports with all possible status variations
  const totalReports = await Report.countDocuments({ user: userId });
  
  const completedReports = await Report.countDocuments({ 
    user: userId, 
    status: { 
      $in: ['completed', 'resolved', 'Completed', 'Resolved'] 
    } 
  });
  
  const pendingReports = await Report.countDocuments({ 
    user: userId, 
    status: { 
      $in: ['pending', 'Pending'] 
    } 
  });
  
  const inProgressReports = await Report.countDocuments({ 
    user: userId, 
    status: { 
      $in: ['in_progress', 'inProgress', 'In Progress'] 
    } 
  });

  // Update user stats
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        'stats.reportsSubmitted': totalReports,
        'stats.reportsResolved': completedReports,
        'stats.reportsPending': pendingReports,
        'stats.reportsInProgress': inProgressReports,
        'stats.updatedAt': new Date()
      }
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'User stats synced successfully',
    data: {
      reportsSubmitted: totalReports,
      reportsResolved: completedReports,
      reportsPending: pendingReports,
      reportsInProgress: inProgressReports
    }
  });
});

// @desc    Get user activity
// @route   GET /api/users/:id/activity
// @access  Private
exports.getUserActivity = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  // Check authorization
  if (req.user.id !== userId && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to view this user activity', 401));
  }

  const [
    reports,
    donations,
    feedbacks,
    recentActivity
  ] = await Promise.all([
    // User's reports
    Report.find({ user: userId })
      .select('title category status createdAt updatedAt')
      .sort('-updatedAt')
      .limit(10),
    
    // User's donations
    Donation.find({ user: userId, status: 'completed' })
      .select('amount createdAt')
      .sort('-createdAt')
      .limit(10),
    
    // User's feedback
    Feedback.find({ user: userId })
      .populate('report', 'title')
      .select('rating comment createdAt')
      .sort('-createdAt')
      .limit(10),
    
    // Combined activity timeline
    Promise.all([
      Report.find({ user: userId })
        .select('title status createdAt updatedAt')
        .sort('-updatedAt')
        .limit(5),
      Donation.find({ user: userId, status: 'completed' })
        .select('amount createdAt')
        .sort('-createdAt')
        .limit(5),
      Feedback.find({ user: userId })
        .select('rating createdAt')
        .sort('-createdAt')
        .limit(5)
    ]).then(results => {
      const allActivities = [];
      
      // Add reports
      results[0].forEach(report => {
        allActivities.push({
          type: 'report',
          action: `Reported: ${report.title}`,
          status: report.status,
          date: report.createdAt,
          item: report
        });
      });
      
      // Add donations
      results[1].forEach(donation => {
        allActivities.push({
          type: 'donation',
          action: `Donated ₹${donation.amount}`,
          date: donation.createdAt,
          item: donation
        });
      });
      
      // Add feedback
      results[2].forEach(feedback => {
        allActivities.push({
          type: 'feedback',
          action: `Gave ${feedback.rating} star feedback`,
          date: feedback.createdAt,
          item: feedback
        });
      });
      
      // Sort by date
      return allActivities.sort((a, b) => b.date - a.date).slice(0, 15);
    })
  ]);

  const activity = {
    reports,
    donations,
    feedbacks,
    recentActivity,
    summary: {
      totalReports: reports.length,
      totalDonations: donations.length,
      totalFeedback: feedbacks.length,
      avgRating: feedbacks.length > 0
        ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
        : 0
    }
  };

  res.status(200).json({
    success: true,
    data: activity
  });
});