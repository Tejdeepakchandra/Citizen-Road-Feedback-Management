const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../services/email.service');
const { emitToSocket, emitToUser } = require('../services/socket.service');
const notificationEmitter = require('../services/notificationEmitter.service');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  
  console.log('\n=== 🔔 NOTIFICATION FETCH REQUEST ===');
  console.log('🔍 Fetching notifications for user:', {
    userId: req.user.id,
    userId_toString: req.user.id.toString(),
    userId_type: typeof req.user.id,
    userId_isObjectId: mongoose.Types.ObjectId.isValid(req.user.id),
    user_name: req.user.name,
    user_role: req.user.role,
    page,
    limit,
    unreadOnly
  });
  
  let query = { recipient: req.user.id };
  
  if (unreadOnly === 'true') {
    query.read = false;
  }

  console.log('📋 Query being used:', { 
    recipient_value: query.recipient.toString(),
    recipient_type: typeof query.recipient,
    recipient_valid: mongoose.Types.ObjectId.isValid(query.recipient),
    full_query: JSON.stringify(query)
  });

  // Debug: Find ALL notifications to see what's in DB  
  const allNotifications = await Notification.find({}).select('recipient type title').limit(10);
  console.log('🔎 ALL notifications in DB (sample of 10):', allNotifications.map(n => ({
    _id: n._id.toString(),
    recipient: n.recipient.toString(),
    recipient_type: typeof n.recipient,
    type: n.type,
    title: n.title
  })));

  const skip = (page - 1) * limit;

  const notifications = await Notification.find(query)
    .populate('sender', 'name email avatar role')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  console.log('📊 Query result:', {
    query_recipient: query.recipient.toString(),
    found_count: notifications.length,
    skip: skip,
    limit: parseInt(limit),
    matching_yes_or_no: notifications.length > 0 ? '✅ YES' : '❌ NO'
  });

  if (notifications.length > 0) {
    console.log('✅ MATCH FOUND! First 3 notifications:', notifications.slice(0, 3).map(n => ({
      notif_id: n._id.toString(),
      recipient: n.recipient.toString(),
      recipient_matches_query: n.recipient.toString() === query.recipient.toString(),
      type: n.type,
      title: n.title,
      created: n.createdAt
    })));
  } else {
    console.log('❌ NO MATCH! - No notifications found for user', query.recipient.toString());
    console.log('   Checking if any notifications exist in DB for different recipients:');
    const otherNotifs = await Notification.find({ recipient: { $ne: query.recipient } }).limit(3);
    if (otherNotifs.length > 0) {
      console.log('   Other notifications in DB:', otherNotifs.map(n => ({
        recipient: n.recipient.toString(),
        type: n.type
      })));
    }
  }

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    read: false
  });

  console.log('📈 Counts:', {
    matching_count: notifications.length,
    total_count: total,
    unread_count: unreadCount
  });
  console.log('=== END FETCH ===\n');

  res.status(200).json({
    success: true,
    count: notifications.length,
    total,
    unreadCount,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: notifications
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user.id
  });

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  // Emit real-time update
  emitToUser(req.user.id, "notification:read", {
  notificationId: notification._id,
  readAt: new Date(),
});


  res.status(200).json({
    success: true,
    data: notification,
    message: 'Notification marked as read'
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { 
      $set: { 
        read: true,
        readAt: new Date()
      }
    }
  );

  // Emit real-time update
  emitToSocket('all_notifications_read', {
    userId: req.user.id
  });

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user.id
  });

  if (!notification) {
    return next(new ErrorResponse('Notification not found', 404));
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Notification deleted successfully'
  });
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
exports.clearAllNotifications = asyncHandler(async (req, res, next) => {
  await Notification.deleteMany({ recipient: req.user.id });

  res.status(200).json({
    success: true,
    message: 'All notifications cleared'
  });
});

