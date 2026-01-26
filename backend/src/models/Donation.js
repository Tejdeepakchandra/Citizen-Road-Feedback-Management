const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Anonymous'
  },
  email: {
    type: String,
    required: true
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  cause: {
    type: String,
    enum: ['general', 'pothole', 'lighting', 'greenery', 'safety'],
    default: 'general'
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide donation amount'],
    min: [10, 'Minimum donation amount is ₹10']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot be more than 500 characters']
  },
  status: {
    type: String,
    enum: ['created', 'pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'created'
  },
  paymentMethod: String,
  bank: String,
  wallet: String,
  vpa: String,
  contact: String,
  fee: Number,
  tax: Number,
  completedAt: Date,
  refundedAt: Date,
  adminNotes: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String,
    razorpayOrder: Object
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
DonationSchema.index({ user: 1 });
DonationSchema.index({ status: 1 });
DonationSchema.index({ createdAt: -1 });
DonationSchema.index({ orderId: 1 });
DonationSchema.index({ paymentId: 1 });

// Virtual for formatted amount
DonationSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Virtual for isRecent (within 24 hours)
DonationSchema.virtual('isRecent').get(function() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > twentyFourHoursAgo;
});

module.exports = mongoose.model('Donation', DonationSchema);