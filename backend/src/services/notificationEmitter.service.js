/**
 * Comprehensive Notification Emitter Service
 * Handles all real-time notifications with Socket.IO integration
 */

const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { emitToUser, emitToRole, emitToAll, getIO } = require('../config/socket');
const { sendEmail } = require('./email.service');

/**
 * Extract ID from a user object or ID
 * Handles both ObjectId and populated User objects
 */
const extractUserId = (userOrId) => {
  if (!userOrId) {
    console.warn('⚠️  extractUserId: userOrId is null/undefined');
    return null;
  }
  
  // If it's a populated user object with _id property
  if (userOrId._id) {
    const extracted = userOrId._id;
    // Ensure it's an ObjectId
    if (!mongoose.Types.ObjectId.isValid(extracted)) {
      console.warn('⚠️  extractUserId: Invalid ObjectId', extracted);
      return null;
    }
    console.log('🔍 extractUserId - from populated object:', {
      input: userOrId._id?.toString?.() || userOrId._id,
      extracted: extracted.toString?.() || extracted,
      isValid: mongoose.Types.ObjectId.isValid(extracted)
    });
    return extracted;
  }
  
  // If it's already an ObjectId or string ID
  const extracted = userOrId;
  
  // Ensure it's a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(extracted)) {
    console.warn('⚠️  extractUserId: Invalid ObjectId', extracted);
    return null;
  }
  
  console.log('🔍 extractUserId - from direct ID:', {
    input: extracted.toString?.() || extracted,
    extracted: extracted.toString?.() || extracted,
    isValid: mongoose.Types.ObjectId.isValid(extracted)
  });
  
  return mongoose.Types.ObjectId.isValid(extracted) 
    ? extracted 
    : null;
};

/**
 * Base notification creation with socket emission
 * @param {Object} data - Notification data
 */
const createAndEmit = async (data) => {
  try {
    const {
      recipients = [],
      sender = null,
      type = 'info',
      title = 'Notification',
      message = '',
      actionUrl = null,
      actionLabel = null,
      priority = 'normal',
      metadata = {},
      notificationData = {}
    } = data;

    let recipientIds = [];

    console.log('🔍 Processing recipients:', recipients);

    // Separate role strings from user IDs
    const roleStrings = recipients.filter(r => typeof r === 'string' && ['admin', 'staff', 'user', 'citizen'].includes(r));
    const userIds = recipients.filter(r => {
      if (typeof r === 'string' && ['admin', 'staff', 'user', 'citizen'].includes(r)) return false;
      const idString = r.toString();
      return idString.length === 24 || (idString.match && idString.match(/^[0-9a-f]{24}$/i));
    });

    console.log('📋 Role strings:', roleStrings);
    console.log('👤 User IDs:', userIds.length);

    // Handle 'admin' role
    if (roleStrings.includes('admin')) {
      const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
      recipientIds.push(...admins.map(a => a._id));
      console.log('👤 Found admins:', admins.length);
    }

    // Handle 'staff' role
    if (roleStrings.includes('staff')) {
      const staff = await User.find({ role: 'staff', isActive: true }).select('_id');
      recipientIds.push(...staff.map(s => s._id));
      console.log('👥 Found staff:', staff.length);
    }

    // Handle 'user' or 'citizen' role
    if (roleStrings.includes('user') || roleStrings.includes('citizen')) {
      const users = await User.find({ 
        role: { $in: ['user', 'citizen'] }, 
        isActive: true 
      }).select('_id');
      recipientIds.push(...users.map(u => u._id));
      console.log('👫 Found users/citizens:', users.length);
    }

    // Add specific user IDs
    recipientIds.push(...userIds);
    console.log('🎯 Added specific users:', userIds.length);

    // Remove duplicates - keep as ObjectIds for database (don't convert to string)
    const uniqueRecipientIds = [...new Set(recipientIds.map(id => id.toString()))];
    // Convert back to ObjectIds for Mongoose
    const mongooseRecipientIds = uniqueRecipientIds.map(id => new mongoose.Types.ObjectId(id));

    console.log('📬 Final recipient IDs:', { 
      total: mongooseRecipientIds.length, 
      sample: mongooseRecipientIds.slice(0, 3).map(id => ({
        id: id.toString(),
        type: typeof id,
        valid: mongoose.Types.ObjectId.isValid(id)
      }))
    });

    if (mongooseRecipientIds.length === 0) {
      console.warn('⚠️  No recipients found for notification');
      return [];
    }

    // Create notifications in database
    const notifications = mongooseRecipientIds.map(recipientId => ({
      sender: sender || null,
      recipient: recipientId,
      type,
      title,
      message,
      data: notificationData,
      priority,
      actionUrl,
      actionLabel,
      metadata
    }));

    console.log('💾 Saving notifications to DB:', {
      count: notifications.length,
      recipients: mongooseRecipientIds.slice(0, 3).map(r => ({
        id: r.toString(),
        type: typeof r,
        valid: mongoose.Types.ObjectId.isValid(r)
      })),
      type,
      title
    });

    const savedNotifications = await Notification.insertMany(notifications);

    console.log('✅ Notifications saved:', savedNotifications.length);
    console.log('📊 Saved notification recipients:', savedNotifications.slice(0, 3).map(n => ({
      id: n._id.toString(),
      recipient: n.recipient.toString(),
      recipientType: typeof n.recipient,
      type: n.type
    })));

    // Emit to each recipient via socket
    savedNotifications.forEach(notification => {
      const io = getIO();
      if (io) {
        // Convert recipient ID to string for socket room name
        const recipientStr = notification.recipient.toString();
        const roomName = `user_${recipientStr}`;
        
        io.to(roomName).emit('notification:new', {
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          actionLabel: notification.actionLabel,
          timestamp: notification.createdAt,
          data: notification.data,
          metadata: notification.metadata
        });

        console.log(`📨 Notification emitted to ${roomName} (recipient: ${recipientStr})`);
      }
    });

    return savedNotifications;
  } catch (error) {
    console.error('❌ Error creating/emitting notification:', error);
    throw error;
  }
};

