# 🧪 SuperMall Testing Suite - دليل الاختبارات الشامل

## 📋 نظرة عامة

هذا الدليل يوضح كيفية تشغيل جميع أنواع الاختبارات لمشروع SuperMall E-commerce، بما في ذلك:
- اختبارات API الوظيفية
- اختبارات الأمان والمصادقة
- اختبارات الأداء والحمولة
- اختبارات التكامل
- اختبارات End-to-End

## 🚀 البدء السريع

### 1. تحضير البيئة

```bash
# تأكد من تشغيل جميع الخدمات
cd c:\Users\Win10\Desktop\supermall-backend

# تشغيل API Gateway
cd api-gateway
node index.js

# تشغيل خدمة المصادقة (في terminal جديد)
cd ../auth-service
node index.js

# تشغيل خدمة البائعين (في terminal جديد)
cd ../vendor-service
node index.js

# تشغيل خدمة المنتجات (في terminal جديد)
cd ../product-service
node index.js

# تشغيل خدمة الطلبات (في terminal جديد)
cd ../order-service
node index.js
```

### 2. تثبيت أدوات الاختبار

```bash
# تثبيت dependencies للاختبارات الآلية
npm install --save-dev axios form-data

# تثبيت K6 لاختبارات الحمولة
winget install k6
# أو
choco install k6

# تثبيت Artillery لاختبارات الأداء
npm install -g artillery
```

## 🔧 تشغيل الاختبارات

### 1. اختبارات API الآلية الشاملة

```bash
# تشغيل جميع الاختبارات
node automated-api-tests.js

# تشغيل اختبارات محددة
node automated-api-tests.js --suite=auth
node automated-api-tests.js --suite=vendor
node automated-api-tests.js --suite=product
node automated-api-tests.js --suite=order
node automated-api-tests.js --suite=security
```

**ما يتم اختباره:**
- ✅ جميع endpoints للمصادقة (تسجيل، دخول، استرداد كلمة المرور)
- ✅ عمليات البائعين (إنشاء، تحديث، رفع الشعار)
- ✅ إدارة المنتجات (إضافة، تعديل، بحث، حذف)
- ✅ معالجة الطلبات (إنشاء، تتبع، تحديث الحالة)
- ✅ رفع الملفات والتحقق من الأمان
- ✅ اختبارات CORS والصلاحيات
- ✅ معالجة الأخطاء (401, 403, 500)

### 2. اختبارات الأداء مع Artillery

```bash
# تشغيل اختبار الأداء الأساسي
artillery run performance-test.yml

# تشغيل مع تقرير HTML
artillery run performance-test.yml --output report.json
artillery report report.json --output performance-report.html

# اختبار أداء محدد
artillery quick --count 50 --num 10 http://localhost:5001/health
```

**مؤشرات الأداء المقيسة:**
- 📊 Response Time (P50, P95, P99)
- 📊 Throughput (requests/second)
- 📊 Error Rate
- 📊 Concurrent Users
- 📊 Memory & CPU Usage

### 3. اختبارات الحمولة مع K6

```bash
# تشغيل اختبار الحمولة الكامل
k6 run load-test.js

# تشغيل مع عدد مستخدمين محدد
k6 run --vus 50 --duration 5m load-test.js

# تشغيل مع إعدادات مخصصة
k6 run --vus 100 --duration 10m --rps 200 load-test.js

# حفظ النتائج
k6 run --out json=results.json load-test.js
```

**سيناريوهات الحمولة:**
- 🔄 Warm-up: 10 users لمدة 2 دقيقة
- 📈 Ramp-up: تدرج إلى 50 مستخدم
- 🏃 Normal Load: 50 مستخدم لمدة 10 دقائق
- 🚀 High Load: 100 مستخدم لمدة 5 دقائق
- ⚡ Peak Load: 200 مستخدم لمدة 3 دقائق
- 📉 Cool-down: تدرج إلى 0

## 📊 تفسير النتائج

### مؤشرات النجاح

#### اختبارات API:
- ✅ **Success Rate > 95%**: معدل نجاح الطلبات
- ✅ **Response Time < 2s**: زمن الاستجابة للعمليات العادية
- ✅ **Authentication Rate > 98%**: معدل نجاح المصادقة
- ✅ **File Upload Success**: رفع الملفات يعمل بشكل صحيح
- ✅ **Error Handling**: معالجة صحيحة للأخطاء

#### اختبارات الأداء:
- ✅ **P95 < 2000ms**: 95% من الطلبات تستجيب خلال ثانيتين
- ✅ **P99 < 5000ms**: 99% من الطلبات تستجيب خلال 5 ثوان
- ✅ **Error Rate < 5%**: معدل خطأ أقل من 5%
- ✅ **Throughput > 100 RPS**: معدل معالجة أكثر من 100 طلب/ثانية

