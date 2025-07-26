// order-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('../utils/config');

const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// Configure CORS with specific options
const corsOptions = {
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
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Order] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// 🏥 Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Order Service',
    database: 'MySQL (supermall_orders)',
    timestamp: new Date().toISOString()
  });
});

// 📦 [Orders] المسارات
app.use('/orders', orderRoutes);
app.use('/', orderRoutes); // إضافة route للـ root path

// 📊 [Analytics] المسارات
app.use('/analytics', analyticsRoutes);

// 🛒 [Cart] المسارات
app.use('/cart', cartRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [Order] Unhandled error:', error);
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

// 🛠️ اتصال بقاعدة البيانات MySQL
const { testConnection, initializeDatabase: initDB } = require('./config/database');

// اختبار الاتصال بقاعدة البيانات وإنشاء الجداول ثم بدء الخادم
async function initializeDatabase() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('فشل الاتصال بقاعدة البيانات');
    }
    
    // إنشاء الجداول إذا لم تكن موجودة
    await initDB();
    
    // بدء تشغيل الخادم
    const PORT = config.getServicePort('order') || 5004;
    app.listen(PORT, () => {
      console.log(`🚀 [Orders] Service running on port ${PORT}`);
      console.log(`🔧 Order Service: Environment: ${config.server.nodeEnv}`);
      console.log(`📊 [Orders] Database: ${config.database.name}`);
      console.log(`🔗 [Orders] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ [Orders] Initialization failed:', error.message);
    process.exit(1);
  }
}

// بدء تشغيل الخادم
initializeDatabase();
