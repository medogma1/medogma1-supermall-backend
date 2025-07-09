// vendor-service/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();
const logger = require('../logger');

// إنشاء مجمع اتصالات MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// دالة لاختبار الاتصال بقاعدة البيانات
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('تم الاتصال بقاعدة بيانات MySQL بنجاح!');
    connection.release();
    return true;
  } catch (error) {
    logger.error('فشل الاتصال بقاعدة بيانات MySQL:', error.message);
    return false;
  }
}

// تصدير تجمع الاتصالات مباشرة للتوافق مع الكود الحالي
module.exports = pool;
module.exports.testConnection = testConnection;