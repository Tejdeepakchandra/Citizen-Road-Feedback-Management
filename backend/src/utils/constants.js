// Application Constants
module.exports = {
  // User Roles
  ROLES: {
    CITIZEN: 'citizen',
    STAFF: 'staff',
    ADMIN: 'admin'
  },

  // Staff Categories
  STAFF_CATEGORIES: {
    POTHOLES: 'pothole',
    LIGHTING: 'lighting',
    DRAINAGE: 'drainage',
    GARBAGE: 'garbage',
    SIGNAGE: 'signage'
  },

  // Report Categories
  REPORT_CATEGORIES: {
    POTHOLES: 'pothole',
    DRAINAGE: 'drainage',
    LIGHTING: 'lighting',
    GARBAGE: 'garbage',
    SIGNAGE: 'signage',
    OTHER: 'other'
  },

  // Report Severity Levels
  SEVERITY_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },

  // Report Status
  REPORT_STATUS: {
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
    CLOSED: 'closed'
  },

  // Donation Status
  DONATION_STATUS: {
    CREATED: 'created',
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    REPORT_CREATED: 'report_created',
    REPORT_ASSIGNED: 'report_assigned',
    STATUS_UPDATE: 'status_update',
    PROGRESS_UPDATE: 'progress_update',
    REPORT_COMPLETED: 'report_completed',
    FEEDBACK_REQUEST: 'feedback_request',
    FEEDBACK_SUBMITTED: 'feedback_submitted',
    DONATION_RECEIVED: 'donation_received',
    DONATION_REFUNDED: 'donation_refunded',
    BROADCAST: 'broadcast',
    SYSTEM: 'system',
    ALERT: 'alert',
    INFO: 'info',
    WARNING: 'warning'
  },

  // Notification Priorities
  NOTIFICATION_PRIORITIES: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  // Feedback Sentiments
  FEEDBACK_SENTIMENTS: {
    POSITIVE: 'positive',
    NEUTRAL: 'neutral',
    NEGATIVE: 'negative'
  },

  // File Upload Limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_FILES: 10,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },

  // Pagination Defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300,    // 5 minutes
    MEDIUM: 1800,  // 30 minutes
    LONG: 3600,    // 1 hour
    VERY_LONG: 86400 // 24 hours
  },

  // Validation Limits
  VALIDATION: {
    NAME_MIN: 2,
    NAME_MAX: 50,
    EMAIL_MAX: 100,
    PASSWORD_MIN: 6,
    PASSWORD_MAX: 100,
    PHONE_LENGTH: 10,
    PINCODE_LENGTH: 6,
    TITLE_MIN: 5,
    TITLE_MAX: 100,
    DESCRIPTION_MIN: 10,
    DESCRIPTION_MAX: 1000,
    COMMENT_MAX: 500,
    MESSAGE_MAX: 500
  },

  // Status Colors
  STATUS_COLORS: {
    pending: 'blue',
    under_review: 'purple',
    assigned: 'orange',
    in_progress: 'yellow',
    completed: 'green',
    rejected: 'red',
    closed: 'gray'
  },

  // Category Icons
  CATEGORY_ICONS: {
    pothole: '🕳️',
    drainage: '💧',
    lighting: '💡',
    garbage: '🗑️',
    signage: '🪧',
    other: '📝'
  },

  // Priority Weights
  PRIORITY_WEIGHTS: {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2
  },

  // Category Weights
  CATEGORY_WEIGHTS: {
    pothole: 5,
    drainage: 4,
    lighting: 3,
    garbage: 2,
    signage: 2,
    other: 1
  },

  // Email Templates
  EMAIL_TEMPLATES: {
    WELCOME: 'welcome',
    REPORT_SUBMITTED: 'report-submitted',
    REPORT_ASSIGNED: 'report-assigned',
    STATUS_UPDATED: 'status-updated',
    REPORT_COMPLETED: 'report-completed',
    DONATION_THANKYOU: 'donation-thankyou',
    DONATION_REFUNDED: 'donation-refunded',
    PASSWORD_RESET: 'password-reset',
    EMAIL_VERIFICATION: 'email-verification',
    BROADCAST: 'broadcast'
  },

  // Date Formats
  DATE_FORMATS: {
    DISPLAY: 'DD MMM YYYY',
    DISPLAY_WITH_TIME: 'DD MMM YYYY, hh:mm A',
    API: 'YYYY-MM-DD',
    API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss'
  },

  // Time Intervals
  TIME_INTERVALS: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000
  }
};