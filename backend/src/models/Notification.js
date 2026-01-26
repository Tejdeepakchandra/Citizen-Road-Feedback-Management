const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'report_created',
      'report_assigned',
      'status_update',
      'progress_update',
      'report_completed',
      'feedback_request',
      'feedback_submitted',
      'donation_received',
      'donation_successful',
      'donation_refunded',
      'broadcast',
      'system',
      'alert',
      'info',
      'warning'
    ]
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot be more than 1000 characters']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionUrl: String,
  actionLabel: String,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  metadata: {
    source: String,
    category: String,
    tags: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ priority: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ 'metadata.tags': 1 });

// Virtual for isUnread
NotificationSchema.virtual('isUnread').get(function() {
  return !this.read;
});

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
});

// Virtual for isExpired
NotificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

module.exports = mongoose.model('Notification', NotificationSchema);