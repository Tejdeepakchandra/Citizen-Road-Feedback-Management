const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('./email.service');
const { emitToSocket } = require('./socket.service');

// Create notification
// Create notification
exports.createNotification = async (data) => {
  const { user, type, title, message, data: notificationData, recipients = [], priority = 'normal' } = data;

  try {
    let recipientIds = [];

    // Determine recipients
    if (recipients.includes('admin')) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      recipientIds.push(...admins.map(admin => admin._id));
    }

    if (recipients.includes('all')) {
      const allUsers = await User.find({ isActive: true }).select('_id');
      recipientIds.push(...allUsers.map(user => user._id));
    }

    // Add specific user IDs
    const specificUsers = recipients.filter(recipient => 
      typeof recipient === 'string' && recipient.length === 24
    );
    recipientIds.push(...specificUsers);

    // Remove duplicates
    recipientIds = [...new Set(recipientIds)];

    // Create notifications
    const notifications = recipientIds.map(recipientId => ({
      sender: user,
      recipient: recipientId,
      type,
      title,
      message,
      data: notificationData,
      priority
    }));

    const savedNotifications = await Notification.insertMany(notifications);

    // 🔧 FIXED: Use emitToSocket instead of emitToUser
    savedNotifications.forEach(notification => {
      emitToSocket(`notification:${notification.recipient}`, {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        timestamp: new Date(),
      });
    });

    // Send email notifications to users who have it enabled
    const usersWithEmail = await User.find({
      _id: { $in: recipientIds },
      'preferences.emailNotifications': { $ne: false }
    }).select('email name');

    for (const user of usersWithEmail) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          template: 'notification',
          context: {
            name: user.name,
            message,
            type,
            date: new Date().toLocaleDateString(),
            year: new Date().getFullYear()
          }
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
      }
    }

    return savedNotifications.length;
  } catch (error) {
    console.error('Error creating notifications:', error);
    throw error;
  }
};

// Get unread notifications count
exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({
    recipient: userId,
    read: false
  });
};

// Mark notifications as read
exports.markAsRead = async (notificationIds, userId) => {
  return await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      $set: {
        read: true,
        readAt: new Date()
      }
    }
  );
};
// Add these to your existing notification.service.js

// Send admin notification (specifically for staff.controller.js)
exports.sendAdminNotification = async (data) => {
  try {
    const { type, title, message, data: notificationData } = data;
    
    // Find all admin users
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    
    // Create notification data
    const notification = {
      user: 'system', // or req.user.id if available
      type: type || 'info',
      title: title || 'Admin Notification',
      message: message || '',
      data: notificationData || {},
      recipients: ['admin'],
      priority: 'high'
    };
    
    return await exports.createNotification(notification);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
};

// Send user notification (specifically for staff.controller.js)
exports.sendUserNotification = async (userId, data) => {
  try {
    const { type, title, message, data: notificationData } = data;
    
    const notification = {
      user: 'system', // or req.user.id if available
      type: type || 'info',
      title: title || 'User Notification',
      message: message || '',
      data: notificationData || {},
      recipients: [userId],
      priority: 'normal'
    };
    
    return await exports.createNotification(notification);
  } catch (error) {
    console.error('Error sending user notification:', error);
    return null;
  }
};

// Send bulk notification to multiple users
exports.sendBulkNotification = async (userIds, data) => {
  try {
    const notification = {
      user: 'system',
      type: data.type || 'info',
      title: data.title || 'Notification',
      message: data.message || '',
      data: data.data || {},
      recipients: userIds,
      priority: data.priority || 'normal'
    };
    
    return await exports.createNotification(notification);
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    return false;
  }
};

// Cleanup old notifications (older than 30 days)
exports.cleanupOldNotifications = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await Notification.deleteMany({
    read: true,
    createdAt: { $lt: thirtyDaysAgo }
  });

  console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
  return result.deletedCount;
};

// Schedule cleanup job
setInterval(() => {
  exports.cleanupOldNotifications().catch(console.error);
}, 24 * 60 * 60 * 1000); // Run daily