// product-service/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

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

// اختبار الاتصال بقاعدة البيانات
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [Product] تم الاتصال بقاعدة البيانات MySQL بنجاح');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ [Product] فشل الاتصال بقاعدة البيانات MySQL:', error);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};