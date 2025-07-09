const { createLogger, format, transports } = require('winston');
const path = require('path');

// تكوين مستويات السجل
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// تحديد مستوى السجل بناءً على بيئة التشغيل
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// تكوين ألوان السجل
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// إضافة الألوان إلى winston
// تصحيح: استخدام winston.addColors بدلاً من format.colorize.addColors
const { addColors } = require('winston/lib/winston/config');
addColors(colors);

// تنسيق السجل
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.colorize({ all: true }),
  format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// تأكد من وجود مجلد السجلات
const logDir = 'logs';

// تحديد النواقل
const logTransports = [
  // طباعة جميع السجلات إلى وحدة التحكم
  new transports.Console(),
  
  // طباعة جميع سجلات الأخطاء في ملف
  new transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
  }),
  
  // طباعة جميع السجلات في ملف
  new transports.File({ 
    filename: path.join(logDir, 'vendor-service.log') 
  }),
];

// إنشاء كائن السجل
const logger = createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports: logTransports,
});

module.exports = logger;