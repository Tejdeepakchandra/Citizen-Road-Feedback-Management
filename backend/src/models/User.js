const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['citizen', 'staff', 'admin'],
    default: 'citizen'
  },
  staffCategory: {
    type: String,
    enum: ['pothole', 'lighting', 'drainage', 'garbage', 'signage', null],
    default: null
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/demo/image/upload/v1690471239/default-avatar.png'
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please provide a valid phone number']
  },
  address: String,
  city: String,
  state: String,
  pincode: String,
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // UPDATED PREFERENCES SECTION
  preferences: {
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      smsNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true },
      reportUpdates: { type: Boolean, default: true },
      donationUpdates: { type: Boolean, default: true },
      feedbackRequests: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false }
    },
    language: {
      language: { type: String, default: 'en' },
      region: { type: String, default: 'IN' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      timeFormat: { type: String, default: '12h' }
    },
    theme: {
      mode: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      primaryColor: { type: String, default: '#1976d2' }
    }
  },
  
  // Timezone for reports and timestamps
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  
  // Deletion tracking
  deletedAt: Date,
  
  stats: {
    reportsSubmitted: {
      type: Number,
      default: 0
    },
    reportsResolved: {
      type: Number,
      default: 0
    },
    feedbackGiven: {
      type: Number,
      default: 0
    },
    donationsMade: {
      type: Number,
      default: 0
    },
    totalDonated: {
      type: Number,
      default: 0
    }
  },
  
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate
UserSchema.virtual('reports', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

UserSchema.virtual('feedbacks', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

UserSchema.virtual('donations', {
  ref: 'Donation',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      name: this.name,
      email: this.email
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate email verification token
UserSchema.methods.getEmailVerificationToken = function() {
  // Generate token
  const verificationToken = crypto.randomBytes(20).toString('hex');

  // Hash token
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Get formatted user data (for API responses)
UserSchema.methods.getFormattedUser = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    avatar: this.avatar,
    phone: this.phone,
    address: this.address,
    city: this.city,
    state: this.state,
    pincode: this.pincode,
    staffCategory: this.staffCategory,
    isActive: this.isActive,
    emailVerified: this.emailVerified,
    preferences: this.preferences,
    stats: this.stats,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', UserSchema);