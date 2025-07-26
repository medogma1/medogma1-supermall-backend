// Enhanced Authentication Middleware with better error handling
const jwt = require('jsonwebtoken');
const config = require('../config');
const { logger } = require('../logger');

/**
 * Custom Authentication Error Class
 */
class AuthenticationError extends Error {
  constructor(message, statusCode = 401, errorCode = 'AUTH_FAILED', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.name = 'AuthenticationError';
  }
}

/**
 * Enhanced Authentication Middleware
 */
const enhancedAuthMiddleware = {
  /**
   * Main authentication function
   */
  authenticate: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const cookieToken = req.cookies?.token;
      
      // Step 1: Extract token from header or cookie
      let token = null;
      
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7).trim();
        } else {
          token = authHeader.trim();
        }
      } else if (cookieToken) {
        token = cookieToken.trim();
      }
      
      // Step 2: Validate token presence
      if (!token || token === '') {
        throw new AuthenticationError(
          'غير مصرح - التوكن مطلوب',
          401,
          'TOKEN_MISSING',
          {
            hint: 'يجب إرسال التوكن في رأس Authorization أو في الكوكيز',
            format: 'Authorization: Bearer <token>'
          }
        );
      }
      
      // Step 3: Verify token format (basic JWT structure check)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new AuthenticationError(
          'تنسيق التوكن غير صحيح',
          401,
          'TOKEN_MALFORMED',
          {
            hint: 'التوكن يجب أن يكون بتنسيق JWT صحيح',
            receivedParts: tokenParts.length,
            expectedParts: 3
          }
        );
      }
      
      // Step 4: Verify and decode token
      let decoded;
      try {
        decoded = jwt.verify(token, config.jwt.secret);
      } catch (jwtError) {
        // Log detailed error for debugging
        logger.error('JWT verification failed', {
          error: jwtError.message,
          errorType: jwtError.name,
          tokenPreview: token.substring(0, 20) + '...',
          userAgent: req.headers['user-agent'],
          ip: req.ip || req.connection.remoteAddress,
          url: req.originalUrl,
          method: req.method
        });
        
        // Handle specific JWT errors
        if (jwtError.name === 'TokenExpiredError') {
          throw new AuthenticationError(
            'التوكن منتهي الصلاحية',
            401,
            'TOKEN_EXPIRED',
            {
              expiredAt: jwtError.expiredAt,
              hint: 'يرجى تسجيل الدخول مرة أخرى'
            }
          );
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new AuthenticationError(
            'توكن غير صالح',
            401,
            'TOKEN_INVALID',
            {
              reason: jwtError.message,
              hint: 'التوكن تالف أو تم إنشاؤه بمفتاح خاطئ'
            }
          );
        } else if (jwtError.name === 'NotBeforeError') {
          throw new AuthenticationError(
            'التوكن غير نشط بعد',
            401,
            'TOKEN_NOT_ACTIVE',
            {
              notBefore: jwtError.date,
              hint: 'التوكن سيصبح نشطاً في وقت لاحق'
            }
          );
        } else {
          throw new AuthenticationError(
            'فشل في التحقق من التوكن',
            401,
            'TOKEN_VERIFICATION_FAILED',
            {
              originalError: jwtError.message
            }
          );
        }
      }
      
      // Step 5: Validate decoded token structure
      if (!decoded || typeof decoded !== 'object') {
        throw new AuthenticationError(
          'محتوى التوكن غير صحيح',
          401,
          'TOKEN_CONTENT_INVALID',
          {
            hint: 'التوكن لا يحتوي على بيانات صحيحة'
          }
        );
      }
      
      // Step 6: Validate required fields
      if (!decoded.id) {
        throw new AuthenticationError(
          'معرف المستخدم مفقود في التوكن',
          401,
          'USER_ID_MISSING',
          {
            hint: 'التوكن يجب أن يحتوي على معرف المستخدم'
          }
        );
      }
      
      // Step 7: Add user data to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        vendorId: decoded.vendorId,
        permissions: decoded.permissions || [],
        iat: decoded.iat,
        exp: decoded.exp
      };
      
      req.authToken = token;
      req.tokenExpiry = new Date(decoded.exp * 1000);
      
      // Log successful authentication
      logger.info('Authentication successful', {
        userId: decoded.id,
        role: decoded.role,
        vendorId: decoded.vendorId,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        url: req.originalUrl,
        method: req.method
      });
      
      next();
      
    } catch (error) {
      // Handle authentication errors
      if (error instanceof AuthenticationError) {
        return res.status(error.statusCode).json({
          success: false,
          status: 'fail',
          message: error.message,
          error: error.errorCode,
          details: error.details,
          timestamp: error.timestamp
        });
      }
      
      // Handle unexpected errors
      logger.error('Unexpected authentication error', {
        error: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress
      });
      
      return res.status(500).json({
        success: false,
        status: 'error',
        message: 'خطأ داخلي في الخادم',
        error: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  },
  
  /**
   * Role-based authorization middleware
   */
  authorize: (allowedRoles = []) => {
    return (req, res, next) => {
      try {
        if (!req.user) {
          throw new AuthenticationError(
            'المصادقة مطلوبة قبل التحقق من الصلاحيات',
            401,
            'AUTHENTICATION_REQUIRED'
          );
        }
        
        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
          logger.warn('Authorization failed', {
            userId: req.user.id,
            userRole: userRole,
            allowedRoles: allowedRoles,
            url: req.originalUrl,
            method: req.method
          });
          
          return res.status(403).json({
            success: false,
            status: 'fail',
            message: 'غير مصرح - صلاحيات غير كافية',
            error: 'INSUFFICIENT_PERMISSIONS',
            details: {
              requiredRoles: allowedRoles,
              userRole: userRole
            },
            timestamp: new Date().toISOString()
          });
        }
        
        next();
      } catch (error) {
        if (error instanceof AuthenticationError) {
          return res.status(error.statusCode).json({
            success: false,
            status: 'fail',
            message: error.message,
            error: error.errorCode,
            timestamp: error.timestamp
          });
        }
        
        logger.error('Authorization error', {
          error: error.message,
          stack: error.stack
        });
        
        return res.status(500).json({
          success: false,
          status: 'error',
          message: 'خطأ في التحقق من الصلاحيات',
          error: 'AUTHORIZATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    };
  },
  
  /**
   * Vendor-specific authorization
   */
  authorizeVendor: (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError(
          'المصادقة مطلوبة',
          401,
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      const { role, vendorId: userVendorId } = req.user;
      const requestedVendorId = req.params.vendorId || req.params.id;
      
      // Admin can access any vendor data
      if (role === 'admin') {
        return next();
      }
      
      // Vendor can only access their own data
      if (role === 'vendor') {
        if (!userVendorId) {
          return res.status(403).json({
            success: false,
            status: 'fail',
            message: 'معرف البائع مفقود',
            error: 'VENDOR_ID_MISSING',
            timestamp: new Date().toISOString()
          });
        }
        
        // Flexible comparison for different data types
        if (String(userVendorId) !== String(requestedVendorId)) {
          logger.warn('Vendor authorization failed', {
            userId: req.user.id,
            userVendorId: userVendorId,
            requestedVendorId: requestedVendorId,
            url: req.originalUrl
          });
          
          return res.status(403).json({
            success: false,
            status: 'fail',
            message: 'غير مصرح - يمكنك الوصول لبياناتك فقط',
            error: 'VENDOR_ACCESS_DENIED',
            timestamp: new Date().toISOString()
          });
        }
        
        return next();
      }
      
      // Other roles are not allowed
      return res.status(403).json({
        success: false,
        status: 'fail',
        message: 'غير مصرح - صلاحيات غير كافية',
        error: 'INSUFFICIENT_PERMISSIONS',
        details: {
          userRole: role,
          allowedRoles: ['admin', 'vendor']
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Vendor authorization error', {
        error: error.message,
        stack: error.stack
      });
      
      return res.status(500).json({
        success: false,
        status: 'error',
        message: 'خطأ في التحقق من صلاحيات البائع',
        error: 'VENDOR_AUTHORIZATION_ERROR',
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = enhancedAuthMiddleware;
module.exports.AuthenticationError = AuthenticationError;