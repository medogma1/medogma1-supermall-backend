// auth-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('../utils/config');
const { pool, testConnection } = require('./config/database');
const { User } = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Configure CORS
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

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Auth] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// روت صحيّة (اختياري) يردّ نصًّا بسيطًا عند GET /
app.get('/', (req, res) => {
  res.send('✅ Auth Service is running!');
});

// راوت فحص الصحة
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint (without /auth prefix)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// هنا نثبت كل مسارات المصادقة تحت البادئة /auth
app.use('/auth', authRoutes);

// مسارات البروفايل (محميّة بالتوكن) تحت نفس البادئة /auth (داخل authRoutes يستعمل profileRoutes)
app.use('/auth', profileRoutes);

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ [Auth] Unhandled error:', error);
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
testConnection()
  .then(() => {
    console.log('✅ [Auth] Connected to MySQL');
    
    // إنشاء حساب المسؤول إذا لم يكن موجودًا
    User.createAdminIfNotExists()
      .then(created => {
        if (created) {
          console.log('✅ [Auth] تم إنشاء حساب المسؤول بنجاح');
        } else {
          console.log('ℹ️ [Auth] حساب المسؤول موجود بالفعل');
        }
      })
      .catch(err => console.error('❌ [Auth] خطأ في إنشاء حساب المسؤول:', err.message));
  })
  .catch(err => console.error('❌ [Auth] MySQL connection error:', err.message));

const PORT = config.getServicePort('auth') || 5000;
app.listen(PORT, () => {
  console.log(`🚀 [Auth] Service running on port ${PORT}`);
  console.log(`🔧 [Auth] Environment: ${config.server.nodeEnv}`);
});
