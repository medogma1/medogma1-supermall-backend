// analytics-service/middleware/performanceMiddleware.js
const performanceModel = require('../models/mysql-performance');

/**
 * وسيط لتسجيل أداء API
 * يقوم بتسجيل وقت الاستجابة ورمز الحالة وحجم الطلب وحجم الاستجابة
 */
const apiPerformanceLogger = async (req, res, next) => {
  // تسجيل وقت بدء الطلب
  const startTime = Date.now();
  
  // تخزين حجم الطلب الأصلي
  const requestSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;
  
  // تخزين الدالة الأصلية لإنهاء الاستجابة
  const originalEnd = res.end;
  let responseBody = Buffer.from('');
  
  // تعديل دالة الكتابة لتتبع حجم الاستجابة
  const originalWrite = res.write;
  res.write = function(chunk) {
    if (chunk) {
      if (Buffer.isBuffer(chunk)) {
        responseBody = Buffer.concat([responseBody, chunk]);
      } else {
        responseBody = Buffer.concat([responseBody, Buffer.from(chunk)]);
      }
    }
    return originalWrite.apply(res, arguments);
  };
  
  // تعديل دالة الإنهاء لتسجيل بيانات الأداء
  res.end = function(chunk) {
    if (chunk) {
      if (Buffer.isBuffer(chunk)) {
        responseBody = Buffer.concat([responseBody, chunk]);
      } else {
        responseBody = Buffer.concat([responseBody, Buffer.from(chunk)]);
      }
    }
    
    // حساب وقت الاستجابة
    const responseTime = Date.now() - startTime;
    
    // استعادة دالة الإنهاء الأصلية
    originalEnd.apply(res, arguments);
    
    // تسجيل بيانات الأداء في قاعدة البيانات
    const performanceData = {
      endpoint: req.originalUrl,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      requestSize,
      responseSize: responseBody.length,
      userId: req.user ? req.user.id : null,
      ipAddress: req.ip || req.connection.remoteAddress
    };
    
    // تسجيل البيانات بشكل غير متزامن (لا ينتظر الاستجابة)
    performanceModel.createApiPerformance(performanceData).catch(err => {
      console.error('خطأ في تسجيل أداء API:', err);
    });
  };
  
  next();
};

module.exports = {
  apiPerformanceLogger
};