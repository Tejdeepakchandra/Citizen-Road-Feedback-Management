// models/Gallery.js - UPDATED
const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  // Add this field to reference the galleryImage in Report
  galleryImageRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report.galleryImages',
    required: true,
    unique: true // Ensure one gallery entry per gallery image
  },
  
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  
  beforeImage: {
    originalImageId: mongoose.Schema.Types.ObjectId,
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
  
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  category: {
    type: String,
    enum: ['pothole', 'drainage', 'lighting', 'garbage', 'signage', 'other'],
    required: true
  },
  
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  featured: {
    type: Boolean,
    default: false
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  likeCount: {
    type: Number,
    default: 0
  },
  
  tags: [String],
  
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
GallerySchema.index({ category: 1 });
GallerySchema.index({ featured: -1 });
GallerySchema.index({ 'location.coordinates': '2dsphere' });
GallerySchema.index({ approvedAt: -1 });
GallerySchema.index({ likeCount: -1 });
GallerySchema.index({ galleryImageRef: 1 }, { unique: true }); // Unique index

module.exports = mongoose.model('Gallery', GallerySchema);