// @desc    Send broadcast notification (Admin only)
// @route   POST /api/notifications/broadcast
// @access  Private (Admin)
exports.sendBroadcast = asyncHandler(async (req, res, next) => {
  const { title, message, type = 'info', recipients = 'all', data } = req.body;

  let userQuery = {};
  if (recipients === 'citizens') {
    userQuery.role = 'citizen';
  } else if (recipients === 'staff') {
    userQuery.role = 'staff';
  } else if (recipients === 'admins') {
    userQuery.role = 'admin';
  }

  const users = await User.find(userQuery).select('_id email name');

  // Create notifications for each user
  const notifications = users.map(user => ({
    sender: req.user.id,
    recipient: user._id,
    type,
    title,
    message,
    data,
    priority: type === 'alert' ? 'high' : 'normal'
  }));

  await Notification.insertMany(notifications);

  // Send emails to users with email notifications enabled
  const usersWithEmail = users.filter(user => 
    user.preferences?.emailNotifications !== false
  );

  for (const user of usersWithEmail) {
    await sendEmail({
      to: user.email,
      subject: title,
      template: 'broadcast-notification',
      context: {
        name: user.name,
        message,
        date: new Date().toLocaleDateString(),
        year: new Date().getFullYear()
      }
    }).catch(err => {
      console.error(`Failed to send email to ${user.email}:`, err);
    });
  }

  // 📬 Emit real-time broadcast notification
  try {
    await notificationEmitter.notifyBroadcast(message, req.user, recipients);
    console.log('✅ Real-time broadcast notification emitted');
  } catch (notifError) {
    console.error('❌ Real-time broadcast notification failed:', notifError);
  }

  // Emit real-time notifications
  users.forEach(user => {
    emitToUser(user._id, "notification:broadcast", {
  title,
  message,
  type,
  timestamp: new Date(),
});

  });

  res.status(200).json({
    success: true,
    message: `Broadcast sent to ${users.length} users`,
    data: {
      sentTo: users.length,
      emailsSent: usersWithEmail.length
    }
  });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
exports.getPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('preferences');

  res.status(200).json({
    success: true,
    data: user.preferences || {
      emailNotifications: true,
      pushNotifications: true,
      notificationTypes: ['report', 'status', 'donation', 'broadcast']
    }
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const { emailNotifications, pushNotifications, notificationTypes } = req.body;

  const user = await User.findById(req.user.id);
  
  user.preferences = {
    ...user.preferences,
    emailNotifications: emailNotifications !== undefined ? emailNotifications : user.preferences?.emailNotifications,
    pushNotifications: pushNotifications !== undefined ? pushNotifications : user.preferences?.pushNotifications,
    notificationTypes: notificationTypes || user.preferences?.notificationTypes || ['report', 'status', 'donation', 'broadcast']
  };

  await user.save();

  res.status(200).json({
    success: true,
    data: user.preferences,
    message: 'Notification preferences updated successfully'
  });
});

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private (Admin)
exports.getNotificationStats = asyncHandler(async (req, res, next) => {
  const { period = 'week' } = req.query;
  const dateRange = getDateRange(period);

  const [
    totalNotifications,
    unreadNotifications,
    byType,
    deliveryStats,
    userEngagement
  ] = await Promise.all([
    Notification.countDocuments({
      createdAt: { $gte: dateRange.start }
    }),
    Notification.countDocuments({
      read: false,
      createdAt: { $gte: dateRange.start }
    }),
    Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          read: { $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] } }
        }
      }
    ]),
    Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          read: { $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] } },
          avgReadTime: {
            $avg: {
              $cond: [
                { $ne: ['$readAt', null] },
                { $subtract: ['$readAt', '$createdAt'] },
                null
              ]
            }
          }
        }
      }
    ]),
    Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start }
        }
      },
      {
        $group: {
          _id: '$recipient',
          total: { $sum: 1 },
          read: { $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userRole: '$user.role',
          total: 1,
          read: 1,
          readRate: { $multiply: [{ $divide: ['$read', '$total'] }, 100] }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ])
  ]);

  const stats = {
    period,
    dateRange,
    total: totalNotifications,
    unread: unreadNotifications,
    byType,
    delivery: deliveryStats[0] || {
      total: 0,
      read: 0,
      avgReadTime: 0
    },
    userEngagement,
    summary: {
      readRate: totalNotifications > 0
        ? ((deliveryStats[0]?.read || 0) / totalNotifications * 100).toFixed(1)
        : 0,
      avgReadTime: deliveryStats[0]?.avgReadTime
        ? (deliveryStats[0].avgReadTime / (1000 * 60)).toFixed(1) // Convert to minutes
        : 0
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Helper function to get date range
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