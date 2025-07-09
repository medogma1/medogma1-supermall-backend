// notification-service/index.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// إعدادات CORS
app.use(cors());

// معالجة البيانات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// روت الصحة
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'خدمة الإشعارات تعمل بشكل صحيح' });
});

// مسارات الإشعارات
app.use('/notifications', notificationRoutes);

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'المسار غير موجود'
  });
});

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
    console.log('✅ [Notification] تم الاتصال بقاعدة البيانات MySQL');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [Notification] خطأ في الاتصال بقاعدة البيانات MySQL:', error);
    return false;
  }
}

// اختبار الاتصال عند بدء التشغيل
testConnection();

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`🚀 [Notification] الخدمة تعمل على المنفذ ${PORT}`);
});