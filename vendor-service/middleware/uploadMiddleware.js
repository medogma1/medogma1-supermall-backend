/**
 * Upload Middleware for Vendor Service
 * SuperMall Backend
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد uploads إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// إعداد التخزين
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // إنشاء اسم ملف فريد
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// فلتر الملفات
const fileFilter = (req, file, cb) => {
  console.log('📁 File upload attempt:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // قائمة امتدادات الصور المسموحة
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  // التحقق من نوع الملف أو امتداده (للتعامل مع مشكلة Flutter Web)
  const isValidMimeType = file.mimetype.startsWith('image/');
  const isValidExtension = allowedExtensions.includes(fileExtension);
  const isFlutterWebFile = file.mimetype === 'application/octet-stream' && isValidExtension;
  
  if (isValidMimeType || isFlutterWebFile) {
    console.log('✅ File accepted:', file.originalname, '- MIME:', file.mimetype, '- Extension:', fileExtension);
    cb(null, true);
  } else {
    console.log('❌ File rejected - Invalid type:', file.mimetype, '- Extension:', fileExtension);
    cb(new Error(`يُسمح بالصور فقط. نوع الملف المرسل: ${file.mimetype}, امتداد الملف: ${fileExtension}`), false);
  }
};

// إعداد multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;