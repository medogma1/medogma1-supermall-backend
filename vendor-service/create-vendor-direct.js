// سكريبت لإنشاء تاجر جديد باستخدام اتصال مباشر بقاعدة البيانات
const mysql = require('mysql2/promise');
const fs = require('fs');

async function createVendor() {
  let connection;
  try {
    // إنشاء اتصال بقاعدة البيانات
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'xx100100',
      database: 'supermall'
    });

    console.log('تم الاتصال بقاعدة البيانات بنجاح');

    // التحقق من هيكل جدول users
    const [userColumns] = await connection.execute(
      'SHOW COLUMNS FROM users'
    );
    console.log('أعمدة جدول users:');
    userColumns.forEach(col => console.log(`- ${col.Field}`));

    // التحقق من هيكل جدول vendors
    const [vendorColumns] = await connection.execute(
      'SHOW COLUMNS FROM vendors'
    );
    console.log('\nأعمدة جدول vendors:');
    vendorColumns.forEach(col => console.log(`- ${col.Field}`));

    // إنشاء مستخدم جديد بدور تاجر في جدول users
    // سنستخدم الأعمدة الأساسية فقط
    const [userResult] = await connection.execute(
      'INSERT INTO users (username, email, password, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      ['electronics_vendor', 'electronics3@example.com', 'hashed_password_here', 'vendor', 1]
    );

    const userId = userResult.insertId;
    console.log(`تم إنشاء مستخدم جديد بمعرف: ${userId}`);

    // إنشاء متجر جديد في جدول vendors
    const [vendorResult] = await connection.execute(
      'INSERT INTO vendors (user_id, store_name, email, contact_email, store_settings_completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, 'Electronics Store', 'electronics3@example.com', 'contact@electronics.com', 0]
    );

    const vendorId = vendorResult.insertId;
    console.log(`تم إنشاء متجر جديد بمعرف: ${vendorId}`);

    // كتابة النتيجة إلى ملف
    fs.writeFileSync('vendor-direct-result.json', JSON.stringify({
      success: true,
      userId: userId,
      vendorId: vendorId
    }, null, 2));

    console.log('تم إنشاء التاجر والمتجر بنجاح');
  } catch (error) {
    console.error('حدث خطأ أثناء إنشاء التاجر:', error.message);
    
    // كتابة الخطأ إلى ملف
    fs.writeFileSync('vendor-direct-error.json', JSON.stringify({
      success: false,
      error: error.message,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    }, null, 2));
  } finally {
    if (connection) {
      await connection.end();
      console.log('تم إغلاق الاتصال بقاعدة البيانات');
    }
  }
}

createVendor();