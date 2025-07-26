/**
 * وسيط المصادقة لخدمة المستخدمين
 * يستخدم المكتبة المشتركة للمصادقة مع إضافة التحقق من حالة المستخدم وتغيير كلمة المرور
 */
const { authenticate: sharedAuthenticate } = require('../../utils/auth/authMiddleware');
const { createError, ERROR_TYPES, handleError } = require('../../utils/auth/errorHandler');
const { errorResponse } = require('../../utils/common/responseHandler');
const User = require('../models/User');

/**
 * التحقق من المصادقة - يتحقق من وجود وصلاحية الرمز المميز
 * يمكن استخدام هذا الوسيط في أي خدمة تحتاج إلى التحقق من المستخدم
 */
exports.authenticate = async (req, res, next) => {
  try {
    // استخدام وسيط المصادقة المشترك للتحقق من صحة التوكن
    await sharedAuthenticate(req, res, async () => {
      // التحقق من وجود المستخدم
      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return errorResponse(res, 401, 'المستخدم المالك لهذا الرمز لم يعد موجودًا.');
      }
      
      // التحقق مما إذا تم تغيير كلمة المرور بعد إصدار الرمز المميز
      if (currentUser.changedPasswordAfter(req.user.iat)) {
        return errorResponse(res, 401, 'تم تغيير كلمة المرور مؤخرًا. يرجى تسجيل الدخول مرة أخرى.');
      }
    
      // التحقق من حالة المستخدم
      if (!currentUser.isActive) {
        return errorResponse(res, 401, 'تم تعطيل حسابك. يرجى الاتصال بالدعم.');
      }
      
      // إضافة المستخدم إلى الطلب
      req.user = currentUser;
      next();
    });
  } catch (err) {
    const authError = createError(
      err.message || 'غير مصرح به. يرجى تسجيل الدخول مرة أخرى.',
      ERROR_TYPES.AUTHENTICATION,
      401
    );
    handleError(authError, res, 'user-service');
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
      handleError(authError, res, 'user-service');
    }
  };
};

/**
 * التحقق من وجود المستخدم - يتحقق من وجود المستخدم دون الحاجة إلى المصادقة
 * مفيد للمسارات العامة التي تحتاج إلى معلومات المستخدم إذا كان مسجل الدخول
 */
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      // استخدام وسيط المصادقة المشترك للتحقق من صحة التوكن بدون إرجاع خطأ
      try {
        // التحقق من الرمز المميز باستخدام المكتبة المشتركة
        const jwt = require('jsonwebtoken');
        const { promisify } = require('util');
        const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
        
        // التحقق من وجود المستخدم
        const currentUser = await User.findById(decoded.id);
        if (!currentUser || !currentUser.isActive) {
          return next();
        }
        
        // التحقق من تغيير كلمة المرور
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }
        
        // هناك مستخدم مسجل الدخول
        req.user = currentUser;
        res.locals.user = currentUser;
        return next();
      } catch (error) {
        // في حالة وجود خطأ في التوكن، نتجاهله ونستمر
        return next();
      }
    }
  } catch (err) {
    // لا يوجد مستخدم مسجل الدخول
  }
  next();
};