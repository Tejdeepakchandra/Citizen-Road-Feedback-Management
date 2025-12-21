const mongoose = require('mongoose');

const StaffAssignmentSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  estimatedCompletion: Date,
  actualCompletion: Date,
  status: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'cancelled', 'reassigned'],
    default: 'assigned'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: String,
  progressUpdates: [{
    date: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      min: 0,
      max: 100
    },
    description: String,
    images: [{
      url: String,
      public_id: String,
      caption: String
    }]
  }],
  completionDetails: {
    completedAt: Date,
    description: String,
    cost: Number,
    materialsUsed: [String],
    workHours: Number,
    images: [{
      url: String,
      public_id: String,
      caption: String
    }]
  },
  feedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  reassignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reassignedAt: Date,
  reassignedReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
StaffAssignmentSchema.index({ staff: 1, status: 1 });
StaffAssignmentSchema.index({ report: 1 });
StaffAssignmentSchema.index({ assignedBy: 1 });
StaffAssignmentSchema.index({ assignedAt: -1 });
StaffAssignmentSchema.index({ estimatedCompletion: 1 });
StaffAssignmentSchema.index({ priority: -1 });

// Virtual for days assigned
StaffAssignmentSchema.virtual('daysAssigned').get(function() {
  return Math.ceil((new Date() - this.assignedAt) / (1000 * 60 * 60 * 24));
});

// Virtual for isOverdue
StaffAssignmentSchema.virtual('isOverdue').get(function() {
  if (!this.estimatedCompletion || this.status === 'completed') return false;
  return new Date() > this.estimatedCompletion;
});

// Virtual for current progress
StaffAssignmentSchema.virtual('currentProgress').get(function() {
  if (this.progressUpdates.length === 0) return 0;
  const latestUpdate = this.progressUpdates[this.progressUpdates.length - 1];
  return latestUpdate.progress;
});

module.exports = mongoose.model('StaffAssignment', StaffAssignmentSchema);