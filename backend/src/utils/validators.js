const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');
const Report = require('../models/Report');
const constants = require('./constants');

// Custom validation middleware
exports.validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format error response
    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors: errorMessages
    });
  };
};

// Common validation rules
exports.rules = {
  // User registration
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: constants.VALIDATION.NAME_MIN, max: constants.VALIDATION.NAME_MAX })
      .withMessage(`Name must be between ${constants.VALIDATION.NAME_MIN} and ${constants.VALIDATION.NAME_MAX} characters`),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
      .isLength({ max: constants.VALIDATION.EMAIL_MAX })
      .withMessage(`Email cannot exceed ${constants.VALIDATION.EMAIL_MAX} characters`)
      .custom(async (email) => {
        const user = await User.findOne({ email });
        if (user) {
          throw new Error('Email already in use');
        }
      }),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: constants.VALIDATION.PASSWORD_MIN })
      .withMessage(`Password must be at least ${constants.VALIDATION.PASSWORD_MIN} characters`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid Indian phone number'),
    
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    
    body('pincode')
      .optional()
      .trim()
      .matches(/^\d{6}$/).withMessage('Please provide a valid 6-digit pincode')
  ],

  // User login
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
  ],

  // Report creation
  createReport: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: constants.VALIDATION.TITLE_MIN, max: constants.VALIDATION.TITLE_MAX })
      .withMessage(`Title must be between ${constants.VALIDATION.TITLE_MIN} and ${constants.VALIDATION.TITLE_MAX} characters`),
    
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: constants.VALIDATION.DESCRIPTION_MIN, max: constants.VALIDATION.DESCRIPTION_MAX })
      .withMessage(`Description must be between ${constants.VALIDATION.DESCRIPTION_MIN} and ${constants.VALIDATION.DESCRIPTION_MAX} characters`),
    
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isIn(Object.values(constants.REPORT_CATEGORIES))
      .withMessage('Please select a valid category'),
    
    body('severity')
      .optional()
      .trim()
      .isIn(Object.values(constants.SEVERITY_LEVELS))
      .withMessage('Please select a valid severity level'),
    
    body('location.address')
      .trim()
      .notEmpty().withMessage('Address is required'),
    
    body('location.coordinates.lat')
      .notEmpty().withMessage('Latitude is required')
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude value'),
    
    body('location.coordinates.lng')
      .notEmpty().withMessage('Longitude is required')
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude value'),
    
    body('location.landmark').optional().trim(),
    body('location.ward').optional().trim(),
    body('location.zone').optional().trim()
  ],

  // Report update
  updateReport: [
    param('id')
      .isMongoId().withMessage('Invalid report ID'),
    
    body('status')
      .optional()
      .isIn(Object.values(constants.REPORT_STATUS))
      .withMessage('Invalid status value'),
    
    body('priority')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Priority must be between 1 and 5')
  ],

  // Donation creation
  createDonation: [
    body('amount')
      .notEmpty().withMessage('Amount is required')
      .isFloat({ min: 10 }).withMessage('Minimum donation amount is ₹10'),
    
    body('currency')
      .optional()
      .trim()
      .isIn(['INR', 'USD', 'EUR']).withMessage('Invalid currency'),
    
    body('message')
      .optional()
      .trim()
      .isLength({ max: constants.VALIDATION.MESSAGE_MAX })
      .withMessage(`Message cannot exceed ${constants.VALIDATION.MESSAGE_MAX} characters`)
  ],

  // Feedback creation
  createFeedback: [
    body('rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    
    body('comment')
      .optional()
      .trim()
      .isLength({ max: constants.VALIDATION.COMMENT_MAX })
      .withMessage(`Comment cannot exceed ${constants.VALIDATION.COMMENT_MAX} characters`),
    
    body('aspects.qualityOfWork')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Quality of work rating must be between 1 and 5'),
    
    body('aspects.timeliness')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Timeliness rating must be between 1 and 5'),
    
    body('aspects.communication')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
    
    body('aspects.professionalism')
      .optional()
      .isInt({ min: 1, max: 5 }).withMessage('Professionalism rating must be between 1 and 5')
  ],

  // Before/After creation
  createBeforeAfter: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
    body('category')
      .trim()
      .notEmpty().withMessage('Category is required')
      .isIn(Object.values(constants.REPORT_CATEGORIES))
      .withMessage('Please select a valid category'),
    
    body('beforeImage.url')
      .trim()
      .notEmpty().withMessage('Before image URL is required')
      .isURL().withMessage('Invalid URL for before image'),
    
    body('afterImage.url')
      .trim()
      .notEmpty().withMessage('After image URL is required')
      .isURL().withMessage('Invalid URL for after image'),
    
    body('location.address').optional().trim(),
    
    body('location.coordinates.lat')
      .optional()
      .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude value'),
    
    body('location.coordinates.lng')
      .optional()
      .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude value'),
    
    body('resolvedInDays')
      .optional()
      .isInt({ min: 0 }).withMessage('Resolved days must be a positive number'),
    
    body('cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    
    body('rating')
      .optional()
      .isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
  ],

  // User update
  updateUser: [
    param('id').isMongoId().withMessage('Invalid user ID'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: constants.VALIDATION.NAME_MIN, max: constants.VALIDATION.NAME_MAX })
      .withMessage(`Name must be between ${constants.VALIDATION.NAME_MIN} and ${constants.VALIDATION.NAME_MAX} characters`),
    
    body('email')
      .optional()
      .trim()
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
      .custom(async (email, { req }) => {
        const user = await User.findOne({ email });
        if (user && user._id.toString() !== req.params.id) {
          throw new Error('Email already in use');
        }
      }),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid Indian phone number'),
    
    body('pincode')
      .optional()
      .trim()
      .matches(/^\d{6}$/).withMessage('Please provide a valid 6-digit pincode')
  ],

  // Query parameters validation
  queryParams: [
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: constants.PAGINATION.MAX_LIMIT })
      .withMessage(`Limit must be between 1 and ${constants.PAGINATION.MAX_LIMIT}`)
      .toInt(),
    
    query('sort')
      .optional()
      .trim()
      .matches(/^[a-zA-Z_]+(?: (?:asc|desc))?$/).withMessage('Invalid sort parameter'),
    
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Search query too long')
  ],

  // ID parameter validation
  idParam: [
    param('id')
      .isMongoId().withMessage('Invalid ID format')
  ],

  // Email validation
  email: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail()
  ],

  // Password reset
  passwordReset: [
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: constants.VALIDATION.PASSWORD_MIN })
      .withMessage(`Password must be at least ${constants.VALIDATION.PASSWORD_MIN} characters`)
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('confirmPassword')
      .trim()
      .notEmpty().withMessage('Confirm password is required')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match');
        }
        return true;
      })
  ],

  // Status update
  statusUpdate: [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(Object.values(constants.REPORT_STATUS))
      .withMessage('Invalid status value'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters')
  ],

  // Progress update
  progressUpdate: [
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    
    body('percentage')
      .notEmpty().withMessage('Percentage is required')
      .isInt({ min: 0, max: 100 }).withMessage('Percentage must be between 0 and 100')
      .toInt()
  ],

  // Assignment
  assignment: [
    body('staffId')
      .notEmpty().withMessage('Staff ID is required')
      .isMongoId().withMessage('Invalid staff ID')
  ],

  // Completion
  completion: [
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    
    body('cost')
      .optional()
      .isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
    
    body('workHours')
      .optional()
      .isInt({ min: 0 }).withMessage('Work hours must be a positive number')
      .toInt(),
    
    body('materialsUsed')
      .optional()
      .isString().withMessage('Materials used must be a string')
  ]
};

