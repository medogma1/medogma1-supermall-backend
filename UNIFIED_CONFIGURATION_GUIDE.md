# دليل الإعدادات الموحدة - Supermall Backend

## نظرة عامة

هذا الدليل يوضح كيفية استخدام نظام الإعدادات الموحد الجديد في مشروع Supermall Backend.

## الملفات المهمة

### 1. الملف الرئيسي للإعدادات
- **الموقع**: `/.env`
- **الوصف**: يحتوي على جميع الإعدادات الأساسية للمشروع

### 2. ملف الإعدادات الموحد
- **الموقع**: `/utils/config.js`
- **الوصف**: يوفر واجهة موحدة للوصول إلى جميع الإعدادات

## منافذ الخدمات الموحدة

| الخدمة | المنفذ | العنوان |
|--------|-------|----------|
| API Gateway | 5001 | http://localhost:5001 |
| Auth Service | 5000 | http://localhost:5000 |
| User Service | 5002 | http://localhost:5002 |
| Product Service | 5003 | http://localhost:5003 |
| Order Service | 5004 | http://localhost:5004 |
| Vendor Service | 5005 | http://localhost:5005 |
| Support Service | 5006 | http://localhost:5006 |
| Chat Service | 5007 | http://localhost:5007 |
| Notification Service | 5008 | http://localhost:5008 |
| Upload Service | 5009 | http://localhost:5009 |
| Analytics Service | 5010 | http://localhost:5010 |

## كيفية استخدام ملف الإعدادات الموحد

### 1. استيراد الإعدادات
```javascript
const config = require('../utils/config');
```

### 2. الوصول إلى إعدادات قاعدة البيانات
```javascript
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name
};
```

### 3. الحصول على عنوان خدمة معينة
```javascript
const authServiceUrl = config.getServiceUrl('auth');
const productServiceUrl = config.getServiceUrl('product');
```

### 4. الحصول على منفذ خدمة معينة
```javascript
const authPort = config.getServicePort('auth');
const productPort = config.getServicePort('product');
```

### 5. التحقق من البيئة
```javascript
if (config.isDevelopment()) {
  console.log('Running in development mode');
}

if (config.isProduction()) {
  console.log('Running in production mode');
}
```

### 6. التحقق من صحة الإعدادات
```javascript
try {
  config.validate();
  console.log('Configuration is valid');
} catch (error) {
  console.error('Configuration error:', error.message);
}
```

## الإعدادات المتاحة

### إعدادات قاعدة البيانات
- `config.database.host`
- `config.database.port`
- `config.database.user`
- `config.database.password`
- `config.database.name`

### إعدادات الخادم
- `config.server.nodeEnv`
- `config.server.frontendUrl`

### إعدادات JWT
- `config.jwt.secret`
- `config.jwt.expiresIn`

### إعدادات الصفحات
- `config.pagination.pageSize`
- `config.pagination.maxPageSize`

### عناوين الخدمات
- `config.services.apiGateway`
- `config.services.auth`
- `config.services.user`
- `config.services.product`
- `config.services.order`
- `config.services.vendor`
- `config.services.support`
- `config.services.chat`
- `config.services.notification`
- `config.services.upload`
- `config.services.analytics`

### إعدادات البريد الإلكتروني
- `config.email.service`
- `config.email.user`
- `config.email.password`

### إعدادات Redis
- `config.redis.host`
- `config.redis.port`

### إعدادات الرفع
- `config.upload.maxFileSize`
- `config.upload.allowedTypes`
- `config.upload.uploadDir`

### إعدادات الأمان
- `config.security.bcryptRounds`
- `config.security.maxLoginAttempts`
- `config.security.lockoutTime`

## مثال كامل لاستخدام الإعدادات في خدمة

```javascript
const express = require('express');
const config = require('../utils/config');

const app = express();

// التحقق من صحة الإعدادات
try {
  config.validate();
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

// استخدام إعدادات قاعدة البيانات
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name
});

// استخدام منفذ الخدمة
const PORT = config.getServicePort('product') || 5003;

app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
});
```

## التحديثات المطلوبة في الخدمات الموجودة

### 1. تحديث ملفات index.js
استبدال الإعدادات المباشرة باستخدام ملف config.js:

```javascript
// قبل التحديث
const PORT = process.env.PORT || 5003;

// بعد التحديث
const config = require('../utils/config');
const PORT = config.getServicePort('product') || 5003;
```

### 2. تحديث إعدادات قاعدة البيانات
```javascript
// قبل التحديث
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supermall'
};

// بعد التحديث
const config = require('../utils/config');
const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name
};
```

## الفوائد من النظام الموحد

1. **سهولة الصيانة**: جميع الإعدادات في مكان واحد
2. **تجنب التكرار**: عدم تكرار نفس الإعدادات في ملفات متعددة
3. **التحقق من الصحة**: التأكد من وجود الإعدادات المطلوبة
4. **المرونة**: سهولة تغيير الإعدادات دون تعديل الكود
5. **الوضوح**: فهم أفضل لبنية المشروع

## الخطوات التالية

1. تحديث جميع الخدمات لاستخدام ملف config.js
2. إزالة الإعدادات المكررة من ملفات .env الفرعية
3. اختبار جميع الخدمات للتأكد من عملها بشكل صحيح
4. توثيق أي تغييرات إضافية مطلوبة

## ملاحظات مهمة

- تأكد من وجود ملف .env في المجلد الرئيسي
- لا تضع معلومات حساسة في ملفات git
- استخدم متغيرات البيئة للإعدادات الحساسة
- اختبر الإعدادات في بيئات مختلفة قبل النشر