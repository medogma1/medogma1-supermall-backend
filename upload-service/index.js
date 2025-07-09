require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
// إعدادات CORS للأمان
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// حد حجم طلبات JSON
app.use(express.json({ limit: '1mb' }));

// إضافة رؤوس HTTP للأمان
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// إنشاء مجلد التحميل إذا لم يكن موجوداً
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// تكوين multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

// التحقق من نوع الملف
const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || '').split(',');
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`نوع الملف غير مدعوم. الأنواع المدعومة هي: ${allowedTypes.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
  }
}).single('file');

// مسار تحميل الملف
app.post('/upload', upload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم تحديد ملف للتحميل' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('خطأ في تحميل الملف:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحميل الملف',
      error: error.message
    });
  }
});

// سجل الطلبات البسيط
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// معالجة أخطاء multer
app.use((error, req, res, next) => {
  console.error('خطأ:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم الملف يتجاوز الحد المسموح به',
        maxSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
      });
    }
    return res.status(400).json({
      success: false,
      message: `خطأ في تحميل الملف: ${error.message}`
    });
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'حدث خطأ غير متوقع'
  });
});

// تقديم الملفات بشكل ثابت
app.use(`/${process.env.UPLOAD_DIR}`, express.static(uploadDir));

// مسار للتحقق من حالة الخدمة
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'upload-service' });
});

// مسار للحصول على معلومات حول الملفات المدعومة
app.get('/info', (req, res) => {
  res.json({
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || '').split(',')
  });
});

// تشغيل الخادم
const port = process.env.PORT || 5009;
app.listen(port, () => {
  console.log(`✅ خدمة التحميل تعمل على المنفذ ${port}`);
});