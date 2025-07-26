// vendor-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// استيراد ملفات التكوين والتسجيل
const config = require('../utils/config');
// const { logger } = require('../utils/logger');
const { testConnection, initializeDatabase } = require('./config/database');

// استيراد الوسائط البرمجية للمصادقة
const authMiddleware = require('./middleware/authMiddleware');

// استيراد مسارات API
const vendorRoutes = require('./routes/vendorroutes');
const serviceRoutes = require('./routes/serviceRoutes');
const reviewRoutes = require('./routes/reviewRoutes');


// إنشاء تطبيق Express
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

// إعداد الوسائط البرمجية
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Vendor] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// مجلد الملفات الثابتة للصور المرفوعة
app.use('/uploads', express.static(path.join(__dirname, config.upload.uploadDir)));

// روت صحيّة (اختياري) يردّ نصًّا بسيطًا عند GET /
app.get('/', (req, res) => {
  res.send('✅ Vendor Service is up and running!');
});

// مسار صحي لا يحتاج إلى مصادقة
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'vendor-service' });
});



// هنا نثبت كل مسارات Vendor تحت البادئة /api/v1/vendors
app.use('/api/v1/vendors', vendorRoutes);

// هنا نثبت كل مسارات Service تحت البادئة /api/v1/services
app.use('/api/v1/services', serviceRoutes);

// تحديد مسارات التقييمات
app.use('/api/v1/vendors', reviewRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [Vendor] Unhandled error:', error);
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

// اختبار الاتصال بقاعدة البيانات MySQL
async function startServer() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ [Vendor] Failed to connect to MySQL database. Exiting...');
      process.exit(1);
    }
    
    // تهيئة قاعدة البيانات
    await initializeDatabase();
    
    // بدء تشغيل الخادم
    const PORT = config.getServicePort('vendor') || 5005;
    app.listen(PORT, () => {
      console.log(`🚀 [Vendor] Service running on port ${PORT} in ${config.server.nodeEnv} mode`);
      console.log(`🔧 Vendor Service: Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error(`❌ [Vendor] Server startup error: ${error.message}`);
    process.exit(1);
  }
}

// معالج للأخطاء غير المعالجة
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // لا نخرج من العملية، فقط نسجل الخطأ
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// بدء تشغيل الخادم
startServer();