/**
 * REPORT NOTIFICATIONS
 */

// User submits a report - notify admin
exports.notifyReportSubmitted = async (report, reportedBy) => {
  return createAndEmit({
    recipients: ['admin'],
    sender: reportedBy._id,
    type: 'report_created',
    title: '📋 New Report Submitted',
    message: `${reportedBy.name} submitted a new report: "${report.title}"`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'View Report',
    priority: 'high',
    notificationData: {
      reportId: report._id,
      title: report.title,
      category: report.category,
      location: report.location,
      submittedBy: reportedBy.name
    },
    metadata: {
      source: 'report.controller',
      category: 'reports',
      tags: ['report-submission']
    }
  });
};

// Admin/Staff assigns task to staff - notify staff & citizen
exports.notifyTaskAssigned = async (report, assignedTo) => {
  const notifications = [];
  
  // Notify assigned staff
  notifications.push(await createAndEmit({
    recipients: [assignedTo._id],
    sender: null,
    type: 'report_assigned',
    title: '🎯 New Task Assigned',
    message: `You have been assigned a task: "${report.title}"`,
    actionUrl: `/reports/${report._id}`,
    actionLabel: 'View Task',
    priority: 'high',
    notificationData: {
      reportId: report._id,
      title: report.title,
      category: report.category,
      location: report.location,
      priority: report.priority
    },
    metadata: {
      source: 'report.controller',
      category: 'tasks',
      tags: ['task-assignment', 'staff']
    }
  }));
  
  // Notify report creator (citizen) - notify them their issue is being worked on
  const userId = extractUserId(report.user);
  if (userId) {
    notifications.push(await createAndEmit({
      recipients: [userId],
      sender: null,
      type: 'report_assigned',
      title: '👷 Your Issue Has Been Assigned',
      message: `Your report "${report.title}" has been assigned to our team for work. We're on it!`,
      actionUrl: `/reports/${report._id}`,
      actionLabel: 'View Report',
      priority: 'normal',
      notificationData: {
        reportId: report._id,
        title: report.title,
        assignedTo: assignedTo.name,
        category: report.category,
        priority: report.priority
      },
      metadata: {
        source: 'report.controller',
        category: 'tasks',
        tags: ['task-assignment', 'citizen']
      }
    }));
  }
  
  return notifications.flat();
};

