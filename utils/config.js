// ملف الإعدادات الموحد للمشروع
require('dotenv').config();

const config = {
  // إعدادات قاعدة البيانات
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'supermall'
  },

  // إعدادات الخادم
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:60987'
  },

  // إعدادات JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'supermall_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // إعدادات الصفحات
  pagination: {
    pageSize: parseInt(process.env.PAGE_SIZE) || 10,
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE) || 50
  },

  // عناوين الخدمات الموحدة
  services: {
    apiGateway: process.env.API_GATEWAY_URL || 'http://localhost:5001',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
    user: process.env.USER_SERVICE_URL || 'http://localhost:5002',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:5004',
    vendor: process.env.VENDOR_SERVICE_URL || 'http://localhost:5005',
    support: process.env.SUPPORT_SERVICE_URL || 'http://localhost:5006',
    chat: process.env.CHAT_SERVICE_URL || 'http://localhost:5007',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5008',
    upload: process.env.UPLOAD_SERVICE_URL || 'http://localhost:5009',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5010'
  },

  // منافذ الخدمات
  ports: {
    apiGateway: 5001,
    auth: 5000,
    user: 5002,
    product: 5003,
    order: 5004,
    vendor: 5005,
    support: 5006,
    chat: 5007,
    notification: 5008,
    upload: 5009,
    analytics: 5010
  },

  // إعدادات البريد الإلكتروني
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASS || ''
  },

  // إعدادات Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },

  // إعدادات الرفع
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },

  // إعدادات الأمان
  security: {
    bcryptRounds: 12,
    maxLoginAttempts: 5,
    lockoutTime: 15 * 60 * 1000 // 15 دقيقة
  },

  // إعدادات Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUD_NAME || '',
    apiKey: process.env.CLOUD_API_KEY || '',
    apiSecret: process.env.CLOUD_API_SECRET || '',
    url: process.env.CLOUDINARY_URL || ''
  }
};

// دالة للحصول على عنوان خدمة معينة
config.getServiceUrl = (serviceName) => {
  return config.services[serviceName] || null;
};

// دالة للحصول على منفذ خدمة معينة
config.getServicePort = (serviceName) => {
  return config.ports[serviceName] || null;
};

// دالة للتحقق من البيئة
config.isDevelopment = () => {
  return config.server.nodeEnv === 'development';
};

config.isProduction = () => {
  return config.server.nodeEnv === 'production';
};

// دالة للتحقق من صحة الإعدادات
config.validate = () => {
  const required = [
    'database.host',
    'database.user',
    'database.name',
    'jwt.secret'
  ];

  const missing = [];
  
  required.forEach(path => {
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (!current[key]) {
        missing.push(path);
        break;
      }
      current = current[key];
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return true;
};

module.exports = config;