// order-service/config/database.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
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

// إنشاء الجداول إذا لم تكن موجودة
async function initializeDatabase() {
  try {
    const sqlFile = path.join(__dirname, 'database.sql');
    
    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim() && !statement.trim().startsWith('--')) {
          try {
            await pool.execute(statement);
          } catch (error) {
            // تجاهل أخطاء الجداول الموجودة
            if (!error.message.includes('already exists')) {
              console.warn('تحذير في تنفيذ SQL:', error.message);
            }
          }
        }
      }
      
      console.log('✅ [Orders] تم إنشاء/تحديث جداول قاعدة البيانات بنجاح');
    }
  } catch (error) {
    console.error('❌ [Orders] خطأ في إنشاء جداول قاعدة البيانات:', error.message);
  }
}

// إغلاق الاتصال
async function closeConnection() {
  try {
    await pool.end();
    console.log('✅ [Orders] تم إغلاق الاتصال بقاعدة البيانات');
  } catch (error) {
    console.error('❌ [Orders] خطأ في إغلاق الاتصال:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  closeConnection
};