// Staff updates progress - notify admin & user
exports.notifyProgressUpdate = async (report, updatedBy, progressPercentage, description) => {
  const notifications = [];

  // Notify admin
  notifications.push(await createAndEmit({
    recipients: ['admin'],
    sender: updatedBy._id,
    type: 'progress_update',
    title: '⏳ Progress Update',
    message: `${updatedBy.name} updated "${report.title}" to ${progressPercentage}% - ${description || 'No additional details'}`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'View Details',
    priority: 'normal',
    notificationData: {
      reportId: report._id,
      title: report.title,
      progress: progressPercentage,
      description: description,
      updatedBy: {
        id: updatedBy._id,
        name: updatedBy.name,
        role: updatedBy.role
      }
    },
    metadata: {
      source: 'report.controller',
      category: 'reports',
      tags: ['progress-update']
    }
  }));

  // Notify report creator (user/citizen)
  // Extract user ID if report.user is a populated object
  const userId = extractUserId(report.user);
  if (!userId) {
    console.warn('❌ Failed to extract user ID from report for progress notification');
  } else {
    console.log('👤 Citizen user ID for notification:', {
      userId: userId.toString(),
      reportTitle: report.title
    });
  }
  
  if (userId) {
    notifications.push(await createAndEmit({
      recipients: [userId],
      sender: updatedBy._id,
      type: 'progress_update',
      title: '⏳ Your Report Progress',
      message: `Good news! "${report.title}" is now ${progressPercentage}% complete. ${description || 'Staff is actively working on your report'}`,
      actionUrl: `/reports/${report._id}`,
      actionLabel: 'View Report',
      priority: 'normal',
      notificationData: {
        reportId: report._id,
        title: report.title,
        progress: progressPercentage,
        description: description,
        updatedBy: {
          id: updatedBy._id,
          name: updatedBy.name,
          role: updatedBy.role
        }
      },
      metadata: {
        source: 'report.controller',
        category: 'reports',
        tags: ['progress-update', 'user']
      }
    }));
  }

  return notifications.flat();
};

// Report marked for review - notify admin & citizen
exports.notifyTaskForReview = async (report, completedBy) => {
  const notifications = [];
  
  // Notify admin
  notifications.push(await createAndEmit({
    recipients: ['admin'],
    sender: completedBy._id,
    type: 'status_update',
    title: '✅ Task Ready for Review',
    message: `${completedBy.name} completed task "${report.title}" and submitted for review`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'Review Task',
    priority: 'high',
    notificationData: {
      reportId: report._id,
      title: report.title,
      completedBy: completedBy.name,
      status: 'pending_approval'
    },
    metadata: {
      source: 'report.controller',
      category: 'tasks',
      tags: ['task-review', 'pending-approval', 'admin']
    }
  }));
  
  // Notify citizen that work is almost done, pending admin approval
  const userId = extractUserId(report.user);
  if (userId) {
    notifications.push(await createAndEmit({
      recipients: [userId],
      sender: completedBy._id,
      type: 'status_update',
      title: '⏳ Work Almost Complete',
      message: `Great news! The work on "${report.title}" is complete and pending final approval`,
      actionUrl: `/reports/${report._id}`,
      actionLabel: 'View Report',
      priority: 'normal',
      notificationData: {
        reportId: report._id,
        title: report.title,
        completedBy: completedBy.name,
        status: 'pending_approval'
      },
      metadata: {
        source: 'report.controller',
        category: 'tasks',
        tags: ['task-review', 'citizen']
      }
    }));
  }
  
  return notifications.flat();
};

