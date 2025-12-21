const { validationResult, body, param, query } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

// Validation middleware
exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => err.msg);
    return next(new ErrorResponse(errorMessages.join(', '), 400));
  };
};

// Custom validators
exports.customValidators = {
  // Check if value is a valid MongoDB ObjectId
  isObjectId: (value) => {
    return /^[0-9a-fA-F]{24}$/.test(value);
  },

  // Check if value is a valid latitude
  isValidLatitude: (value) => {
    return value >= -90 && value <= 90;
  },

  // Check if value is a valid longitude
  isValidLongitude: (value) => {
    return value >= -180 && value <= 180;
  },

  // Check if value is a valid phone number (Indian)
  isValidPhone: (value) => {
    return /^[6-9]\d{9}$/.test(value);
  },

  // Check if value is a valid pincode (Indian)
  isValidPincode: (value) => {
    return /^\d{6}$/.test(value);
  },

  // Check if password is strong
  isStrongPassword: (value) => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(value);
  },

  // Check if array has unique values
  isUniqueArray: (array) => {
    return new Set(array).size === array.length;
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

  // Check if value is a valid URL
  isValidUrl: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // Check if value is a valid email
  isValidEmail: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }
};

// Sanitization middleware
exports.sanitize = {
  // Trim strings
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

  // Convert to lowercase
  toLowerCase: (fields) => {
    return (req, res, next) => {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = req.body[field].toLowerCase();
        }
      });
      next();
    };
  },

  // Parse numbers
  parseNumbers: (fields) => {
    return (req, res, next) => {
      fields.forEach(field => {
        if (req.body[field] && !isNaN(req.body[field])) {
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
          if (req.body[field] === 'true' || req.body[field] === '1' || req.body[field] === 1) {
            req.body[field] = true;
          } else if (req.body[field] === 'false' || req.body[field] === '0' || req.body[field] === 0) {
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

// Validation schemas
exports.schemas = {
  // User registration
  register: [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password').trim().notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('phone').optional().trim()
      .matches(/^[6-9]\d{9}$/).withMessage('Please provide a valid phone number'),
    body('address').optional().trim(),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('pincode').optional().trim()
      .matches(/^\d{6}$/).withMessage('Please provide a valid pincode')
  ],

  // Login
  login: [
    body('email').trim().notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password').trim().notEmpty().withMessage('Password is required')
  ],

  // Report creation
  createReport: [
    body('title').trim().notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
    body('description').trim().notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required')
      .isIn(['pothole', 'drainage', 'lighting', 'garbage', 'signage', 'other'])
      .withMessage('Please select a valid category'),
    body('severity').optional().trim()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Please select a valid severity level'),
    body('location.address').trim().notEmpty().withMessage('Address is required'),
    body('location.coordinates.lat').isFloat({ min: -90, max: 90 })
      .withMessage('Invalid latitude'),
    body('location.coordinates.lng').isFloat({ min: -180, max: 180 })
      .withMessage('Invalid longitude'),
    body('landmark').optional().trim(),
    body('ward').optional().trim(),
    body('zone').optional().trim()
  ],

  // Donation
  createDonation: [
    body('amount').notEmpty().withMessage('Amount is required')
      .isFloat({ min: 10 }).withMessage('Minimum donation amount is ₹10'),
    body('currency').optional().trim()
      .isIn(['INR', 'USD', 'EUR']).withMessage('Invalid currency'),
    body('message').optional().trim()
      .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters')
  ],

  // Feedback
  createFeedback: [
    body('rating').notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim()
      .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
    body('aspects.qualityOfWork').optional()
      .isInt({ min: 1, max: 5 }).withMessage('Quality of work rating must be between 1 and 5'),
    body('aspects.timeliness').optional()
      .isInt({ min: 1, max: 5 }).withMessage('Timeliness rating must be between 1 and 5'),
    body('aspects.communication').optional()
      .isInt({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
    body('aspects.professionalism').optional()
      .isInt({ min: 1, max: 5 }).withMessage('Professionalism rating must be between 1 and 5')
  ],

  // Before/After
  createBeforeAfter: [
    body('title').trim().notEmpty().withMessage('Title is required')
      .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
    body('description').optional().trim()
      .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('category').trim().notEmpty().withMessage('Category is required')
      .isIn(['pothole', 'drainage', 'lighting', 'garbage', 'signage', 'other'])
      .withMessage('Please select a valid category'),
    body('beforeImage.url').trim().notEmpty().withMessage('Before image URL is required'),
    body('afterImage.url').trim().notEmpty().withMessage('After image URL is required'),
    body('location.address').optional().trim(),
    body('resolvedInDays').optional().isInt({ min: 0 }),
    body('cost').optional().isFloat({ min: 0 }),
    body('rating').optional().isFloat({ min: 1, max: 5 })
  ]
};