/**
 * وسيط المصادقة لخدمة المنتجات
 * يستخدم المكتبة المشتركة للمصادقة
 */
const { authenticate: sharedAuthenticate } = require('../../utils/auth/authMiddleware');
const { createError, ERROR_TYPES, handleError } = require('../../utils/auth/errorHandler');
const { errorResponse } = require('../../utils/common/responseHandler');

/**
 * التحقق من المصادقة - يتحقق من وجود وصلاحية الرمز المميز
 */
exports.authenticate = async (req, res, next) => {
  try {
    // استخدام وسيط المصادقة المشترك للتحقق من صحة التوكن
    await sharedAuthenticate(req, res, next);
  } catch (err) {
    const authError = createError(
      err.message || 'غير مصرح به. يرجى تسجيل الدخول مرة أخرى.',
      ERROR_TYPES.AUTHENTICATION,
      401
    );
    handleError(authError, res, 'product-service');
  }
};

/**
 * تقييد الوصول - يتحقق من أن المستخدم لديه الدور المطلوب
 * @param  {...string} roles - الأدوار المسموح بها
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'أنت غير مسجل الدخول. يرجى تسجيل الدخول أولاً.');
    }
    
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 403, 'ليس لديك إذن للقيام بهذا الإجراء');
    }
    
    next();
  };
};

/**
 * التحقق من ملكية المورد - يتحقق من أن المستخدم هو مالك المورد
 * @param {Function} getOwnerId - دالة للحصول على معرف المالك من الطلب
 */
exports.checkOwnership = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(res, 401, 'أنت غير مسجل الدخول. يرجى تسجيل الدخول أولاً.');
      }
      
      // السماح للمسؤولين بالوصول إلى جميع الموارد
      if (req.user.role === 'admin') {
        return next();
      }
      
      const ownerId = await getOwnerId(req);
      
      // التحقق من الملكية
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        return errorResponse(res, 403, 'ليس لديك إذن للوصول إلى هذا المورد');
      }
      
      next();
    } catch (err) {
      const authError = createError(
        err.message || 'حدث خطأ أثناء التحقق من الملكية',
        ERROR_TYPES.AUTHORIZATION,
        403
      );
      handleError(authError, res, 'product-service');
    }
  };
};