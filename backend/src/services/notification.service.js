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

    console.log('📬 createNotification called:', {
      type,
      title,
      recipients: recipients.map(r => typeof r === 'string' ? r : r.toString()),
      recipientCount: recipients.length
    });

    // Determine recipients
    if (recipients.includes('admin')) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      recipientIds.push(...admins.map(admin => admin._id));
      console.log(`  ✓ Added ${admins.length} admins`);
    }

    if (recipients.includes('all')) {
      const allUsers = await User.find({ isActive: true }).select('_id');
      recipientIds.push(...allUsers.map(user => user._id));
      console.log(`  ✓ Added ${allUsers.length} all users`);
    }

    // Add specific user IDs (handle both strings and ObjectIds)
    const mongoose = require('mongoose');
    const specificUsers = recipients.filter(recipient => {
      // Skip role strings
      if (typeof recipient === 'string' && ['admin', 'staff', 'user', 'citizen', 'all'].includes(recipient)) {
        return false;
      }
      // Include valid ObjectIds (both string format and ObjectId objects)
      if (mongoose.Types.ObjectId.isValid(recipient)) {
        return true;
      }
      return false;
    });
    
    console.log(`  ✓ Found ${specificUsers.length} specific user recipients`);
    
    // Convert string IDs to ObjectIds
    specificUsers.forEach(userId => {
      if (typeof userId === 'string') {
        recipientIds.push(new mongoose.Types.ObjectId(userId));
      } else {
        recipientIds.push(userId);
      }
    });

    // Remove duplicates
    recipientIds = [...new Set(recipientIds.map(id => id.toString()))].map(id => new mongoose.Types.ObjectId(id));
    
    console.log('📊 Final recipient IDs:', {
      count: recipientIds.length,
      ids: recipientIds.slice(0, 3).map(id => id.toString())
    });

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

    // 🔧 Emit real-time notification to each recipient via socket
    for (const notification of savedNotifications) {
      try {
        const userId = notification.recipient.toString();
        emitToSocket(`user_${userId}`, 'notification:new', {
          _id: notification._id,
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          timestamp: new Date(),
        });
        console.log(`✅ Socket notification emitted to user room: user_${userId}`);
      } catch (err) {
        console.error(`❌ Socket emit error for ${notification.recipient}:`, err.message);
      }
    }

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