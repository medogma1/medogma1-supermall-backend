// utils/mysql-config.js
const mysql = require('mysql2/promise');
const config = require('./config');

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
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

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

// اختبار الاتصال
async function testConnection(serviceName = '') {
  try {
    const connection = await pool.getConnection();
    const servicePrefix = serviceName ? `[${serviceName}] ` : '';
    console.log(`✅ ${servicePrefix}تم الاتصال بقاعدة بيانات MySQL بنجاح`);
    connection.release();
    return true;
  } catch (error) {
    const servicePrefix = serviceName ? `[${serviceName}] ` : '';
    console.error(`❌ ${servicePrefix}فشل الاتصال بقاعدة بيانات MySQL:`, error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};