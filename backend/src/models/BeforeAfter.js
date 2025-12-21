const mongoose = require('mongoose');

const BeforeAfterSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  beforeImage: {
    url: {
      type: String,
      required: true
    },
    public_id: String,
    caption: String
  },
  afterImage: {
    url: {
      type: String,
      required: true
    },
    public_id: String,
    caption: String
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    ward: String,
    zone: String
  },
  category: {
    type: String,
    enum: ['pothole', 'drainage', 'lighting', 'garbage', 'signage', 'other'],
    required: true
  },
  resolvedInDays: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  featured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  tags: [String],
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
BeforeAfterSchema.index({ featured: 1, displayOrder: 1 });
BeforeAfterSchema.index({ category: 1 });
BeforeAfterSchema.index({ rating: -1 });
BeforeAfterSchema.index({ 'stats.views': -1 });
BeforeAfterSchema.index({ 'stats.likes': -1 });
BeforeAfterSchema.index({ createdAt: -1 });

// Virtual for improvement percentage (placeholder)
BeforeAfterSchema.virtual('improvementPercentage').get(function() {
  // This would be calculated based on image analysis
  return 85; // Default value
});

module.exports = mongoose.model('BeforeAfter', BeforeAfterSchema);