// product-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('../utils/config');
const { testConnection, initializeDatabase } = require('./config/database');

const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const searchRoutes = require('./routes/searchRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const bannerRoutes = require('./routes/bannerRoutes');

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

// JSON parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('❌ [Product] JSON parsing error:', error.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(error);
});

// نقطة فحص الصحة - يجب أن تكون قبل مسارات المنتجات
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Product Service',
    database: 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// روت الصحة
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'خدمة المنتجات تعمل بشكل صحيح' });
});

// مسارات المنتجات
app.use('/products', productRoutes);

// مسارات المراجعات
app.use('/reviews', reviewRoutes);

// مسارات البحث
app.use('/search', searchRoutes);

// مسارات الفئات
app.use('/categories', categoryRoutes);

// مسارات المفضلات
app.use('/favorites', favoriteRoutes);

// مسارات البنرات
app.use('/banners', bannerRoutes);

// مسارات الإدارة للمنتجات
app.use('/admin/products', productRoutes);

// مسارات الإدارة للبنرات
app.use('/admin/banners', bannerRoutes);

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'حدث خطأ في الخادم',
    error: config.isDevelopment() ? err.message : undefined
  });
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'المسار غير موجود'
  });
});

// تهيئة قاعدة البيانات وبدء الخادم
async function startServer() {
  try {
    // اختبار الاتصال
    await testConnection();
    
    // تهيئة قاعدة البيانات
    await initializeDatabase();
    
    // بدء الخادم
    const PORT = config.getServicePort('product') || 5003;
    app.listen(PORT, () => {
      console.log(`🚀 Product Service: Server running on port ${PORT}`);
      console.log(`🔧 Product Service: Environment: ${config.server.nodeEnv}`);
      console.log(`📊 Product Service: Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Product Service: Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();

// معالجة إيقاف التطبيق بشكل صحيح
process.on('SIGINT', async () => {
  console.log('\n🔄 Product Service: Shutting down gracefully...');
  const { closeConnection } = require('./config/database');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Product Service: Shutting down gracefully...');
  const { closeConnection } = require('./config/database');
  await closeConnection();
  process.exit(0);
});
