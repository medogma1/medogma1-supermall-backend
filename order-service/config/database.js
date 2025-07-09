// order-service/config/database.js
require('dotenv').config();
const mysql = require('mysql2/promise');

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

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

// اختبار الاتصال
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [Orders] تم الاتصال بقاعدة بيانات MySQL بنجاح');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [Orders] فشل الاتصال بقاعدة بيانات MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};