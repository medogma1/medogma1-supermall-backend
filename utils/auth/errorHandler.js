/**
 * نظام موحد للتعامل مع الأخطاء وتسجيلها في جميع الخدمات
 */
const { errorResponse } = require('../common/responseHandler');

/**
 * أنواع الأخطاء المعروفة
 */
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  AUTHORIZATION: 'AuthorizationError',
  NOT_FOUND: 'NotFoundError',
  DUPLICATE: 'DuplicateError',
  SERVER: 'ServerError',
  DATABASE: 'DatabaseError',
  NETWORK: 'NetworkError'
};

/**
 * إنشاء خطأ مخصص
 * @param {String} message - رسالة الخطأ
 * @param {String} type - نوع الخطأ
 * @param {Number} statusCode - رمز الحالة HTTP
 * @returns {Error} كائن الخطأ
 */
exports.createError = (message, type = ERROR_TYPES.SERVER, statusCode = 500) => {
  const error = new Error(message);
  error.type = type;
  error.statusCode = statusCode;
  return error;
};

/**
 * تسجيل الخطأ
 * @param {Error} error - كائن الخطأ
 * @param {String} serviceName - اسم الخدمة
 */
exports.logError = (error, serviceName = 'Unknown') => {
  const timestamp = new Date().toISOString();
  const errorType = error.type || 'UnknownError';
  const errorMessage = error.message || 'Unknown error';
  const errorStack = error.stack || '';

  console.error(`[${timestamp}] [${serviceName}] [${errorType}] ${errorMessage}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error(errorStack);
  }

  // يمكن إضافة تسجيل الأخطاء في ملف أو قاعدة بيانات هنا
};

/**
 * معالجة الخطأ وإرسال استجابة مناسبة
 * @param {Error} error - كائن الخطأ
 * @param {Object} res - كائن الاستجابة
 * @param {String} serviceName - اسم الخدمة
 */
exports.handleError = (error, res, serviceName = 'Unknown') => {
  // تسجيل الخطأ
  this.logError(error, serviceName);

  // تحديد رمز الحالة المناسب
  let statusCode = error.statusCode || 500;
  let errorType = error.type || ERROR_TYPES.SERVER;

  // تحديد رمز الحالة بناءً على نوع الخطأ إذا لم يتم تحديده
  if (!error.statusCode) {
    switch (errorType) {
      case ERROR_TYPES.VALIDATION:
        statusCode = 400;
        break;
      case ERROR_TYPES.AUTHENTICATION:
        statusCode = 401;
        break;
      case ERROR_TYPES.AUTHORIZATION:
        statusCode = 403;
        break;
      case ERROR_TYPES.NOT_FOUND:
        statusCode = 404;
        break;
      case ERROR_TYPES.DUPLICATE:
        statusCode = 409;
        break;
      default:
        statusCode = 500;
    }
  }

  // إرسال استجابة الخطأ باستخدام هيكل الاستجابة الموحد
  const errorDetails = {
    type: errorType,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
  
  return errorResponse(res, statusCode, error.message, errorDetails);
};

/**
 * وسيط لمعالجة الأخطاء في Express
 * @param {String} serviceName - اسم الخدمة
 * @returns {Function} وسيط Express
 */
exports.errorMiddleware = (serviceName = 'Unknown') => {
  return (err, req, res, next) => {
    this.handleError(err, res, serviceName);
  };
};

// تصدير أنواع الأخطاء
exports.ERROR_TYPES = ERROR_TYPES;