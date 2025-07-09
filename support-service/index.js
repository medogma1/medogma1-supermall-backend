require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const supportRoutes = require('./routes/supportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات الاتصال بقاعدة البيانات MySQL
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

// Routes
app.use('/api/support', supportRoutes);

// Basic error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`Support service running on port ${PORT}`);
});