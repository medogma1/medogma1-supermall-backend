const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();
const config = require('../utils/config');

const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Chat] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// إعدادات الاتصال بقاعدة البيانات MySQL
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

// اختبار الاتصال بقاعدة البيانات
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [Chat] تم الاتصال بقاعدة بيانات MySQL بنجاح');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [Chat] فشل الاتصال بقاعدة بيانات MySQL:', error.message);
    return false;
  }
}

// اختبار الاتصال بقاعدة البيانات
testConnection();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'chat-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// المسارات
app.use('/api/chat', chatRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [Chat] Unhandled error:', error);
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

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'حدث خطأ في الخادم',
    ...(config.isDevelopment() && { stack: err.stack })
  });
});

// تشغيل الخادم
const PORT = config.getServicePort('chat');
app.listen(PORT, () => {
  console.log(`خدمة الدردشة تعمل على المنفذ ${PORT}`);
  console.log(`البيئة: ${config.server.nodeEnv}`);
});