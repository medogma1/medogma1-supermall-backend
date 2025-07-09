const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'غير مصرح - التوكن مطلوب' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // التحقق من صحة التوكن باستخدام السر المخزن في ملف التكوين
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // إضافة بيانات المستخدم المشفرة إلى الطلب
    req.user = decoded;
    
    // التحقق من وجود معرف البائع إذا كان المستخدم بائعًا
    if (decoded.role === 'vendor' && !decoded.vendorId) {
      return res.status(403).json({ message: 'غير مصرح - معلومات البائع غير متوفرة' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'توكن غير صالح', error: error.message });
  }
};