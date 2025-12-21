const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  images: [{
    url: String,
    public_id: String,
    caption: String
  }],
  aspects: {
    qualityOfWork: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  helpfulBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  response: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    respondedAt: Date
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate sentiment before saving
FeedbackSchema.pre('save', function(next) {
  if (this.rating >= 4) {
    this.sentiment = 'positive';
  } else if (this.rating >= 2) {
    this.sentiment = 'neutral';
  } else {
    this.sentiment = 'negative';
  }
  next();
});

// Indexes
FeedbackSchema.index({ report: 1 });
FeedbackSchema.index({ user: 1 });
FeedbackSchema.index({ rating: -1 });
FeedbackSchema.index({ sentiment: 1 });
FeedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);