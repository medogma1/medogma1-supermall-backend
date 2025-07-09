// utils/mysql-config.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
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

// اختبار الاتصال
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ تم الاتصال بقاعدة بيانات MySQL بنجاح');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة بيانات MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};