#### اختبارات الحمولة:
- ✅ **System Stability**: النظام يحافظ على الاستقرار تحت الحمولة
- ✅ **Memory Usage**: استخدام الذاكرة ضمن الحدود المقبولة
- ✅ **CPU Usage < 80%**: استخدام المعالج أقل من 80%
- ✅ **Database Connections**: اتصالات قاعدة البيانات مستقرة

### مؤشرات التحذير 🚨

- ⚠️ **Response Time > 3s**: بطء في الاستجابة
- ⚠️ **Error Rate > 5%**: معدل خطأ مرتفع
- ⚠️ **Memory Leaks**: تسريب في الذاكرة
- ⚠️ **Database Timeouts**: انتهاء مهلة قاعدة البيانات
- ⚠️ **Authentication Failures**: فشل في المصادقة

## 🔍 اختبارات محددة

### اختبار المصادقة والأمان

```bash
# اختبار JWT tokens
curl -H "Authorization: Bearer INVALID_TOKEN" http://localhost:5001/vendors/my/profile

# اختبار CORS
curl -H "Origin: http://malicious-site.com" http://localhost:5001/api/health

# اختبار رفع الملفات
curl -X POST -F "logo=@test.exe" http://localhost:5001/vendors/1/logo
```

### اختبار End-to-End

```javascript
// سيناريو مستخدم كامل
1. تسجيل مستخدم جديد
2. تسجيل الدخول
3. إنشاء متجر (بائع)
4. إضافة منتجات
5. تحديث إعدادات المتجر
6. عميل يتصفح المنتجات
7. إضافة إلى السلة
8. إنشاء طلب
9. تتبع الطلب
10. تحديث حالة الطلب
```

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. فشل الاتصال بقاعدة البيانات
```bash
# تحقق من حالة MySQL
net start mysql

# تحقق من الاتصال
mysql -u root -p -e "SHOW DATABASES;"
```

#### 2. مشاكل CORS
```javascript
// تحقق من إعدادات CORS في api-gateway/index.js
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
};
```

#### 3. مشاكل المصادقة
```bash
# تحقق من JWT secret
echo $JWT_SECRET

# تحقق من صحة التوكن
node -e "console.log(require('jsonwebtoken').verify('YOUR_TOKEN', 'YOUR_SECRET'))"
```

#### 4. مشاكل الأداء
```bash
# مراقبة استخدام الموارد
tasklist | findstr node

# تحقق من اتصالات قاعدة البيانات
mysql -e "SHOW PROCESSLIST;"
```

## 📈 تقرير الجودة النهائي

### معايير الجاهزية للإطلاق

#### ✅ المطلوب للإطلاق:
- [ ] جميع اختبارات API تمر بنجاح (>95%)
- [ ] اختبارات الأمان تمر بدون مشاكل
- [ ] اختبارات الأداء ضمن المعايير المقبولة
- [ ] اختبارات الحمولة تظهر استقرار النظام
- [ ] اختبارات End-to-End تعمل بسلاسة
- [ ] معالجة الأخطاء تعمل بشكل صحيح
- [ ] CORS وإعدادات الأمان محكمة
- [ ] رفع الملفات آمن ومحدود

#### 🚨 مشاكل حرجة (تمنع الإطلاق):
- [ ] فشل في المصادقة أو الأمان
- [ ] تسريب بيانات حساسة
- [ ] عدم استقرار النظام تحت الحمولة
- [ ] فشل في العمليات الأساسية
- [ ] مشاكل أداء حرجة

### نموذج تقرير الاختبار

```
=== تقرير اختبار SuperMall ===
تاريخ الاختبار: [DATE]
الإصدار: [VERSION]
البيئة: Development/Staging/Production

📊 نتائج الاختبارات:
✅ اختبارات API: 98% نجاح
✅ اختبارات الأمان: مُجتازة
✅ اختبارات الأداء: P95 < 1.5s
✅ اختبارات الحمولة: مستقر حتى 200 مستخدم
⚠️ مشاكل مكتشفة: [LIST]

🎯 التوصية النهائية:
[ ] جاهز للإطلاق
[ ] يحتاج تحسينات
[ ] يحتاج إصلاحات حرجة

📝 ملاحظات إضافية:
[NOTES]
```

## 🔗 موارد إضافية

- [K6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://artillery.io/docs/)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodejs-best-practices#-6-testing-and-overall-quality-practices)
- [API Testing Guidelines](https://restfulapi.net/)

---

**ملاحظة**: تأكد من تشغيل جميع الخدمات قبل بدء الاختبارات، وراجع النتائج بعناية لضمان جودة النظام قبل الإطلاق.