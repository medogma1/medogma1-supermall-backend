/**
 * وحدة التسجيل الموحدة
 * توفر دوال موحدة لتسجيل الأحداث والأخطاء عبر جميع الخدمات
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد للسجلات إذا لم يكن موجودًا
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// تنسيق السجلات
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// تنسيق السجلات للطباعة في وحدة التحكم
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, service = 'app', ...meta }) => {
    let logMessage = `${timestamp} [${service}] ${level}: ${message}`;
    if (Object.keys(meta).length > 0 && meta.stack) {
      logMessage += `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    return logMessage;
  })
);

/**
 * إنشاء مسجل مخصص لخدمة معينة
 * @param {string} serviceName - اسم الخدمة
 * @returns {winston.Logger} - كائن المسجل
 */
function createLogger(serviceName = 'app') {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: logFormat,
    transports: [
      // تسجيل جميع المستويات في ملف مشترك
      new winston.transports.File({ 
        filename: path.join(logsDir, `${serviceName}.log`),
        maxsize: 10485760, // 10 ميجابايت
        maxFiles: 5,
        tailable: true
      }),
      
      // تسجيل الأخطاء في ملف منفصل
      new winston.transports.File({ 
        filename: path.join(logsDir, `${serviceName}-error.log`), 
        level: 'error',
        maxsize: 10485760, // 10 ميجابايت
        maxFiles: 5,
        tailable: true
      }),
      
      // طباعة السجلات في وحدة التحكم في بيئة التطوير
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
      })
    ],
    // عدم إيقاف التسجيل عند حدوث استثناء غير معالج
    exitOnError: false
  });
}

// إنشاء مسجل افتراضي للتطبيق
const logger = createLogger();

// تسجيل الاستثناءات غير المعالجة
process.on('uncaughtException', (error) => {
  logger.error('استثناء غير معالج:', error);
  // إعطاء وقت للمسجل لكتابة السجلات قبل إنهاء العملية
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// تسجيل الوعود المرفوضة غير المعالجة
process.on('unhandledRejection', (reason, promise) => {
  logger.error('وعد مرفوض غير معالج:', { reason, promise });
});

module.exports = {
  logger,
  createLogger
};