/**
 * Authentication middleware for API Gateway
 * Uses shared authentication library
 */
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config/config');

// Simple error response helper
const errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

/**
 * Middleware to verify token validity
 */
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return errorResponse(res, 401, 'You are not logged in. Please log in first.');
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET || 'supermall_secret_key_2024');
    
    // Set user in request
    req.user = decoded;
    
    next();
  } catch (err) {
    return errorResponse(res, 401, 'Invalid token. Please log in again.');
  }
};

/**
 * Middleware to check user permissions
 * @param  {...String} roles - Roles allowed to access
 * @returns {Function} Express middleware
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, 'You are not logged in. Please log in first.');
      }
      
      if (!roles.includes(req.user.role)) {
        return errorResponse(res, 403, 'You do not have permission to perform this action');
      }
      
      next();
    } catch (err) {
      return errorResponse(res, 403, 'Error in permission verification');
    }
  };
};

/**
 * Middleware to verify that user is resource owner or admin
 * @param {Function} getResourceUserId - Function to get resource owner ID
 * @returns {Function} Express middleware
 */
exports.restrictToOwnerOrAdmin = (getResourceUserId) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, 'Must log in first');
      }

      // If user is admin, allow access
      if (req.user.role === 'admin') {
        return next();
      }

      // Get resource owner ID
      const resourceUserId = getResourceUserId(req);

      // Verify that user is resource owner
      if (req.user.id !== resourceUserId) {
        return errorResponse(res, 403, 'You do not have permission to access this resource');
      }

      next();
    } catch (err) {
      const authError = createError(
        err.message || 'Error in permission verification',
        ERROR_TYPES.AUTHORIZATION,
        403
      );
      handleError(authError, res, 'api-gateway');
    }
  };
};