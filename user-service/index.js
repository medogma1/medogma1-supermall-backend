// user-service/index.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// تحميل متغيرات البيئة
dotenv.config();

// استيراد المسارات
const userRoutes = require('./routes/userRoutes');

// إنشاء تطبيق Express
const app = express();

// إعداد اتصال قاعدة البيانات MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء تجمع اتصالات MySQL
const pool = mysql.createPool(dbConfig);
global.db = pool; // جعل اتصال قاعدة البيانات متاحًا عالميًا

// الوسائط (Middleware)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

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
    message: err.message
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
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`🚀 خدمة المستخدمين تعمل على المنفذ ${PORT}`);
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