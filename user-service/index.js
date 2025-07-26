// user-service/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const config = require('../utils/config');

// تحميل متغيرات البيئة
dotenv.config();

// استيراد المسارات
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

// إنشاء تطبيق Express
const app = express();

// إعداد اتصال قاعدة البيانات MySQL
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء تجمع اتصالات MySQL
const pool = mysql.createPool(dbConfig);
global.db = pool; // جعل اتصال قاعدة البيانات متاحًا عالميًا

// الوسائط (Middleware)
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins during development
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Check against configured frontend URL
    if (origin === config.server.frontendUrl) {
      return callback(null, true);
    }
    
    // Reject other origins
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
}));

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [User] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// مسار فحص الصحة
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'خدمة المستخدمين تعمل بشكل جيد',
    timestamp: new Date().toISOString()
  });
});

// تسجيل المسارات
app.use('/api/v1/users', userRoutes);

// مسارات الإدارة للمستخدمين (يتم توجيهها من API Gateway)
app.use('/', adminRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [User] Unhandled error:', error);
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

// معالجة المسارات غير الموجودة
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `لا يمكن العثور على ${req.originalUrl} على هذا الخادم!`
  });
});

// معالجة الأخطاء العامة
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: config.isDevelopment() ? err.stack : undefined
  });
});

// إنشاء اتصال بقاعدة البيانات وبدء الخادم
const initializeDatabase = async () => {
  try {
    // التحقق من الاتصال
    const connection = await pool.getConnection();
    console.log('✅ تم الاتصال بقاعدة البيانات MySQL بنجاح');
    connection.release();
    
    // بدء الخادم بعد التأكد من الاتصال بقاعدة البيانات
    const PORT = config.getServicePort('user') || 5002;
    app.listen(PORT, () => {
      console.log(`🚀 خدمة المستخدمين تعمل على المنفذ ${PORT}`);
      console.log(`🔧 User Service: Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات MySQL:', error);
    process.exit(1);
  }
};

// بدء التطبيق
initializeDatabase();

// معالجة الإنهاء غير المتوقع
process.on('unhandledRejection', (err) => {
  console.error('خطأ غير معالج:', err.name, err.message);
  console.error('إغلاق الخادم...');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('استثناء غير معالج:', err.name, err.message);
  console.error('إغلاق الخادم...');
  process.exit(1);
});