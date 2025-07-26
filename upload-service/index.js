require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../utils/config');

const app = express();
// إعدادات CORS محسنة لدعم Flutter Web
const corsOptions = {
  origin: function (origin, callback) {
    // السماح للطلبات المحلية والتطوير
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // يمكن إضافة domains أخرى هنا للإنتاج
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// معالجة preflight requests بشكل صريح
app.options('*', cors(corsOptions));

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Upload] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// إضافة رؤوس HTTP للأمان
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// إنشاء مجلد التحميل إذا لم يكن موجوداً
const uploadDir = path.join(__dirname, config.upload.uploadDir);
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
  const allowedTypes = config.upload.allowedTypes;
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
    fileSize: config.upload.maxFileSize
  }
}).single('file');

// إضافة middleware خاص لـ Flutter Web
app.use('/upload', (req, res, next) => {
  // إضافة headers خاصة لـ Flutter Web
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // معالجة preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// مسار تحميل الملف
app.post('/upload', upload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم تحديد ملف للتحميل' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/${config.upload.uploadDir}/${req.file.filename}`;
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
        maxSize: config.upload.maxFileSize
      });
    }
    return res.status(400).json({
      success: false,
      message: `خطأ في تحميل الملف: ${error.message}`
    });
  }
  
  res.status(500).json({
    success: false,
    message: error.message || 'حدث خطأ غير متوقع',
    ...(config.isDevelopment() && { stack: error.stack })
  });
});

// تقديم الملفات بشكل ثابت
app.use(`/${config.upload.uploadDir}`, express.static(uploadDir));

// مسار للتحقق من حالة الخدمة
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'upload-service' });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [Upload] Unhandled error:', error);
  res.status(500).json({
    status: 'error',
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'المسار غير موجود',
    error: 'Route not found'
  });
});

// مسار للحصول على معلومات حول الملفات المدعومة
app.get('/info', (req, res) => {
  res.json({
    maxFileSize: config.upload.maxFileSize,
    allowedTypes: config.upload.allowedTypes
  });
});

// تشغيل الخادم
const port = config.getServicePort('upload');
app.listen(port, () => {
  console.log(`✅ خدمة التحميل تعمل على المنفذ ${port}`);
  console.log(`البيئة: ${config.server.nodeEnv}`);
});