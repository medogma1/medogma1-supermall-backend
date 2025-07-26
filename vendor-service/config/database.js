// vendor-service/config/database.js
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { logger } = require('../../utils/logger');

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

// دالة لتهيئة قاعدة البيانات
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
              logger.warn(`Database warning: ${error.message}`);
            }
          }
        }
      }
      logger.info('✅ تم إنشاء/تحديث جداول قاعدة البيانات بنجاح');
    } else {
      logger.warn('⚠️ ملف database.sql غير موجود');
    }
  } catch (error) {
    logger.error('❌ خطأ في تهيئة قاعدة البيانات:', error.message);
    throw error;
  }
}

// تصدير تجمع الاتصالات مباشرة للتوافق مع الكود الحالي
module.exports = pool;
module.exports.testConnection = testConnection;
module.exports.initializeDatabase = initializeDatabase;