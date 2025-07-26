# دليل تحسين جودة الكود وقابلية الصيانة 📋

## تحديث: حلول شاملة لتحسين الأداء والجودة

### مشاكل الأداء المحددة
- تحذيرات `requestAnimationFrame` في Flutter Web
- الحاجة لتحسين بنية الكود
- تحسين قابلية الصيانة والتطوير

# تحسينات جودة الكود وقابلية الصيانة - SuperMall Backend

## 🔍 تحليل المشكلة الحالية

بناءً على الصورة المرفقة، المشكلة الأساسية هي:
- **خطأ 401 Unauthorized** عند الوصول لـ `PUT /vendors/52/settings`
- **رسالة الخطأ**: "jwt malformed" - يشير إلى توكن JWT غير صالح
- **السبب**: التطبيق يرسل توكن بتنسيق خاطئ أو تالف

## 🚀 تحسينات مقترحة لجودة الكود

### 1. تحسين معالجة الأخطاء (Error Handling)

#### إنشاء نظام أخطاء موحد
```javascript
// utils/errors/CustomError.js
class CustomError extends Error {
  constructor(message, statusCode, errorCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.name = this.constructor.name;
  }
}

class AuthenticationError extends CustomError {
  constructor(message = 'Authentication failed', details = null) {
    super(message, 401, 'AUTH_FAILED', details);
  }
}

class ValidationError extends CustomError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 400, 'VALIDATION_FAILED', details);
  }
}

module.exports = { CustomError, AuthenticationError, ValidationError };
```

#### تحسين middleware المصادقة
```javascript
// vendor-service/middleware/enhancedAuthMiddleware.js
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../../utils/errors/CustomError');
const { logger } = require('../../utils/logger');

const enhancedAuthMiddleware = {
  authenticate: async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      // تحسين استخراج التوكن
      if (!authHeader) {
        throw new AuthenticationError('رأس التفويض مفقود', {
          header: 'Authorization',
          expected: 'Bearer <token>'
        });
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token || token.trim() === '') {
        throw new AuthenticationError('التوكن مفقود أو فارغ');
      }

      // تحسين التحقق من التوكن
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (jwtError) {
        logger.error('JWT verification failed:', {
          error: jwtError.message,
          token: token.substring(0, 20) + '...', // جزء من التوكن للتشخيص
          userAgent: req.headers['user-agent'],
          ip: req.ip
        });
        
        if (jwtError.name === 'TokenExpiredError') {
          throw new AuthenticationError('التوكن منتهي الصلاحية', {
            expiredAt: jwtError.expiredAt
          });
        } else if (jwtError.name === 'JsonWebTokenError') {
          throw new AuthenticationError('تنسيق التوكن غير صحيح', {
            reason: jwtError.message
          });
        } else {
          throw new AuthenticationError('فشل في التحقق من التوكن');
        }
      }

      // إضافة معلومات المستخدم للطلب
      req.user = decoded;
      req.authToken = token;
      
      logger.info('Authentication successful', {
        userId: decoded.id,
        role: decoded.role,
        vendorId: decoded.vendorId
      });
      
      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
          errorCode: error.errorCode,
          details: error.details,
          timestamp: error.timestamp
        });
      }
      
      logger.error('Unexpected authentication error:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ داخلي في الخادم',
        errorCode: 'INTERNAL_ERROR'
      });
    }
  }
};

module.exports = enhancedAuthMiddleware;
```

### 2. تحسين التحقق من صحة البيانات (Validation)

```javascript
// utils/validation/vendorValidation.js
const Joi = require('joi');

const vendorSettingsSchema = Joi.object({
  storeName: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'اسم المتجر مطلوب',
      'string.min': 'اسم المتجر يجب أن يكون على الأقل حرفين',
      'string.max': 'اسم المتجر لا يمكن أن يتجاوز 100 حرف'
    }),
  
  storeDescription: Joi.string().min(10).max(500).required()
    .messages({
      'string.empty': 'وصف المتجر مطلوب',
      'string.min': 'وصف المتجر يجب أن يكون على الأقل 10 أحرف'
    }),
  
  storeLogoUrl: Joi.string().uri().required()
    .messages({
      'string.empty': 'رابط شعار المتجر مطلوب',
      'string.uri': 'رابط شعار المتجر غير صحيح'
    }),
  
  contactEmail: Joi.string().email().required()
    .messages({
      'string.empty': 'البريد الإلكتروني مطلوب',
      'string.email': 'البريد الإلكتروني غير صحيح'
    }),
  
  contactPhone: Joi.string().pattern(/^\+966[0-9]{9}$/).required()
    .messages({
      'string.empty': 'رقم الهاتف مطلوب',
      'string.pattern.base': 'رقم الهاتف يجب أن يبدأ بـ +966 ويتبعه 9 أرقام'
    }),
  
  storeAddress: Joi.string().min(10).max(200).required()
    .messages({
      'string.empty': 'عنوان المتجر مطلوب',
      'string.min': 'عنوان المتجر يجب أن يكون على الأقل 10 أحرف'
    }),
  
  businessHours: Joi.object().pattern(
    Joi.string().valid('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
    Joi.object({
      open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      isOpen: Joi.boolean().default(true)
    })
  ).optional()
});

const validateVendorSettings = (data) => {
  const { error, value } = vendorSettingsSchema.validate(data, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });
  
  if (error) {
    const details = error.details.reduce((acc, detail) => {
      acc[detail.path.join('.')] = detail.message;
      return acc;
    }, {});
    
    throw new ValidationError('بيانات غير صحيحة', details);
  }
  
  return value;
};

module.exports = { validateVendorSettings, vendorSettingsSchema };
```

