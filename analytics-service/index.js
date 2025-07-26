// analytics-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mysql = require('mysql2/promise');
const config = require('../utils/config');
const { handleError } = require('../utils/auth/errorHandler');

const analyticsRoutes = require('./routes/analyticsRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const { apiPerformanceLogger } = require('./middleware/performanceMiddleware');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// تطبيق وسيط تسجيل أداء API على جميع الطلبات
app.use(apiPerformanceLogger);

// 📊 [Analytics] المسارات
app.use('/analytics', analyticsRoutes);

// 🚀 [Performance] المسارات
app.use('/performance', performanceRoutes);

// استيراد معالج الاستجابة الموحد
const { successResponse } = require('../utils/common/responseHandler');

// مسار الصحة للتحقق من حالة الخدمة
app.get('/health', (req, res) => {
  successResponse(res, 200, 'الخدمة تعمل بشكل طبيعي', { service: 'analytics-service', status: 'ok' });
});

// معالجة المسارات غير الموجودة
app.use((req, res, next) => {
  const error = new Error(`المسار غير موجود - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// وسيط معالجة الأخطاء المشترك
app.use((err, req, res, next) => {
  handleError(err, res, 'analytics-service');
});

// 🛠️ اتصال بقاعدة البيانات MySQL
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
const initializeDatabase = async () => {
  try {
    const pool = mysql.createPool(dbConfig);
    
    // التحقق من الاتصال
    const connection = await pool.getConnection();
    console.log('✅ [Analytics] Connected to MySQL Database');
    connection.release();
    
    // بدء الخادم بعد التأكد من الاتصال بقاعدة البيانات
    const PORT = config.getServicePort('analytics');
    app.listen(PORT, () => {
      console.log(`🚀 [Analytics] Service running on port ${PORT}`);
      console.log(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    process.exit(1);
  }
};

// بدء التطبيق
initializeDatabase();