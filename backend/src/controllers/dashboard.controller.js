const Report = require('../models/Report');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Feedback = require('../models/Feedback');
const BeforeAfter = require('../models/BeforeAfter');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require("mongoose");

// @desc    Get citizen dashboard stats
// @route   GET /api/dashboard/citizen
// @access  Private (Citizen)
// Rename getCitizenDashboard to getCitizenStats
exports.getCitizenStats = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const [
    reports,
    donations,
    feedbacks,
    reportStats,
    donationStats
  ] = await Promise.all([
    Report.find({ user: userId }),
    Donation.find({ user: userId, status: 'completed' }),
    Feedback.find({ user: userId }),
    Report.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { 
            $sum: { 
              $cond: [{ 
                $or: [
                  { $eq: ['$status', 'pending'] },
                  { $eq: ['$status', 'Pending'] }
                ]
              }, 1, 0] 
            } 
          },
          inProgress: { 
            $sum: { 
              $cond: [{ 
                $or: [
                  { $eq: ['$status', 'in_progress'] },
                  { $eq: ['$status', 'inProgress'] },
                  { $eq: ['$status', 'In Progress'] }
                ]
              }, 1, 0] 
            } 
          },
          completed: { 
            $sum: { 
              $cond: [{ 
                $or: [
                  { $eq: ['$status', 'completed'] },
                  { $eq: ['$status', 'resolved'] },
                  { $eq: ['$status', 'Completed'] },
                  { $eq: ['$status', 'Resolved'] }
                ]
              }, 1, 0] 
            } 
          },
          byCategory: { $push: '$category' }
        }
      }
    ]),
    Donation.aggregate([
      { $match: { user: userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const reportStatsData = reportStats[0] || {
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    byCategory: []
  };

  // Calculate average resolution time
  const completedReports = reports.filter(r => 
    ['completed', 'resolved', 'Completed', 'Resolved'].includes(r.status) && 
    r.actualCompletion
  );
  
  let avgResolutionTime = 0;
  if (completedReports.length > 0) {
    const totalDays = completedReports.reduce((sum, report) => {
      const days = (report.actualCompletion - report.createdAt) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    avgResolutionTime = totalDays / completedReports.length;
  }

  // Calculate feedback average
  const avgFeedbackRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0;

  const stats = {
    totalReports: reportStatsData.total,
    resolved: reportStatsData.completed, // This includes 'resolved' status
    completed: reportStatsData.completed, // Same as resolved
    pending: reportStatsData.pending,
    inProgress: reportStatsData.inProgress,
    feedbackGiven: feedbacks.length,
    avgResolutionTime: avgResolutionTime.toFixed(1),
    avgFeedbackRating: avgFeedbackRating.toFixed(1),
    totalDonations: donations.length,
    totalDonated: donationStats[0]?.totalAmount || 0,
    categoryDistribution: reportStatsData.byCategory || []
  };

  console.log('Citizen Stats for user:', userId);
  console.log('Total reports:', stats.totalReports);
  console.log('Resolved/completed:', stats.resolved);
  console.log('Pending:', stats.pending);
  console.log('In progress:', stats.inProgress);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Optional: Keep getCitizenDashboard as alias for backward compatibility
exports.getCitizenDashboard = exports.getCitizenStats;

// ... KEEP ALL OTHER FUNCTIONS (getAdminDashboard, getStaffDashboard, getSystemAnalytics)
// ... KEEP ALL HELPER FUNCTIONS (calculateAvgResolutionTime, getUpcomingDeadlines, getDateRange)


// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin/stats
// @access  Private (Admin)
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfToday = new Date(today.setHours(0, 0, 0, 0));
  const startOfWeek = new Date(today.setDate(today.getDate() - 7));
  const startOfMonth = new Date(today.setMonth(today.getMonth() - 1));

  const [
    userStats,
    reportStats,
    donationStats,
    feedbackStats,
    recentReports,
    recentDonations,
    staffPerformance,
    categoryTrends,
    locationHeatmap
  ] = await Promise.all([
    // User Statistics
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } }
        }
      }
    ]),

    // Report Statistics
    Report.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ],
          bySeverity: [
            { $group: { _id: '$severity', count: { $sum: 1 } } }
          ],
          today: [
            { $match: { createdAt: { $gte: startOfToday } } },
            { $count: 'count' }
          ],
          week: [
            { $match: { createdAt: { $gte: startOfWeek } } },
            { $count: 'count' }
          ],
          month: [
            { $match: { createdAt: { $gte: startOfMonth } } },
            { $count: 'count' }
          ]
        }
      }
    ]),

    // Donation Statistics
    Donation.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $facet: {
          total: [
            { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ],
          monthly: [
            { 
              $match: { 
                createdAt: { $gte: startOfMonth } 
              } 
            },
            { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ],
          weekly: [
            { 
              $match: { 
                createdAt: { $gte: startOfWeek } 
              } 
            },
            { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ],
          daily: [
            { 
              $match: { 
                createdAt: { $gte: startOfToday } 
              } 
            },
            { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } }
          ]
        }
      }
    ]),

    // Feedback Statistics
    Feedback.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          byRating: [
            { $group: { _id: '$rating', count: { $sum: 1 } } }
          ],
          bySentiment: [
            { $group: { _id: '$sentiment', count: { $sum: 1 } } }
          ],
          averageRating: [
            { $group: { _id: null, avg: { $avg: '$rating' } } }
          ]
        }
      }
    ]),

    // Recent Reports
    Report.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .sort('-createdAt')
      .limit(10),

    // Recent Donations
    Donation.find({ status: 'completed' })
      .populate('user', 'name email')
      .sort('-createdAt')
      .limit(10),

    // Staff Performance
    Report.aggregate([
      {
        $match: {
          assignedTo: { $exists: true },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$assignedTo',
          completed: { $sum: 1 },
          avgTime: {
            $avg: {
              $divide: [
                { $subtract: ['$actualCompletion', '$assignedAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      { $sort: { completed: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'staff'
        }
      },
      { $unwind: '$staff' },
      {
        $project: {
          staffId: '$_id',
          staffName: '$staff.name',
          staffCategory: '$staff.staffCategory',
          completed: 1,
          avgTime: { $round: ['$avgTime', 1] }
        }
      }
    ]),

    // Category Trends (last 30 days)
    Report.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          data: {
            $push: {
              date: '$_id.day',
              count: '$count'
            }
          }
        }
      }
    ]),

    // Location Heatmap
    Report.aggregate([
      {
        $match: {
          'location.coordinates': { $exists: true },
          status: { $ne: 'completed' }
        }
      },
      {
        $group: {
          _id: {
            lat: { $round: ['$location.coordinates.lat', 2] },
            lng: { $round: ['$location.coordinates.lng', 2] }
          },
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $match: { count: { $gte: 1 } } },
      { $limit: 50 }
    ])
  ]);

  const dashboardData = {
    // User Stats
    users: {
      total: userStats.reduce((sum, item) => sum + item.count, 0),
      citizens: userStats.find(item => item._id === 'citizen')?.count || 0,
      staff: userStats.find(item => item._id === 'staff')?.count || 0,
      admins: userStats.find(item => item._id === 'admin')?.count || 0
    },

    // Report Stats
    reports: {
      total: reportStats[0]?.total[0]?.count || 0,
      today: reportStats[0]?.today[0]?.count || 0,
      week: reportStats[0]?.week[0]?.count || 0,
      month: reportStats[0]?.month[0]?.count || 0,
      byStatus: reportStats[0]?.byStatus || [],
      byCategory: reportStats[0]?.byCategory || [],
      bySeverity: reportStats[0]?.bySeverity || []
    },

    // Donation Stats
    donations: {
      total: {
        amount: donationStats[0]?.total[0]?.amount || 0,
        count: donationStats[0]?.total[0]?.count || 0
      },
      monthly: {
        amount: donationStats[0]?.monthly[0]?.amount || 0,
        count: donationStats[0]?.monthly[0]?.count || 0
      },
      weekly: {
        amount: donationStats[0]?.weekly[0]?.amount || 0,
        count: donationStats[0]?.weekly[0]?.count || 0
      },
      daily: {
        amount: donationStats[0]?.daily[0]?.amount || 0,
        count: donationStats[0]?.daily[0]?.count || 0
      }
    },

    // Feedback Stats
    feedback: {
      total: feedbackStats[0]?.total[0]?.count || 0,
      byRating: feedbackStats[0]?.byRating || [],
      bySentiment: feedbackStats[0]?.bySentiment || [],
      averageRating: feedbackStats[0]?.averageRating[0]?.avg?.toFixed(1) || 0
    },

    // Recent Activity
    recentActivity: {
      reports: recentReports,
      donations: recentDonations
    },

    // Performance
    performance: {
      staff: staffPerformance,
      categoryTrends: categoryTrends,
      locationHeatmap: locationHeatmap
    },

    // System Metrics
    metrics: {
      completionRate: reportStats[0]?.total[0]?.count > 0
        ? ((reportStats[0]?.byStatus.find(s => s._id === 'completed')?.count || 0) / reportStats[0]?.total[0]?.count * 100).toFixed(1)
        : 0,
      avgResolutionTime: calculateAvgResolutionTime(recentReports),
      userSatisfaction: feedbackStats[0]?.averageRating[0]?.avg?.toFixed(1) || 0
    }
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get staff dashboard stats
// @route   GET /api/dashboard/staff/stats
// @access  Private (Staff)
exports.getStaffDashboard = asyncHandler(async (req, res, next) => {
  const staffId = req.user.id;

  const [
    assignedTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    performance,
    recentActivity,
    categoryDistribution
  ] = await Promise.all([
    // Assigned Tasks
    Report.countDocuments({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] }
    }),

    // Completed Tasks
    Report.countDocuments({
      assignedTo: staffId,
      status: 'completed'
    }),

    // In Progress Tasks
    Report.countDocuments({
      assignedTo: staffId,
      status: 'in_progress'
    }),

    // Overdue Tasks
    Report.countDocuments({
      assignedTo: staffId,
      status: { $in: ['assigned', 'in_progress'] },
      estimatedCompletion: { $lt: new Date() }
    }),

    // Performance Stats
    Report.aggregate([
      {
        $match: {
          assignedTo: staffId,
          status: 'completed',
          actualCompletion: { $exists: true }
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
          totalCost: { $sum: '$completionDetails.cost' },
          totalHours: { $sum: '$completionDetails.workHours' }
        }
      }
    ]),

    // Recent Activity
    Report.find({ assignedTo: staffId })
      .select('title category status progressUpdates updatedAt')
      .sort('-updatedAt')
      .limit(5)
      .populate('progressUpdates.updatedBy', 'name'),

    // Category Distribution
    Report.aggregate([
      {
        $match: { assignedTo: staffId }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  const performanceData = performance[0] || {
    totalCompleted: 0,
    avgCompletionTime: 0,
    totalCost: 0,
    totalHours: 0
  };

  const dashboardData = {
    stats: {
      assignedTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate: assignedTasks > 0
        ? ((completedTasks / assignedTasks) * 100).toFixed(1)
        : 0
    },
    performance: {
      totalCompleted: performanceData.totalCompleted,
      avgCompletionTime: performanceData.avgCompletionTime?.toFixed(1) || 0,
      totalCost: performanceData.totalCost || 0,
      totalHours: performanceData.totalHours || 0,
      efficiency: performanceData.totalHours > 0
        ? (performanceData.totalCost / performanceData.totalHours).toFixed(2)
        : 0
    },
    recentActivity: recentActivity.flatMap(report => 
      report.progressUpdates.map(update => ({
        reportTitle: report.title,
        reportCategory: report.category,
        status: update.status,
        description: update.description,
        updatedBy: update.updatedBy?.name || 'System',
        updatedAt: update.timestamp
      }))
    ),
    categoryDistribution,
    upcomingDeadlines: await getUpcomingDeadlines(staffId)
  };

  res.status(200).json({
    success: true,
    data: dashboardData
  });
});

// @desc    Get system analytics
// @route   GET /api/dashboard/analytics
// @access  Private (Admin)
exports.getSystemAnalytics = asyncHandler(async (req, res, next) => {
  const { period = 'month' } = req.query;
  const dateRange = getDateRange(period);

  const [
    userGrowth,
    reportGrowth,
    donationGrowth,
    resolutionTrends,
    categoryAnalysis,
    geographicAnalysis,
    timeAnalysis
  ] = await Promise.all([
    // User Growth
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: 1 },
          citizens: {
            $sum: { $cond: [{ $eq: ['$role', 'citizen'] }, 1, 0] }
          },
          staff: {
            $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Report Growth
    Report.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Donation Growth
    Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Resolution Trends
    Report.aggregate([
      {
        $match: {
          status: 'completed',
          actualCompletion: { $exists: true },
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$actualCompletion', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          },
          category: 1,
          createdAt: 1
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgResolutionTime: { $avg: '$resolutionTime' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // Category Analysis
    Report.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          avgPriority: { $avg: '$priority' },
          avgSeverity: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'low'] }, then: 1 },
                  { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$severity', 'critical'] }, then: 4 }
                ],
                default: 2
              }
            }
          }
        }
      },
      { $sort: { total: -1 } }
    ]),

    // Geographic Analysis
    Report.aggregate([
      {
        $match: {
          'location.coordinates': { $exists: true },
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: {
            lat: { $round: ['$location.coordinates.lat', 2] },
            lng: { $round: ['$location.coordinates.lng', 2] },
            zone: '$location.zone'
          },
          count: { $sum: 1 },
          categories: { $addToSet: '$category' },
          avgSeverity: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$severity', 'low'] }, then: 1 },
                  { case: { $eq: ['$severity', 'medium'] }, then: 2 },
                  { case: { $eq: ['$severity', 'high'] }, then: 3 },
                  { case: { $eq: ['$severity', 'critical'] }, then: 4 }
                ],
                default: 2
              }
            }
          }
        }
      },
      { $match: { count: { $gte: 2 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]),

    // Time Analysis
    Report.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          category: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 },
          categories: { $push: '$category' }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const analytics = {
    period,
    dateRange,
    userGrowth,
    reportGrowth,
    donationGrowth,
    resolutionTrends,
    categoryAnalysis,
    geographicAnalysis,
    timeAnalysis,
    summary: {
      totalUsers: userGrowth.reduce((sum, item) => sum + item.total, 0),
      totalReports: reportGrowth.reduce((sum, item) => sum + item.total, 0),
      totalDonations: donationGrowth.reduce((sum, item) => sum + item.amount, 0),
      avgResolutionTime: resolutionTrends.length > 0
        ? resolutionTrends.reduce((sum, item) => sum + item.avgResolutionTime, 0) / resolutionTrends.length
        : 0,
      peakHour: timeAnalysis.reduce((max, item) => item.count > max.count ? item : max, { count: 0 })
    }
  };

  res.status(200).json({
    success: true,
    data: analytics
  });
});

// Helper Functions
const calculateAvgResolutionTime = (reports) => {
  const completedReports = reports.filter(r => 
    r.status === 'completed' && r.actualCompletion
  );
  
  if (completedReports.length === 0) return 0;
  
  const totalTime = completedReports.reduce((sum, report) => {
    return sum + (report.actualCompletion - report.createdAt);
  }, 0);
  
  return (totalTime / completedReports.length / (1000 * 60 * 60 * 24)).toFixed(1);
};

const getUpcomingDeadlines = async (staffId) => {
  return await Report.find({
    assignedTo: staffId,
    status: { $in: ['assigned', 'in_progress'] },
    estimatedCompletion: { $gte: new Date() }
  })
  .select('title category priority estimatedCompletion')
  .sort('estimatedCompletion')
  .limit(5);
};

const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'day':
      start.setDate(now.getDate() - 1);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { start, end: now };
};