### 3. تحسين نظام السجلات (Logging)

```javascript
// utils/enhancedLogger.js
const winston = require('winston');
const path = require('path');

const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          service: serviceName,
          message,
          ...meta
        });
      })
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.File({ 
        filename: path.join('logs', `${serviceName}-error.log`), 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: path.join('logs', `${serviceName}-combined.log`) 
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });
};

module.exports = { createLogger };
```

### 4. تحسين اختبار الوحدة (Unit Testing)

```javascript
// vendor-service/tests/auth.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');

describe('Vendor Authentication', () => {
  let validToken;
  let expiredToken;
  let malformedToken;
  
  beforeAll(() => {
    // إنشاء توكنات للاختبار
    validToken = jwt.sign(
      { id: 1, vendorId: 1, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    expiredToken = jwt.sign(
      { id: 1, vendorId: 1, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '-1h' }
    );
    
    malformedToken = 'invalid.token.here';
  });
  
  describe('PUT /vendors/:id/settings', () => {
    test('should return 401 for missing token', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .send({ storeName: 'Test Store' });
      
      expect(response.status).toBe(401);
      expect(response.body.errorCode).toBe('AUTH_FAILED');
    });
    
    test('should return 401 for malformed token', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${malformedToken}`)
        .send({ storeName: 'Test Store' });
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('تنسيق التوكن غير صحيح');
    });
    
    test('should return 401 for expired token', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({ storeName: 'Test Store' });
      
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('منتهي الصلاحية');
    });
    
    test('should return 400 for invalid data with valid token', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ storeName: 'A' }); // اسم قصير جداً
      
      expect(response.status).toBe(400);
      expect(response.body.errorCode).toBe('VALIDATION_FAILED');
    });
  });
});
```

### 5. تحسين الأمان (Security)

```javascript
// utils/security/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

const createRateLimiter = (options = {}) => {
  return rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 دقيقة
    max: options.max || 100, // حد الطلبات
    message: {
      success: false,
      message: 'تم تجاوز حد الطلبات المسموح. حاول مرة أخرى لاحقاً',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
};

// معدلات مختلفة للمسارات المختلفة
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 محاولات تسجيل دخول كل 15 دقيقة
  message: {
    success: false,
    message: 'تم تجاوز حد محاولات تسجيل الدخول. حاول مرة أخرى بعد 15 دقيقة',
    errorCode: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000 // 1000 طلب كل 15 دقيقة
});

module.exports = { authLimiter, apiLimiter, createRateLimiter };
```

### 6. تحسين مراقبة الأداء (Performance Monitoring)

```javascript
// utils/monitoring/performanceMonitor.js
const { createLogger } = require('../enhancedLogger');
const logger = createLogger('performance');

const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();
  
  res.on('finish', () => {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;
    
    const performanceData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      memoryUsage: {
        heapUsed: `${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024 * 100) / 100}MB`,
        heapTotal: `${Math.round(endMemory.heapTotal / 1024 / 1024 * 100) / 100}MB`
      },
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    
    if (duration > 1000) {
      logger.warn('Slow request detected', performanceData);
    } else {
      logger.info('Request completed', performanceData);
    }
  });
  
  next();
};

module.exports = performanceMiddleware;
```

## 📋 خطة التنفيذ

### المرحلة 1: الإصلاحات الفورية
1. ✅ إصلاح مشكلة JWT malformed
2. ✅ تحسين رسائل الخطأ
3. ✅ إضافة التحقق من صحة البيانات

### المرحلة 2: تحسينات الأمان
1. إضافة Rate Limiting
2. تحسين نظام المصادقة
3. إضافة تشفير إضافي للبيانات الحساسة

### المرحلة 3: تحسينات الأداء
1. إضافة مراقبة الأداء
2. تحسين استعلامات قاعدة البيانات
3. إضافة نظام التخزين المؤقت

### المرحلة 4: الاختبارات والمراقبة
1. إضافة اختبارات شاملة
2. إعداد نظام مراقبة متقدم
3. إضافة تقارير الأداء

## 🎯 الفوائد المتوقعة

- **تحسين الأمان**: حماية أفضل ضد الهجمات
- **سهولة الصيانة**: كود أكثر تنظيماً وقابلية للقراءة
- **أداء أفضل**: استجابة أسرع ومراقبة محسنة
- **تجربة مطور محسنة**: رسائل خطأ واضحة وأدوات تشخيص
- **موثوقية عالية**: اختبارات شاملة ومعالجة أخطاء محسنة

## 📚 الموارد والأدوات المقترحة

- **Jest**: للاختبارات
- **Winston**: للسجلات المتقدمة
- **Joi**: للتحقق من صحة البيانات
- **Express Rate Limit**: لحماية من الهجمات
- **Helmet**: لأمان إضافي
- **Compression**: لتحسين الأداء
- **Morgan**: لسجلات HTTP