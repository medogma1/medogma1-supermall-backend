// utils/setup-database.js
require('dotenv').config();
const { createMissingTables } = require('./mongodb-to-mysql-migration');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// إعدادات الاتصال بقاعدة البيانات MySQL (بدون اسم قاعدة البيانات)
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'xx100100',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function setupDatabase() {
  let connection;
  try {
    // إنشاء اتصال بدون تحديد قاعدة بيانات
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });

    console.log('✅ تم الاتصال بخادم MySQL بنجاح');

    // قراءة ملف السكيما
    const schemaPath = path.join(__dirname, 'database-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // تقسيم السكيما إلى أوامر منفصلة
    const statements = schemaSql.split(';').filter(statement => statement.trim() !== '');

    // تنفيذ كل أمر على حدة
    for (const statement of statements) {
      await connection.query(statement + ';');
    }

    console.log('✅ تم إنشاء قاعدة البيانات والجداول بنجاح');

    // إنشاء بيانات تجريبية (اختياري)
    await createSampleData(connection);

    return true;
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إعداد قاعدة البيانات:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

async function createSampleData(connection) {
  try {
    // إنشاء مستخدم مشرف
    await connection.query(`
      INSERT INTO supermall.users (username, email, password, role, is_active, is_email_verified)
      VALUES ('admin', 'admin@supermall.com', '$2b$10$X/8.yjaxfkMhPzWxdsBvHOH.3xVj5Q9HC5AMmS2fUyYQCZb.MYlCO', 'admin', true, true)
      ON DUPLICATE KEY UPDATE id=id;
    `);

    // إنشاء فئات أساسية
    await connection.query(`
      INSERT INTO supermall.categories (name, description, is_active)
      VALUES 
        ('إلكترونيات', 'منتجات إلكترونية متنوعة', true),
        ('ملابس', 'ملابس رجالية ونسائية', true),
        ('أثاث', 'أثاث منزلي وديكور', true),
        ('مستلزمات منزلية', 'مستلزمات المنزل المتنوعة', true)
      ON DUPLICATE KEY UPDATE id=id;
    `);

    console.log('✅ تم إنشاء بيانات تجريبية بنجاح');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء إنشاء البيانات التجريبية:', error.message);
  }
}

// تنفيذ الإعداد إذا تم تشغيل الملف مباشرة
if (require.main === module) {
  setupDatabase()
    .then(success => {
      if (success) {
        console.log('✅ تم إعداد قاعدة البيانات الأساسية بنجاح');
        // إنشاء الجداول الإضافية للخدمات التي كانت تستخدم MongoDB
        return createMissingTables();
      } else {
        console.error('❌ فشل إعداد قاعدة البيانات');
        process.exit(1);
      }
    })
    .then(success => {
      if (success) {
        console.log('✅ تم إعداد قاعدة البيانات الموحدة بنجاح');
      } else {
        console.error('❌ فشل إعداد الجداول الإضافية');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('❌ حدث خطأ غير متوقع:', err);
      process.exit(1);
    });
}

module.exports = { setupDatabase };