const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    // استخراج التوكن من رأس الطلب
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'غير مصرح به - التوكن مفقود' });
    }

    const token = authHeader.split(' ')[1];

    try {
      // التحقق من صحة التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // إضافة معلومات المستخدم إلى الطلب
      req.user = {
        id: decoded.userId,
        role: decoded.role,
        vendorId: decoded.vendorId
      };
      
      next();
    } catch (error) {
      return res.status(401).json({ message: 'غير مصرح به - التوكن غير صالح' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};