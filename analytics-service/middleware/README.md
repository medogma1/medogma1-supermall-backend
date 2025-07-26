# وسطاء خدمة التحليلات

هذا المجلد يحتوي على وسطاء (Middleware) المستخدمة في خدمة التحليلات.

## authMiddleware.js

وسيط المصادقة لخدمة التحليلات، يستخدم المكتبة المشتركة للمصادقة من `utils/auth/authMiddleware.js`.

### الدوال المتاحة

#### authenticate

وسيط للتحقق من صحة التوكن.

```javascript
exports.authenticate = (req, res, next) => { ... };
```

**الاستخدام:**
```javascript
const { authenticate } = require('../middleware/authMiddleware');

router.get('/sales', authenticate, analyticsController.getSalesAnalytics);
```

#### restrictTo

وسيط للتحقق من صلاحيات المستخدم.

```javascript
exports.restrictTo = (...roles) => { ... };
```

**المعلمات:**
- `...roles`: الأدوار المسموح لها بالوصول

**الاستخدام:**
```javascript
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

router.get('/sales', authenticate, restrictTo('admin', 'vendor'), analyticsController.getSalesAnalytics);
```

## performanceMiddleware.js

وسيط لتسجيل أداء API في خدمة التحليلات.

### الدوال المتاحة

#### apiPerformanceLogger

وسيط لتسجيل أداء API عن طريق قياس وقت الاستجابة، ورمز الحالة، وحجم الطلب والاستجابة.

```javascript
exports.apiPerformanceLogger = (req, res, next) => { ... };
```

**الاستخدام:**
```javascript
const { apiPerformanceLogger } = require('./middleware/performanceMiddleware');

app.use(apiPerformanceLogger);
```

### البيانات المسجلة

- طريقة الطلب (GET, POST, PUT, DELETE, ...)
- المسار
- وقت الاستجابة (بالمللي ثانية)
- رمز الحالة
- حجم الطلب
- حجم الاستجابة
- معرف المستخدم (إذا كان متاحًا)
- عنوان IP