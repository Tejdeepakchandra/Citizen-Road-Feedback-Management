const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: {
      values: ['pothole', 'drainage', 'lighting', 'garbage', 'signage', 'other'],
      message: 'Please select a valid category'
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  priority: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  // ADDED: Main progress field
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  location: {
    address: {
      type: String,
      required: [true, 'Please provide an address']
    },
    coordinates: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    },
    landmark: String,
    ward: String,
    zone: String
  },
  images: [{
    url: String,
    public_id: String,
    caption: String,
    mimetype: String,
    size: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'assigned', 'in_progress', 'completed', 'rejected', 'closed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,
  assignmentDate: Date,
  assignmentNotes: String,
  dueDate: Date,
  estimatedCompletion: Date,
  actualCompletion: Date,
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  completionNotes: String,
  progressUpdates: [{
    status: String,
    description: String,
    images: [{
      url: String,
      public_id: String,
      caption: String,
      uploadedAt: Date,
      uploadedBy: mongoose.Schema.Types.ObjectId
    }],
    percentage: {
      type: Number,
      min: 0,
      max: 100
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  beforeImages: [{
    url: String,
    public_id: String,
    caption: String,
    uploadedAt: Date,
    uploadedBy: mongoose.Schema.Types.ObjectId
  }],
  afterImages: [{
    url: String,
    public_id: String,
    caption: String,
    uploadedAt: Date,
    uploadedBy: mongoose.Schema.Types.ObjectId
  }],

   galleryImages: [{
    beforeImage: {
      originalImageId: mongoose.Schema.Types.ObjectId, // Reference to user's image in images[] array
      url: String,
      public_id: String,
      caption: String,
      uploadedBy: mongoose.Schema.Types.ObjectId,
      uploadedAt: Date
    },
    afterImage: {
      url: String,
      public_id: String,
      caption: String,
      uploadedBy: mongoose.Schema.Types.ObjectId,
      uploadedAt: Date,
      mimetype: String,
      size: Number
    },
    status: { // pending, approved, rejected
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    featured: {
      type: Boolean,
      default: false
    }
  }],


  completionDetails: {
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    afterImages: [{
      url: String,
      public_id: String,
      caption: String
    }],
    description: String,
    cost: Number,
    materialsUsed: [String],
    workHours: Number
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  tags: [String],
  viewCount: {
    type: Number,
    default: 0
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvoteCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  },
  // Add these fields in your ReportSchema, around line 85-95 (after status field)

// Add this - CRITICAL for admin review system
needsReview: {
  type: Boolean,
  default: false
},

// Add this for admin approval tracking
adminApproved: {
  type: Boolean,
  default: false
},

// Add this for who approved it
approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},

// Add this for when admin approved it
approvedAt: Date,

// Add this for admin notes
adminNotes: String,

// Add this for admin rejection
adminRejected: {
  type: Boolean,
  default: false
},

// Add this for rejection reason
rejectionReason: String,

// Add this for who rejected it
rejectedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},

// Add this for when it was rejected
rejectedAt: Date,

// Add this - when staff completed it (different from actualCompletion which is when admin approved)
staffCompletionTime: Date,

// Add this - staff who marked it complete
staffCompletedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
},
);

// Virtual for days open
ReportSchema.virtual('daysOpen').get(function() {
  if (this.status === 'completed' && this.actualCompletion) {
    return Math.ceil((this.actualCompletion - this.createdAt) / (1000 * 60 * 60 * 24));
  }
  return Math.ceil((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for isOverdue
ReportSchema.virtual('isOverdue').get(function() {
  if (this.estimatedCompletion && this.status !== 'completed') {
    return Date.now() > this.estimatedCompletion;
  }
  return false;
});

// Virtual for current progress percentage
ReportSchema.virtual('currentProgressPercentage').get(function() {
  if (this.progressUpdates && this.progressUpdates.length > 0) {
    // Sort by timestamp and get the latest
    const sortedUpdates = [...this.progressUpdates].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return sortedUpdates[0].percentage || this.progress || 0;
  }
  return this.progress || 0;
});

// Virtual for latest progress update
ReportSchema.virtual('latestProgressUpdate').get(function() {
  if (this.progressUpdates && this.progressUpdates.length > 0) {
    const sortedUpdates = [...this.progressUpdates].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    return sortedUpdates[0];
  }
  return null;
});
// NEW: Add virtuals for gallery images
ReportSchema.virtual('approvedGalleryImagesCount').get(function() {
  if (!this.galleryImages) return 0;
  return this.galleryImages.filter(img => img.status === 'approved').length;
});

ReportSchema.virtual('pendingGalleryImagesCount').get(function() {
  if (!this.galleryImages) return 0;
  return this.galleryImages.filter(img => img.status === 'pending').length;
});

ReportSchema.virtual('featuredGalleryImages').get(function() {
  if (!this.galleryImages) return [];
  return this.galleryImages.filter(img => img.status === 'approved' && img.featured === true);
});

// Indexes for better query performance
ReportSchema.index({ status: 1 });
ReportSchema.index({ category: 1 });
ReportSchema.index({ user: 1 });
ReportSchema.index({ assignedTo: 1 });
ReportSchema.index({ 'location.coordinates': '2dsphere' });
ReportSchema.index({ createdAt: -1 });
ReportSchema.index({ priority: -1 });
ReportSchema.index({ 'progressUpdates.timestamp': -1 });
ReportSchema.index({ progress: -1 });

// Pre-save middleware to calculate priority and update progress
ReportSchema.pre('save', function(next) {
  // Calculate priority based on severity and category
  const severityWeights = {
    'critical': 5,
    'high': 4,
    'medium': 3,
    'low': 2
  };

  const categoryWeights = {
    'pothole': 5,
    'drainage': 4,
    'lighting': 3,
    'garbage': 2,
    'signage': 2,
    'other': 1
  };

  this.priority = Math.round(
    (severityWeights[this.severity] + categoryWeights[this.category]) / 2
  );

  // Auto-set estimated completion based on priority
  const daysToAdd = {
    1: 30, // Low priority
    2: 14, // Medium-low
    3: 7,  // Medium
    4: 3,  // High
    5: 1   // Critical
  };

  if (this.isNew) {
    this.estimatedCompletion = new Date(
      Date.now() + daysToAdd[this.priority] * 24 * 60 * 60 * 1000
    );
  }

  // Update main progress field from latest progress update
  if (this.progressUpdates && this.progressUpdates.length > 0) {
    const latestUpdate = this.progressUpdates[this.progressUpdates.length - 1];
    this.progress = latestUpdate.percentage || this.progress || 0;
  }

  next();
});

module.exports = mongoose.model('Report', ReportSchema);