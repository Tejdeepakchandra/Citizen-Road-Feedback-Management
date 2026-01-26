const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../services/email.service');
const crypto = require('crypto');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone, address, city, state, pincode } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
    address,
    city,
    state,
    pincode
  });

  // Generate email verification token
  const verificationToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;

  // Send verification email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - Smart Road Management',
      template: 'email-verification',
      context: {
        name: user.name,
        verificationUrl,
        year: new Date().getFullYear()
      }
    });

    // Get signed JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// @desc    Login user with auto-redirect
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('Your account has been disabled', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login and login count
  user.lastLogin = Date.now();
  user.loginCount += 1;
  await user.save({ validateBeforeSave: false });

  // Get signed JWT token
  const token = user.getSignedJwtToken();

  // Determine redirect path based on role
  let redirectTo = '/dashboard';
  
  if (user.role === 'admin') {
    redirectTo = '/admin/dashboard';
  } else if (user.role === 'staff') {
    redirectTo = '/staff/dashboard';
  } else {
    redirectTo = '/dashboard';
  }

  // Create response
  const responseData = {
    success: true,
    token,
    redirectTo,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      staffCategory: user.staffCategory,
      preferences: user.preferences,
      stats: user.stats
    }
  };

  // Send token in cookie for web
  res.cookie('token', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.status(200).json(responseData);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user
  });
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode
  };

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');

  res.status(200).json({
    success: true,
    user
  });
});
// Add these methods to your authController.js

// @desc    Change password (with current password validation)
// @route   PUT /api/auth/changepassword
// @access  Private
// @desc    Change password (with current password validation)
// @route   PUT /api/auth/changepassword
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Validate input
  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  // Find user with password
  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send email notification
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully - Smart Road Management',
      template: 'password-changed',
      context: {
        name: user.name,
        date: new Date().toLocaleString(),
        ip: req.ip,
        year: new Date().getFullYear()
      }
    });
  } catch (error) {
    console.error('Failed to send password change email:', error);
    // Don't throw error, just log it
  }

  // Create new token with updated password
  const token = user.getSignedJwtToken();

  // Get updated user without password
  const updatedUser = await User.findById(user._id).select('-password');

  res.status(200).json({
    success: true,
    token,
    message: 'Password changed successfully',
    user: updatedUser
  });
});

// @desc    Delete user account
// @route   DELETE /api/auth/deleteaccount
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { confirmation } = req.body;
  
  if (confirmation !== 'DELETE MY ACCOUNT') {
    return next(new ErrorResponse('Please type DELETE MY ACCOUNT to confirm', 400));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check if user is admin (prevent admin self-deletion)
  if (user.role === 'admin') {
    return next(new ErrorResponse('Admin accounts cannot be deleted', 400));
  }

  // Soft delete - mark as inactive and set deletedAt
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();

  // Send goodbye email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Account Deleted Successfully - Smart Road Management',
      template: 'account-deleted',
      context: {
        name: user.name,
        date: new Date().toLocaleDateString(),
        year: new Date().getFullYear()
      }
    });
  } catch (error) {
    console.error('Failed to send account deletion email:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully. You will be logged out.'
  });
});

// @desc    Update user preferences (notifications, language, theme)
// @route   PUT /api/auth/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  const { notifications, language, theme } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }

  // Update notification preferences
  if (notifications !== undefined) {
    user.preferences.notifications = {
      ...user.preferences.notifications,
      ...notifications
    };
  }

  // Update language preferences
  if (language !== undefined) {
    user.preferences.language = {
      ...user.preferences.language,
      ...language
    };
  }

  // Update theme preferences
  if (theme !== undefined) {
    user.preferences.theme = {
      ...user.preferences.theme,
      ...theme
    };
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: user.preferences,
    message: 'Preferences updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      preferences: user.preferences
    }
  });
});
// @desc    Update theme preferences only
// @route   PUT /api/auth/theme
// @access  Private
exports.updateThemePreferences = asyncHandler(async (req, res, next) => {
  const { mode, fontSize, primaryColor } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }
  if (!user.preferences.theme) {
    user.preferences.theme = {};
  }

  // Update theme preferences
  if (mode !== undefined) user.preferences.theme.mode = mode;
  if (fontSize !== undefined) user.preferences.theme.fontSize = fontSize;
  if (primaryColor !== undefined) user.preferences.theme.primaryColor = primaryColor;

  await user.save();

  res.status(200).json({
    success: true,
    data: user.preferences.theme,
    message: 'Theme preferences updated successfully'
  });
});

// @desc    Update notification preferences only
// @route   PUT /api/auth/notifications
// @access  Private
exports.updateNotificationPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }
  if (!user.preferences.notifications) {
    user.preferences.notifications = {};
  }

  // Update notification preferences
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      user.preferences.notifications[key] = req.body[key];
    }
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: user.preferences.notifications,
    message: 'Notification preferences updated successfully'
  });
});

// @desc    Update language preferences only
// @route   PUT /api/auth/language
// @access  Private
exports.updateLanguagePreferences = asyncHandler(async (req, res, next) => {
  const { language, region, timezone, dateFormat, timeFormat } = req.body;

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Initialize preferences if not exists
  if (!user.preferences) {
    user.preferences = {};
  }
  if (!user.preferences.language) {
    user.preferences.language = {};
  }

  // Update language preferences
  if (language !== undefined) user.preferences.language.language = language;
  if (region !== undefined) user.preferences.language.region = region;
  if (timezone !== undefined) user.preferences.language.timezone = timezone;
  if (dateFormat !== undefined) user.preferences.language.dateFormat = dateFormat;
  if (timeFormat !== undefined) user.preferences.language.timeFormat = timeFormat;

  await user.save();

  // Also update user's timezone in main user record for reports
  if (timezone) {
    user.timezone = timezone;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({
    success: true,
    data: user.preferences.language,
    message: 'Language preferences updated successfully'
  });
});

// @desc    Get user preferences
// @route   GET /api/auth/preferences
// @access  Private
exports.getPreferences = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('preferences');

  const defaultPreferences = {
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      reportUpdates: true,
      donationUpdates: true,
      feedbackRequests: true,
      newsletter: false,
      marketingEmails: false
    },
    language: {
      language: 'en',
      region: 'IN',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h'
    },
    theme: {
      mode: 'system', // light, dark, system
      fontSize: 'medium' // small, medium, large
    }
  };

  res.status(200).json({
    success: true,
    data: {
      ...defaultPreferences,
      ...(user.preferences || {})
    }
  });
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url - Point to frontend, not API
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  // Send email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: 'password-reset',
      context: {
        name: user.name,
        resetUrl,
        year: new Date().getFullYear()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Email sent'
    });

  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token', 400));
  }

  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});
// @desc    Get full profile for logged-in user
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return next(new ErrorResponse("User not found", 404));
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      state: user.state,
      city: user.city,
      pincode: user.pincode,
      staffCategory: user.staffCategory,
      preferences: user.preferences
    }
  });
});


// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
};