// Admin approves task - notify staff & user
exports.notifyTaskApproved = async (report, approvedBy) => {
  const notifications = [];

  // Notify assigned staff
  if (report.assignedTo) {
    const staffId = extractUserId(report.assignedTo);
    notifications.push(await createAndEmit({
      recipients: [staffId],
      sender: approvedBy._id,
      type: 'status_update',
      title: '🎉 Task Approved',
      message: `Your task "${report.title}" has been approved by admin`,
      actionUrl: `/reports/${report._id}`,
      actionLabel: 'View Task',
      priority: 'high',
      notificationData: {
        reportId: report._id,
        title: report.title,
        status: 'approved'
      },
      metadata: {
        source: 'report.controller',
        category: 'tasks',
        tags: ['approval', 'staff']
      }
    }));
  }

  // Notify report creator (user)
  const userId = extractUserId(report.user);
  if (userId) {
    notifications.push(await createAndEmit({
      recipients: [userId],
      sender: approvedBy._id,
      type: 'report_completed',
      title: '✨ Your Report Completed',
      message: `Your report "${report.title}" has been completed and approved`,
      actionUrl: `/dashboard/reports/${report._id}`,
      actionLabel: 'View Report',
      priority: 'high',
      notificationData: {
        reportId: report._id,
        title: report.title,
        status: 'completed'
      },
      metadata: {
        source: 'report.controller',
        category: 'reports',
        tags: ['completion', 'user']
      }
    }));
  } else {
    console.warn('❌ Failed to extract user ID for task approval notification');
  }

  return notifications.flat();
};

// Admin requests revision - notify staff
exports.notifyRevisionRequested = async (report, rejectedBy, revisionNotes) => {
  const staffId = extractUserId(report.assignedTo);
  return createAndEmit({
    recipients: [staffId],
    sender: rejectedBy._id,
    type: 'status_update',
    title: '🔄 Revision Requested',
    message: `Admin requested revisions for task "${report.title}"`,
    actionUrl: `/staff/tasks/${report._id}`,
    actionLabel: 'View Feedback',
    priority: 'high',
    notificationData: {
      reportId: report._id,
      title: report.title,
      revisionNotes: revisionNotes,
      status: 'revision_requested'
    },
    metadata: {
      source: 'report.controller',
      category: 'tasks',
      tags: ['revision-request', 'staff']
    }
  });
};

// Before/After images uploaded - notify admin & user
exports.notifyBeforeAfterImagesUploaded = async (report, uploadedBy) => {
  const notifications = [];

  // Notify admin
  notifications.push(await createAndEmit({
    recipients: ['admin'],
    sender: uploadedBy._id,
    type: 'status_update',
    title: '📸 Before/After Images Uploaded',
    message: `${uploadedBy.name} uploaded before/after images for "${report.title}"`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'View Images',
    priority: 'normal',
    notificationData: {
      reportId: report._id,
      title: report.title,
      uploadedBy: uploadedBy.name
    },
    metadata: {
      source: 'report.controller',
      category: 'reports',
      tags: ['before-after-images', 'admin']
    }
  }));

  // Notify report creator (user)
  const userId2 = extractUserId(report.user);
  if (userId2) {
    notifications.push(await createAndEmit({
      recipients: [userId2],
      sender: uploadedBy._id,
      type: 'status_update',
      title: '📸 Work Progress Images',
      message: `Before and after images have been uploaded for your report "${report.title}"`,
      actionUrl: `/dashboard/reports/${report._id}`,
      actionLabel: 'View Progress',
      priority: 'normal',
      notificationData: {
        reportId: report._id,
        title: report.title
      },
      metadata: {
        source: 'report.controller',
        category: 'reports',
        tags: ['before-after-images', 'user']
      }
    }));
  } else {
    console.warn('❌ Failed to extract user ID for before/after images notification');
  }

  return notifications.flat();
};

/**
 * DONATION NOTIFICATIONS
 */

