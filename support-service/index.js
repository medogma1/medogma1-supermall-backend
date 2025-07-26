require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const config = require('../utils/config');
const supportRoutes = require('./routes/supportRoutes');

const app = express();

// Middleware
app.use(cors());

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Support] JSON parsing error:', error.message);
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

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

// اختبار الاتصال بقاعدة البيانات
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [Support] تم الاتصال بقاعدة البيانات MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [Support] خطأ في الاتصال بقاعدة البيانات MySQL:', error);
    return false;
  }
}

// اختبار الاتصال عند بدء التشغيل
testConnection();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'support-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes
app.use('/api/support', supportRoutes);
app.use('/', supportRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [Support] Unhandled error:', error);
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

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    ...(config.isDevelopment() && { stack: err.stack })
  });
});

// Start server
const PORT = config.getServicePort('support');
app.listen(PORT, () => {
  console.log(`Support service running on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
});