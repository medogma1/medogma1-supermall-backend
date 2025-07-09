const jwt = require('jsonwebtoken');

/**
 * وظيفة للتحقق من مصادقة المستخدم
 */
exports.protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'غير مصرح - التوكن مطلوب' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'توكن غير صالح', error: error.message });
  }
};

/**
 * وظيفة للتحقق من صلاحيات المستخدم
 * @param  {...string} roles - الأدوار المسموح بها
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'أنت غير مسجل الدخول. يرجى تسجيل الدخول أولاً.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'ليس لديك إذن للقيام بهذا الإجراء'
      });
    }
    
    next();
  };
};