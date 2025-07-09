const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات الاتصال بقاعدة البيانات MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
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

// المسارات
app.use('/api/chat', chatRoutes);

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'حدث خطأ في الخادم' });
});

// تشغيل الخادم
const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
  console.log(`خدمة الدردشة تعمل على المنفذ ${PORT}`);
});