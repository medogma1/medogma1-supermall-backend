require('dotenv').config();

module.exports = {
  // إعدادات قاعدة البيانات MySQL
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'supermall_vendors'
  },
  // إعدادات المصادقة والأمان
  jwtSecret: process.env.JWT_SECRET,
  // إعدادات الخدمة
  port: process.env.PORT || 5005,
  nodeEnv: process.env.NODE_ENV || 'development',
  // إعدادات التصفية
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE) || 10,
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 100,
  // مسارات الملفات
  uploadsPath: process.env.UPLOADS_PATH || 'uploads/',
  // عناوين الخدمات الأخرى
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
  productServiceUrl: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5002'
};