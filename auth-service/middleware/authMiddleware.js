/**
 * وسيط المصادقة لخدمة المصادقة
 * يستخدم المكتبة المشتركة للمصادقة مع إضافة التحقق من وجود المستخدم في قاعدة البيانات
 */
const { authenticate } = require('../../utils/auth/authMiddleware');
const { User } = require('../models/User');
const { createError, ERROR_TYPES } = require('../../utils/auth/errorHandler');

/**
 * وسيط للتحقق من صحة التوكن ووجود المستخدم
 */
module.exports = async (req, res, next) => {
  try {
    // استخدام وسيط المصادقة المشترك للتحقق من صحة التوكن
    await authenticate(req, res, async () => {
      // التحقق من وجود المستخدم في قاعدة البيانات
      const userId = req.user.userId || req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'المستخدم غير موجود'
        });
      }
      
      // إضافة كائن المستخدم الكامل إلى الطلب
      req.userDocument = user;
      next();
    });
  } catch (error) {
    const authError = createError(
      error.message || 'خطأ في المصادقة',
      ERROR_TYPES.AUTHENTICATION,
      401
    );
    return res.status(401).json({
      status: 'fail',
      message: authError.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
