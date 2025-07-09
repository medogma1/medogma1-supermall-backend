// user-service/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

/**
 * التحقق من المصادقة - يتحقق من وجود وصلاحية الرمز المميز
 * يمكن استخدام هذا الوسيط في أي خدمة تحتاج إلى التحقق من المستخدم
 */
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    // الحصول على الرمز المميز من الرأس أو ملفات تعريف الارتباط
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'أنت غير مسجل الدخول. يرجى تسجيل الدخول للوصول.'
      });
    }
    
    // التحقق من الرمز المميز
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // التحقق من وجود المستخدم
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'المستخدم المالك لهذا الرمز لم يعد موجودًا.'
      });
    }
    
    // التحقق مما إذا تم تغيير كلمة المرور بعد إصدار الرمز المميز
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'تم تغيير كلمة المرور مؤخرًا. يرجى تسجيل الدخول مرة أخرى.'
      });
    }
    
    // التحقق من حالة المستخدم
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'تم تعطيل حسابك. يرجى الاتصال بالدعم.'
      });
    }
    
    // إضافة المستخدم إلى الطلب
    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'غير مصرح به. يرجى تسجيل الدخول مرة أخرى.'
    });
  }
};

/**
 * تقييد الوصول - يتحقق من أن المستخدم لديه الدور المطلوب
 * @param  {...string} roles - الأدوار المسموح بها
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'أنت غير مسجل الدخول. يرجى تسجيل الدخول أولاً.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك إذن للقيام بهذا الإجراء'
      });
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
        return res.status(401).json({
          status: 'fail',
          message: 'أنت غير مسجل الدخول. يرجى تسجيل الدخول أولاً.'
        });
      }
      
      // السماح للمسؤولين بالوصول إلى جميع الموارد
      if (req.user.role === 'admin') {
        return next();
      }
      
      const ownerId = await getOwnerId(req);
      
      // التحقق من الملكية
      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          status: 'fail',
          message: 'ليس لديك إذن للوصول إلى هذا المورد'
        });
      }
      
      next();
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: 'حدث خطأ أثناء التحقق من الملكية'
      });
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
      // التحقق من الرمز المميز
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      
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
    }
  } catch (err) {
    // لا يوجد مستخدم مسجل الدخول
  }
  next();
};