// Custom validators
exports.customValidators = {
  // Check if user exists
  userExists: async (userId) => {
    const user = await User.findById(userId);
    return !!user;
  },

  // Check if report exists
  reportExists: async (reportId) => {
    const report = await Report.findById(reportId);
    return !!report;
  },

  // Check if user can update report
  canUpdateReport: async (reportId, userId, userRole) => {
    const report = await Report.findById(reportId);
    if (!report) return false;
    
    // Admins can update anything
    if (userRole === 'admin') return true;
    
    // Users can update their own reports
    if (report.user.toString() === userId) return true;
    
    // Staff can update if assigned
    if (userRole === 'staff' && report.assignedTo && report.assignedTo.toString() === userId) {
      return true;
    }
    
    return false;
  },

  // Check if coordinates are valid
  isValidCoordinates: (lat, lng) => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  },

  // Check if date is in the future
  isFutureDate: (date) => {
    return new Date(date) > new Date();
  },

  // Check if date is in the past
  isPastDate: (date) => {
    return new Date(date) < new Date();
  },

  // Check if value is within range
  isInRange: (value, min, max) => {
    return value >= min && value <= max;
  },

  // Check if array has unique values
  hasUniqueValues: (array) => {
    return new Set(array).size === array.length;
  }
};

// Sanitization functions
exports.sanitize = {
  // Trim all string fields
  trimStrings: (req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    next();
  },

  // Convert email to lowercase
  normalizeEmail: (req, res, next) => {
    if (req.body.email) {
      req.body.email = req.body.email.toLowerCase().trim();
    }
    next();
  },

  // Parse numbers
  parseNumbers: (fields) => {
    return (req, res, next) => {
      fields.forEach(field => {
        if (req.body[field] !== undefined && !isNaN(req.body[field])) {
          req.body[field] = parseFloat(req.body[field]);
        }
      });
      next();
    };
  },

  // Parse booleans
  parseBooleans: (fields) => {
    return (req, res, next) => {
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          if (req.body[field] === 'true' || req.body[field] === '1') {
            req.body[field] = true;
          } else if (req.body[field] === 'false' || req.body[field] === '0') {
            req.body[field] = false;
          }
        }
      });
      next();
    };
  },

  // Parse arrays
  parseArrays: (fields) => {
    return (req, res, next) => {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch {
            req.body[field] = req.body[field].split(',').map(item => item.trim());
          }
        }
      });
      next();
    };
  }
};