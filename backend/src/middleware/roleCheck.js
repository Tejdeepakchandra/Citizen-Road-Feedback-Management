const ErrorResponse = require('../utils/errorResponse');

// Role-based access control middleware
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`Role ${req.user.role} is not authorized to access this resource`, 403));
    }

    next();
  };
};

// Staff category check
exports.requireStaffCategory = (...categories) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required', 401));
    }

    if (req.user.role !== 'staff') {
      return next(new ErrorResponse('Only staff members can access this resource', 403));
    }

    if (categories.length > 0 && !categories.includes(req.user.staffCategory)) {
      return next(new ErrorResponse(`Staff category ${req.user.staffCategory} is not authorized`, 403));
    }

    next();
  };
};

// Ownership check (user owns the resource)
exports.requireOwnership = (modelName, paramName = 'id', userIdField = 'user') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[paramName]);

      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }

      // Check if user is admin
      if (req.user.role === 'admin') {
        return next();
      }

      // Check ownership
      const resourceUserId = resource[userIdField] ? resource[userIdField].toString() : resource[userIdField];
      
      if (resourceUserId !== req.user.id) {
        return next(new ErrorResponse('You do not own this resource', 403));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Permission check with custom condition
exports.requirePermission = (conditionFn) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await conditionFn(req);
      
      if (!hasPermission) {
        return next(new ErrorResponse('Insufficient permissions', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can update resource
exports.canUpdateResource = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[paramName]);

      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }

      // Admins can update anything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Staff can update if assigned to them
      if (req.user.role === 'staff') {
        if (resource.assignedTo && resource.assignedTo.toString() === req.user.id) {
          req.resource = resource;
          return next();
        }
      }

      // Users can update their own resources
      if (resource.user && resource.user.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }

      return next(new ErrorResponse('Not authorized to update this resource', 403));
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can delete resource
exports.canDeleteResource = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[paramName]);

      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }

      // Only admins can delete
      if (req.user.role !== 'admin') {
        return next(new ErrorResponse('Only administrators can delete resources', 403));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user can view resource
exports.canViewResource = (modelName, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const Model = require(`../models/${modelName}`);
      const resource = await Model.findById(req.params[paramName]);

      if (!resource) {
        return next(new ErrorResponse('Resource not found', 404));
      }

      // Public resources can be viewed by anyone
      if (resource.isPublic !== false) {
        req.resource = resource;
        return next();
      }

      // Private resources require authentication
      if (!req.user) {
        return next(new ErrorResponse('Authentication required to view this resource', 401));
      }

      // Admins can view anything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Users can view their own resources
      if (resource.user && resource.user.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }

      // Staff can view if assigned
      if (req.user.role === 'staff' && resource.assignedTo && resource.assignedTo.toString() === req.user.id) {
        req.resource = resource;
        return next();
      }

      return next(new ErrorResponse('Not authorized to view this resource', 403));
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting for specific roles
exports.rateLimitByRole = {
  citizen: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  staff: { windowMs: 15 * 60 * 1000, max: 300 },   // 300 requests per 15 minutes
  admin: { windowMs: 15 * 60 * 1000, max: 500 }    // 500 requests per 15 minutes
};

// API key authentication for external services
exports.requireApiKey = (validKeys = []) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return next(new ErrorResponse('API key required', 401));
    }

    if (!validKeys.includes(apiKey)) {
      return next(new ErrorResponse('Invalid API key', 401));
    }

    next();
  };
};