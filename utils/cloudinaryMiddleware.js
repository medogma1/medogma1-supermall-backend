const config = require('./config');

// Middleware للتحقق من إعدادات Cloudinary
const checkCloudinaryConfig = (req, res, next) => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;
  
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      success: false,
      message: 'إعدادات Cloudinary غير مكتملة. يرجى التحقق من متغيرات البيئة.',
      missingConfig: {
        cloudName: !cloudName,
        apiKey: !apiKey,
        apiSecret: !apiSecret
      }
    });
  }
  
  next();
};

// Middleware للتحقق من نوع الملف للصور
const validateImageFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'لم يتم تحديد ملف للرفع'
    });
  }
  
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  
  if (!allowedImageTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedImageTypes.join(', ')}`,
      receivedType: req.file.mimetype
    });
  }
  
  next();
};

// Middleware للتحقق من حجم الملف
const validateFileSize = (maxSize = 5 * 1024 * 1024) => { // 5MB افتراضي
  return (req, res, next) => {
    if (req.file && req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `حجم الملف كبير جداً. الحد الأقصى المسموح: ${Math.round(maxSize / 1024 / 1024)}MB`,
        fileSize: req.file.size,
        maxSize: maxSize
      });
    }
    
    next();
  };
};

module.exports = {
  checkCloudinaryConfig,
  validateImageFile,
  validateFileSize
};