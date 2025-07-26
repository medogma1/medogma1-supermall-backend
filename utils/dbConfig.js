/**
 * تكوين موحد لقاعدة البيانات لجميع الخدمات
 * يوفر هذا الملف وظائف للاتصال بقواعد البيانات MySQL و MongoDB
 */

const mysql = require('mysql2');
const mongoose = require('mongoose');

/**
 * إنشاء تجمع اتصالات MySQL
 * @param {Object} config - إعدادات الاتصال
 * @returns {Object} تجمع اتصالات MySQL
 */
exports.createMySQLPool = (config = {}) => {
  // استخدام الإعدادات المقدمة أو الإعدادات الافتراضية من متغيرات البيئة
  const dbConfig = {
    host: config.host || process.env.DB_HOST || 'localhost',
    port: config.port || process.env.DB_PORT || 3306,
    user: config.user || process.env.DB_USER || 'root',
    password: config.password || process.env.DB_PASSWORD,
    database: config.database || process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  // إنشاء تجمع اتصالات
  const pool = mysql.createPool(dbConfig).promise();

  // اختبار الاتصال
  pool.getConnection()
    .then(connection => {
      console.log(`تم الاتصال بقاعدة بيانات MySQL: ${dbConfig.database}`);
      connection.release();
    })
    .catch(err => {
      console.error('خطأ في الاتصال بقاعدة بيانات MySQL:', err.message);
    });

  return pool;
};

/**
 * الاتصال بقاعدة بيانات MongoDB
 * @param {Object} config - إعدادات الاتصال
 * @returns {Promise} وعد بالاتصال
 */
exports.connectMongoDB = async (config = {}) => {
  // استخدام الإعدادات المقدمة أو الإعدادات الافتراضية من متغيرات البيئة
  const mongoURI = config.uri || process.env.MONGO_URI || `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${config.database || process.env.MONGO_DB_NAME}`;

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });

    console.log(`تم الاتصال بقاعدة بيانات MongoDB: ${mongoURI}`);
    return mongoose.connection;
  } catch (err) {
    console.error('خطأ في الاتصال بقاعدة بيانات MongoDB:', err.message);
    throw err;
  }
};

/**
 * إغلاق اتصال MySQL
 * @param {Object} pool - تجمع اتصالات MySQL
 */
exports.closeMySQLConnection = async (pool) => {
  if (pool) {
    try {
      await pool.end();
      console.log('تم إغلاق اتصال MySQL بنجاح');
    } catch (err) {
      console.error('خطأ في إغلاق اتصال MySQL:', err.message);
    }
  }
};

/**
 * إغلاق اتصال MongoDB
 */
exports.closeMongoDBConnection = async () => {
  try {
    await mongoose.connection.close();
    console.log('تم إغلاق اتصال MongoDB بنجاح');
  } catch (err) {
    console.error('خطأ في إغلاق اتصال MongoDB:', err.message);
  }
};