const jwt = require('jsonwebtoken');

/**
 * وسيط المصادقة للبائعين - يتحقق من وجود وصلاحية الرمز المميز
 */
const authenticate = (req, res, next) => {
  try {
    console.log('🔍 [Vendor Auth] Starting authentication process');
    console.log('🔍 [Vendor Auth] JWT Secret:', process.env.JWT_SECRET || 'supermall_secret_key_2024');
    
    // الحصول على التوكن من الرأس
    const authHeader = req.headers.authorization;
    console.log('🔍 [Vendor Auth] Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ [Vendor Auth] No valid authorization header');
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - التوكن مطلوب'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🔍 [Vendor Auth] Token extracted from Authorization header');
    console.log('🔍 [Vendor Auth] Token to verify:', token.substring(0, 50) + '...');
    
    if (!token) {
      console.log('❌ [Vendor Auth] Token is empty');
      return res.status(401).json({
        success: false,
        message: 'غير مصرح - التوكن مطلوب'
      });
    }
    
    // التحقق من صحة التوكن
    const jwtSecret = process.env.JWT_SECRET || 'supermall_secret_key_2024';
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ [Vendor Auth] Token verification successful:', {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    });
    
    // إضافة بيانات المستخدم إلى الطلب
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ [Vendor Auth] Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      message: 'غير مصرح - التوكن غير صالح'
    });
  }
};

module.exports = { authenticate };