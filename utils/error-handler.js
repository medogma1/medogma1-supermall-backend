/**
 * وحدة معالجة الأخطاء الموحدة
 * توفر دوال موحدة للتعامل مع الأخطاء وتسجيلها عبر جميع الخدمات
 */

const { logger } = require('./logger');

/**
 * أنواع الأخطاء المعرفة في النظام
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'ValidationError',
  AUTHENTICATION_ERROR: 'AuthenticationError',
  AUTHORIZATION_ERROR: 'AuthorizationError',
  NOT_FOUND_ERROR: 'NotFoundError',
  DATABASE_ERROR: 'DatabaseError',
  EXTERNAL_SERVICE_ERROR: 'ExternalServiceError',
  BUSINESS_LOGIC_ERROR: 'BusinessLogicError',
  INTERNAL_SERVER_ERROR: 'InternalServerError'
};

/**
 * فئة الخطأ الأساسية للنظام
 */
class AppError extends Error {
  /**
   * إنشاء خطأ جديد
   * @param {string} message - رسالة الخطأ
   * @param {string} type - نوع الخطأ
   * @param {number} statusCode - رمز حالة HTTP
   * @param {Object} details - تفاصيل إضافية عن الخطأ
   */
  constructor(message, type = ErrorTypes.INTERNAL_SERVER_ERROR, statusCode = 500, details = {}) {
    super(message);
    this.name = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * إنشاء خطأ تحقق من الصحة
 * @param {string} message - رسالة الخطأ
 * @param {Object} details - تفاصيل الخطأ
 * @returns {AppError} - كائن الخطأ
 */
function createValidationError(message, details = {}) {
  return new AppError(message, ErrorTypes.VALIDATION_ERROR, 400, details);
}

/**
 * إنشاء خطأ مصادقة
 * @param {string} message - رسالة الخطأ
 * @returns {AppError} - كائن الخطأ
 */
function createAuthenticationError(message = 'غير مصرح لك بالوصول') {
  return new AppError(message, ErrorTypes.AUTHENTICATION_ERROR, 401);
}

/**
 * إنشاء خطأ تفويض
 * @param {string} message - رسالة الخطأ
 * @returns {AppError} - كائن الخطأ
 */
function createAuthorizationError(message = 'ليس لديك صلاحية للقيام بهذا الإجراء') {
  return new AppError(message, ErrorTypes.AUTHORIZATION_ERROR, 403);
}

/**
 * إنشاء خطأ عنصر غير موجود
 * @param {string} entity - اسم الكيان
 * @param {string|number} id - معرف الكيان
 * @returns {AppError} - كائن الخطأ
 */
function createNotFoundError(entity, id) {
  const message = id ? `${entity} برقم ${id} غير موجود` : `${entity} غير موجود`;
  return new AppError(message, ErrorTypes.NOT_FOUND_ERROR, 404);
}

/**
 * إنشاء خطأ قاعدة بيانات
 * @param {string} message - رسالة الخطأ
 * @param {Object} details - تفاصيل الخطأ
 * @returns {AppError} - كائن الخطأ
 */
function createDatabaseError(message, details = {}) {
  return new AppError(
    message || 'حدث خطأ في قاعدة البيانات',
    ErrorTypes.DATABASE_ERROR,
    500,
    details
  );
}

/**
 * إنشاء خطأ خدمة خارجية
 * @param {string} service - اسم الخدمة
 * @param {string} message - رسالة الخطأ
 * @param {Object} details - تفاصيل الخطأ
 * @returns {AppError} - كائن الخطأ
 */
function createExternalServiceError(service, message, details = {}) {
  return new AppError(
    message || `حدث خطأ في الاتصال بخدمة ${service}`,
    ErrorTypes.EXTERNAL_SERVICE_ERROR,
    502,
    details
  );
}

/**
 * إنشاء خطأ منطق الأعمال
 * @param {string} message - رسالة الخطأ
 * @returns {AppError} - كائن الخطأ
 */
function createBusinessLogicError(message) {
  return new AppError(message, ErrorTypes.BUSINESS_LOGIC_ERROR, 400);
}

/**
 * معالج الأخطاء العام للتعامل مع الأخطاء في Express
 * @param {Error} err - كائن الخطأ
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة التالي
 */
function errorHandler(err, req, res, next) {
  // تسجيل الخطأ
  logError(err, req);

  // التحقق مما إذا كان الخطأ من نوع AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        type: err.name,
        message: err.message,
        ...(process.env.NODE_ENV !== 'production' && { details: err.details }),
      },
      timestamp: err.timestamp
    });
  }

  // التعامل مع أخطاء التحقق من Joi/Express-validator
  if (err.name === 'ValidationError' || err.name === 'BadRequestError') {
    return res.status(400).json({
      success: false,
      error: {
        type: ErrorTypes.VALIDATION_ERROR,
        message: err.message,
        details: err.details || err.errors
      },
      timestamp: new Date().toISOString()
    });
  }

  // التعامل مع أخطاء JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        type: ErrorTypes.AUTHENTICATION_ERROR,
        message: 'جلسة غير صالحة، يرجى تسجيل الدخول مرة أخرى'
      },
      timestamp: new Date().toISOString()
    });
  }

  // التعامل مع أخطاء قاعدة البيانات
  if (err.code && (err.code.startsWith('ER_') || err.errno)) {
    return res.status(500).json({
      success: false,
      error: {
        type: ErrorTypes.DATABASE_ERROR,
        message: 'حدث خطأ في قاعدة البيانات',
        ...(process.env.NODE_ENV !== 'production' && { details: err.message })
      },
      timestamp: new Date().toISOString()
    });
  }

  // الخطأ الافتراضي
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      type: ErrorTypes.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'حدث خطأ في الخادم' 
        : err.message || 'حدث خطأ في الخادم'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * تسجيل الخطأ في نظام التسجيل
 * @param {Error} err - كائن الخطأ
 * @param {Object} req - كائن الطلب
 */
function logError(err, req = {}) {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    ...(req.method && {
      request: {
        method: req.method,
        url: req.originalUrl || req.url,
        headers: req.headers ? {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'authorization': req.headers['authorization'] ? 'REDACTED' : undefined
        } : {},
        query: req.query,
        body: sanitizeRequestBody(req.body)
      }
    }),
    ...(err.details && { details: err.details })
  };

  // تحديد مستوى السجل بناءً على رمز الحالة
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logger.error('خطأ خادم:', errorInfo);
  } else if (statusCode >= 400) {
    logger.warn('خطأ عميل:', errorInfo);
  } else {
    logger.info('معلومات خطأ:', errorInfo);
  }
}

/**
 * تنظيف بيانات الطلب من المعلومات الحساسة قبل التسجيل
 * @param {Object} body - جسم الطلب
 * @returns {Object} - جسم الطلب المنظف
 */
function sanitizeRequestBody(body) {
  if (!body) return {};
  
  const sensitiveFields = ['password', 'passwordConfirmation', 'currentPassword', 'newPassword', 'token', 'accessToken', 'refreshToken', 'apiKey'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = 'REDACTED';
    }
  });
  
  return sanitized;
}

module.exports = {
  AppError,
  ErrorTypes,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createDatabaseError,
  createExternalServiceError,
  createBusinessLogicError,
  errorHandler,
  logError
};