// User donates - notify admins
exports.notifyDonationReceived = async (donation, donor) => {
  return createAndEmit({
    recipients: ['admin'],
    sender: donor._id,
    type: 'donation_received',
    title: '💰 New Donation Received',
    message: `${donor.name} donated ₹${donation.amount}`,
    actionUrl: `/admin/donations/${donation._id}`,
    actionLabel: 'View Donation',
    priority: 'high',
    notificationData: {
      donationId: donation._id,
      amount: donation.amount,
      donorName: donor.name,
      message: donation.message
    },
    metadata: {
      source: 'donation.controller',
      category: 'donations',
      tags: ['donation-received', 'admin']
    }
  });
};

// Donation refunded - notify donor
exports.notifyDonationRefunded = async (donation, donor) => {
  return createAndEmit({
    recipients: [donor._id],
    sender: null,
    type: 'donation_refunded',
    title: '💸 Donation Refunded',
    message: `Your donation of ₹${donation.amount} has been refunded`,
    actionUrl: `/dashboard/donations/${donation._id}`,
    actionLabel: 'View Details',
    priority: 'normal',
    notificationData: {
      donationId: donation._id,
      amount: donation.amount,
      status: 'refunded'
    },
    metadata: {
      source: 'donation.controller',
      category: 'donations',
      tags: ['refund', 'donor']
    }
  });
};

/**
 * FEEDBACK NOTIFICATIONS
 */

// Feedback request sent - notify user
exports.notifyFeedbackRequest = async (report, requestedFrom) => {
  return createAndEmit({
    recipients: [requestedFrom._id],
    sender: null,
    type: 'feedback_request',
    title: '💬 Feedback Request',
    message: `Please provide feedback for completed task "${report.title}"`,
    actionUrl: `/dashboard/reports/${report._id}/feedback`,
    actionLabel: 'Give Feedback',
    priority: 'normal',
    actionRequired: true,
    notificationData: {
      reportId: report._id,
      title: report.title,
      status: 'feedback_pending'
    },
    metadata: {
      source: 'feedback.controller',
      category: 'feedback',
      tags: ['feedback-request', 'user']
    }
  });
};

// Feedback submitted - notify admins
exports.notifyFeedbackSubmitted = async (report, feedbackFrom) => {
  return createAndEmit({
    recipients: ['admin'],
    sender: feedbackFrom._id,
    type: 'feedback_submitted',
    title: '⭐ Feedback Received',
    message: `${feedbackFrom.name} submitted feedback for report "${report.title}"`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'View Feedback',
    priority: 'normal',
    notificationData: {
      reportId: report._id,
      title: report.title,
      submittedBy: feedbackFrom.name,
      rating: report.feedback?.rating || null
    },
    metadata: {
      source: 'feedback.controller',
      category: 'feedback',
      tags: ['feedback-submission', 'admin']
    }
  });
};

/**
 * STATUS CHANGE NOTIFICATIONS
 */

// Report status changed - notify relevant users
exports.notifyReportStatusChanged = async (report, changedBy, oldStatus, newStatus) => {
  const notifications = [];

  // Notify admin
  notifications.push(await createAndEmit({
    recipients: ['admin'],
    sender: changedBy._id,
    type: 'status_update',
    title: '📌 Report Status Changed',
    message: `Report "${report.title}" status changed from ${oldStatus} to ${newStatus}`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'View Report',
    priority: 'normal',
    notificationData: {
      reportId: report._id,
      title: report.title,
      oldStatus,
      newStatus
    },
    metadata: {
      source: 'report.controller',
      category: 'reports',
      tags: ['status-change', 'admin']
    }
  }));

  // Notify report creator
  const userId3 = extractUserId(report.user);
  if (userId3) {
    notifications.push(await createAndEmit({
      recipients: [userId3],
      sender: changedBy._id,
      type: 'status_update',
      title: '📌 Your Report Status Updated',
      message: `Your report "${report.title}" status is now ${newStatus}`,
      actionUrl: `/dashboard/reports/${report._id}`,
      actionLabel: 'View Report',
      priority: 'normal',
      notificationData: {
        reportId: report._id,
        title: report.title,
        newStatus
      },
      metadata: {
        source: 'report.controller',
        category: 'reports',
        tags: ['status-change', 'user']
      }
    }));
  } else {
    console.warn('❌ Failed to extract user ID for status change notification');
  }

  return notifications.flat();
};

