const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'غير مصرح - التوكن مطلوب' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // التحقق من وجود المستخدم في قاعدة البيانات
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'المستخدم غير موجود' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'توكن غير صالح', error: error.message });
  }
};
