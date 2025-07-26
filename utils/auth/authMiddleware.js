/**
 * وسيط المصادقة المشترك لجميع الخدمات
 * يمكن استيراده واستخدامه في أي خدمة للتحقق من صحة التوكن
 */
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const config = require('../config');

/**
 * وسيط أساسي للتحقق من صحة التوكن
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للوسيط التالي
 */
exports.authenticate = async (req, res, next) => {
  try {
    console.log('🔍 [Shared Auth] Starting authentication process');
    console.log('🔍 [Shared Auth] JWT Secret:', config.jwt.secret);
    
    // 1) الحصول على التوكن من الرأس
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔍 [Shared Auth] Token extracted from Authorization header');
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
      console.log('🔍 [Shared Auth] Token extracted from cookies');
    }

    if (!token) {
      console.log('❌ [Shared Auth] No token found');
      return res.status(401).json({
        status: 'fail',
        message: 'غير مصرح - التوكن مطلوب'
      });
    }

    console.log('🔍 [Shared Auth] Token to verify:', token.substring(0, 50) + '...');
    
    // 2) التحقق من صحة التوكن
    const decoded = await promisify(jwt.verify)(token, config.jwt.secret);
    console.log('✅ [Shared Auth] Token verification successful:', decoded);

    // 3) إضافة بيانات المستخدم المشفرة إلى الطلب
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ [Shared Auth] Token verification failed:', error.message);
    console.log('❌ [Shared Auth] Error details:', error);
    return res.status(401).json({
      status: 'fail',
      message: 'توكن غير صالح',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * وسيط للتحقق من صلاحيات المستخدم
 * @param  {...String} roles - الأدوار المسموح لها بالوصول
 * @returns {Function} وسيط Express
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك صلاحية للقيام بهذا الإجراء'
      });
    }

    next();
  };
};

/**
 * وسيط للتحقق من أن المستخدم هو مالك المورد أو مسؤول
 * @param {Function} getResourceUserId - دالة للحصول على معرف مالك المورد
 * @returns {Function} وسيط Express
 */
exports.restrictToOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'يجب تسجيل الدخول أولاً'
        });
      }

      // إذا كان المستخدم مسؤولاً، السماح له بالمرور
      if (req.user.role === 'admin') {
        return next();
      }

      // الحصول على معرف مالك المورد
      const resourceUserId = await getResourceUserId(req);

      // التحقق من أن المستخدم هو مالك المورد
      if (req.user.id !== resourceUserId) {
        return res.status(403).json({
          status: 'fail',
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'حدث خطأ أثناء التحقق من الصلاحيات',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};