/**
 * BROADCAST NOTIFICATIONS (for announcements)
 */

exports.notifyBroadcast = async (message, sender, recipientType = 'all') => {
  return createAndEmit({
    recipients: recipientType === 'all' ? ['user', 'admin', 'staff'] : [recipientType],
    sender: sender._id,
    type: 'broadcast',
    title: '📢 Announcement',
    message: message,
    priority: 'high',
    metadata: {
      source: 'notification.controller',
      category: 'broadcast',
      tags: ['announcement']
    }
  });
};

// Staff marks task as 100% complete - notify admin & citizen
exports.notifyTaskCompleted = async (report, completedBy) => {
  const notifications = [];
  
  // Notify admin
  notifications.push(await createAndEmit({
    recipients: ['admin'],
    sender: completedBy._id,
    type: 'status_update',
    title: '✅ Task Completed & Ready for Review',
    message: `${completedBy.name} has completed task "${report.title}" and submitted for admin review`,
    actionUrl: `/admin/reports/${report._id}`,
    actionLabel: 'Review Task',
    priority: 'high',
    notificationData: {
      reportId: report._id,
      title: report.title,
      completedBy: completedBy.name,
      status: 'completed',
      progress: 100
    },
    metadata: {
      source: 'staff.controller',
      category: 'tasks',
      tags: ['completion', 'admin', 'pending-review']
    }
  }));
  
  // Notify report creator (citizen)
  const userId = extractUserId(report.user);
  if (userId) {
    notifications.push(await createAndEmit({
      recipients: [userId],
      sender: completedBy._id,
      type: 'status_update',
      title: '🎉 Work Complete - Pending Final Approval',
      message: `Work on your report "${report.title}" is complete! Awaiting final admin approval.`,
      actionUrl: `/reports/${report._id}`,
      actionLabel: 'View Report',
      priority: 'normal',
      notificationData: {
        reportId: report._id,
        title: report.title,
        completedBy: completedBy.name,
        status: 'completed',
        progress: 100
      },
      metadata: {
        source: 'staff.controller',
        category: 'tasks',
        tags: ['completion', 'citizen', 'pending-approval']
      }
    }));
  }
  
  return notifications.flat();
};

/**
 * SYSTEM ALERTS
 */

exports.notifySystemAlert = async (title, message, recipients = 'all') => {
  return createAndEmit({
    recipients: recipients === 'all' ? ['user', 'admin', 'staff'] : [recipients],
    sender: null,
    type: 'alert',
    title: title,
    message: message,
    priority: 'high',
    metadata: {
      source: 'system',
      category: 'system',
      tags: ['system-alert']
    }
  });
};

/**
 * Notify user when their report is rejected by admin (NEW FEATURE)
 */
exports.notifyReportRejected = async (report, adminUser, rejectionReason) => {
  console.log('🔴 Emitting report rejection notification to user');
  
  try {
    const userId = extractUserId(report.user);
    if (!userId) {
      console.error('❌ Invalid user ID for report rejection notification');
      return;
    }

    // Create in-app notification
    const notification = await createAndEmit({
      recipients: [userId],
      sender: adminUser._id,
      type: 'report_rejected',
      title: 'Report Rejected',
      message: `Your report "${report.title}" has been rejected by ${adminUser.name}. Reason: ${rejectionReason}`,
      priority: 'high',
      metadata: {
        source: 'admin.controller',
        category: 'reports',
        tags: ['rejection', 'report', 'user-action-required'],
        reportId: report._id.toString(),
        reportTitle: report.title,
        rejectionReason: rejectionReason,
        rejectedBy: adminUser.name,
        reportCategory: report.category
      }
    });

    console.log('✅ Report rejection notification emitted successfully');
    return notification;
  } catch (error) {
    console.error('❌ Error emitting report rejection notification:', error);
    throw error;
  }
};

module.exports = exports;
