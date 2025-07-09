// order-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const orderRoutes = require('./routes/orderRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// 📦 [Orders] المسارات
app.use('/orders', orderRoutes);

// 📊 [Analytics] المسارات
app.use('/analytics', analyticsRoutes);

// 🛒 [Cart] المسارات
app.use('/cart', cartRoutes);

// 🛠️ اتصال بقاعدة البيانات MySQL
const mysql = require('mysql2/promise');

// إنشاء مجمع اتصالات MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// اختبار الاتصال بقاعدة البيانات ثم بدء الخادم
async function initializeDatabase() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    const connection = await pool.getConnection();
    console.log('✅ [Orders] Connected to MySQL database');
    connection.release();
    
    // بدء تشغيل الخادم
    const PORT = process.env.PORT || 5004;
    app.listen(PORT, () => {
      console.log(`🚀 [Orders] Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ [Orders] MySQL connection failed:', error.message);
    process.exit(1);
  }
}

// بدء تشغيل الخادم
initializeDatabase();
