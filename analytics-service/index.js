// analytics-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mysql = require('mysql2/promise');

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

// مسار الصحة للتحقق من حالة الخدمة
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'analytics-service' });
});

// 🛠️ اتصال بقاعدة البيانات MySQL
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
const initializeDatabase = async () => {
  try {
    const pool = mysql.createPool(dbConfig);
    
    // التحقق من الاتصال
    const connection = await pool.getConnection();
    console.log('✅ [Analytics] Connected to MySQL Database');
    connection.release();
    
    // بدء الخادم بعد التأكد من الاتصال بقاعدة البيانات
    app.listen(process.env.PORT, () =>
      console.log(`🚀 [Analytics] Service running on port ${process.env.PORT}`)
    );
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    process.exit(1);
  }
};

// بدء التطبيق
initializeDatabase();