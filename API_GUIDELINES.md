# إرشادات تصميم وتطوير واجهات برمجة التطبيقات (APIs) في Super Mall Backend

هذا المستند يوفر إرشادات وأفضل الممارسات لتصميم وتطوير واجهات برمجة التطبيقات (APIs) في مشروع Super Mall Backend. الهدف هو ضمان اتساق وجودة وأمان جميع واجهات API عبر الخدمات المختلفة.

## جدول المحتويات

- [مبادئ التصميم](#مبادئ-التصميم)
- [تصميم المسارات (URLs)](#تصميم-المسارات-urls)
- [طرق HTTP](#طرق-http)
- [تنسيق الاستجابة](#تنسيق-الاستجابة)
- [رموز الحالة](#رموز-الحالة)
- [المصادقة والتفويض](#المصادقة-والتفويض)
- [الإصدارات](#الإصدارات)
- [التوثيق](#التوثيق)
- [الاختبار](#الاختبار)
- [الأمان](#الأمان)
- [التحكم في المعدل](#التحكم-في-المعدل)
- [التعامل مع الأخطاء](#التعامل-مع-الأخطاء)
- [أمثلة](#أمثلة)

## مبادئ التصميم

### 1. بساطة التصميم

- صمم واجهات API بسيطة وسهلة الفهم
- تجنب التعقيد غير الضروري
- استخدم مصطلحات متسقة عبر جميع الواجهات

### 2. اتباع مبادئ REST

- استخدم الموارد كمفهوم أساسي
- استخدم طرق HTTP بشكل صحيح
- حافظ على حالة عدم الاتصال (Statelessness)

### 3. اتساق التصميم

- استخدم نفس الأنماط والتنسيقات عبر جميع الواجهات
- اتبع نفس اتفاقيات التسمية
- استخدم نفس تنسيق الاستجابة

## تصميم المسارات (URLs)

### اتفاقيات التسمية

- استخدم أسماء موارد بصيغة الجمع
- استخدم الحروف الصغيرة
- استخدم الشرطات (-) بدلاً من الشرطات السفلية (_)
- تجنب استخدام امتدادات الملفات (.json, .xml)

### أمثلة

✅ جيد:
```
/api/v1/products
/api/v1/products/123
/api/v1/users/456/orders
```

❌ سيء:
```
/api/v1/getProducts
/api/v1/product_list
/api/v1/products.json
```

### تسلسل هرمي للموارد

- استخدم تسلسل هرمي منطقي للموارد
- استخدم المسارات المتداخلة للموارد المرتبطة

```
/api/v1/vendors/{vendorId}/products
/api/v1/users/{userId}/orders/{orderId}
```

## طرق HTTP

### استخدام الطرق

- **GET**: لاسترجاع البيانات
- **POST**: لإنشاء موارد جديدة
- **PUT**: لتحديث مورد موجود بالكامل
- **PATCH**: لتحديث جزئي لمورد موجود
- **DELETE**: لحذف مورد

### أمثلة

```
GET /api/v1/products                # الحصول على قائمة المنتجات
GET /api/v1/products/123           # الحصول على منتج محدد
POST /api/v1/products              # إنشاء منتج جديد
PUT /api/v1/products/123           # تحديث منتج بالكامل
PATCH /api/v1/products/123         # تحديث جزئي لمنتج
DELETE /api/v1/products/123        # حذف منتج
```

## تنسيق الاستجابة

### هيكل الاستجابة

يجب أن تتبع جميع استجابات API الهيكل التالي:

```json
{
  "status": "success",           // "success" أو "error"
  "data": { ... },             // البيانات المطلوبة (في حالة النجاح)
  "message": "...",            // رسالة وصفية (اختيارية)
  "errors": [ ... ],           // تفاصيل الأخطاء (في حالة الخطأ)
  "meta": {                    // بيانات وصفية (اختيارية)
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "totalItems": 42
    }
  }
}
```

### استجابة النجاح

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "name": "Smartphone XYZ",
    "price": 599.99,
    "category": "Electronics"
  }
}
```

### استجابة الخطأ

```json
{
  "status": "error",
  "message": "Invalid input data",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    },
    {
      "field": "category",
      "message": "Category is required"
    }
  ]
}
```

## رموز الحالة

### رموز الحالة الشائعة

- **200 OK**: طلب ناجح
- **201 Created**: تم إنشاء مورد جديد بنجاح
- **204 No Content**: طلب ناجح بدون محتوى للإرجاع (مثل DELETE)
- **400 Bad Request**: طلب غير صالح
- **401 Unauthorized**: المصادقة مطلوبة
- **403 Forbidden**: المستخدم غير مصرح له
- **404 Not Found**: المورد غير موجود
- **422 Unprocessable Entity**: بيانات صالحة ولكن لا يمكن معالجتها
- **500 Internal Server Error**: خطأ في الخادم

### استخدام رموز الحالة

- استخدم رموز الحالة المناسبة لكل استجابة
- كن متسقًا في استخدام رموز الحالة عبر جميع الواجهات
- لا تستخدم رموز حالة غير قياسية

## المصادقة والتفويض

### طرق المصادقة

- استخدم JWT (JSON Web Tokens) للمصادقة
- أرسل رمز JWT في رأس `Authorization` بتنسيق `Bearer {token}`

### التفويض

- استخدم الأدوار والأذونات للتحكم في الوصول
- تحقق من الأذونات قبل تنفيذ العمليات
- استخدم وسيط `restrictTo` المشترك للتحقق من الأدوار

```javascript
router.delete('/products/:id', authenticate, restrictTo('admin', 'vendor'), productController.deleteProduct);
```

## الإصدارات

### استراتيجية الإصدارات

- استخدم الإصدارات في مسار URL
- ابدأ بـ `/api/v1/` لجميع النقاط النهائية
- عند إجراء تغييرات غير متوافقة مع الإصدارات السابقة، قم بزيادة رقم الإصدار

### التوافق مع الإصدارات السابقة

- حافظ على دعم الإصدارات السابقة لفترة معقولة
- وثق تواريخ انتهاء دعم الإصدارات القديمة
- أعلم المستخدمين مسبقًا عند التخطيط لإيقاف دعم إصدار قديم

## التوثيق

### متطلبات التوثيق

- وثق جميع نقاط النهاية API
- اشرح جميع المعلمات والاستجابات
- قدم أمثلة للطلبات والاستجابات

### أدوات التوثيق

- استخدم Swagger/OpenAPI لتوثيق API
- حافظ على تحديث الوثائق مع كل تغيير

## الاختبار

### استراتيجية الاختبار

- اكتب اختبارات وحدة لكل وحدة تحكم API
- اكتب اختبارات تكامل لاختبار التفاعل بين الخدمات
- اختبر جميع مسارات النجاح والفشل

### أدوات الاختبار

- استخدم Jest و Supertest لاختبار API
- استخدم Postman لاختبار يدوي واختبار تكامل

## الأمان

### أفضل ممارسات الأمان

- استخدم HTTPS لجميع طلبات API
- تحقق من صحة جميع بيانات الإدخال
- استخدم حماية CSRF للطلبات غير الآمنة
- تنفيذ حدود معدل لمنع هجمات DDoS
- لا تكشف عن معلومات حساسة في الاستجابات

### التعامل مع البيانات الحساسة

- لا ترسل كلمات المرور أو المفاتيح السرية في الاستجابات
- قم بتشفير البيانات الحساسة في قاعدة البيانات
- استخدم متغيرات البيئة للمعلومات الحساسة

## التحكم في المعدل

### استراتيجية التحكم في المعدل

- تنفيذ حدود معدل لكل مستخدم وعنوان IP
- استخدم خوارزمية دلو التسرب أو نافذة متحركة
- أضف رؤوس استجابة للإشارة إلى حالة الحد

### رؤوس الاستجابة

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

## التعامل مع الأخطاء

### استراتيجية التعامل مع الأخطاء

- استخدم فئة `AppError` المشتركة لإنشاء أخطاء متسقة
- استخدم وسيط `errorMiddleware` المشترك لمعالجة الأخطاء
- قدم رسائل خطأ مفيدة ومفصلة

### مثال للتعامل مع الأخطاء

```javascript
// إنشاء خطأ
if (!product) {
  return next(new AppError('Product not found', 404));
}

// وسيط معالجة الأخطاء
app.use(errorMiddleware);
```

## أمثلة

### مثال لواجهة إنشاء منتج

**طلب**:
```
POST /api/v1/products
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Smartphone XYZ",
  "description": "Latest smartphone with advanced features",
  "price": 599.99,
  "category": "Electronics",
  "stock": 100,
  "images": [
    "https://example.com/images/smartphone-xyz-1.jpg",
    "https://example.com/images/smartphone-xyz-2.jpg"
  ]
}
```

**استجابة ناجحة**:
```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "status": "success",
  "data": {
    "id": 123,
    "name": "Smartphone XYZ",
    "description": "Latest smartphone with advanced features",
    "price": 599.99,
    "category": "Electronics",
    "stock": 100,
    "images": [
      "https://example.com/images/smartphone-xyz-1.jpg",
      "https://example.com/images/smartphone-xyz-2.jpg"
    ],
    "createdAt": "2023-05-01T12:00:00Z",
    "updatedAt": "2023-05-01T12:00:00Z"
  }
}
```

**استجابة خطأ**:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "status": "error",
  "message": "Invalid input data",
  "errors": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    },
    {
      "field": "category",
      "message": "Category is required"
    }
  ]
}
```

### مثال لواجهة الحصول على قائمة المنتجات مع ترشيح وصفحات

**طلب**:
```
GET /api/v1/products?category=Electronics&minPrice=500&maxPrice=1000&page=1&limit=10&sort=price:asc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**استجابة**:
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "data": [
    {
      "id": 123,
      "name": "Smartphone XYZ",
      "price": 599.99,
      "category": "Electronics",
      "rating": 4.5
    },
    {
      "id": 124,
      "name": "Laptop ABC",
      "price": 899.99,
      "category": "Electronics",
      "rating": 4.8
    }
    // المزيد من المنتجات...
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "totalItems": 25
    },
    "filters": {
      "category": "Electronics",
      "minPrice": 500,
      "maxPrice": 1000
    },
    "sort": "price:asc"
  }
}
```

---

## ملاحظة

هذه الإرشادات قابلة للتطوير وقد تتغير مع تطور المشروع. يرجى الرجوع إلى هذا المستند بانتظام للحصول على أحدث الإرشادات والممارسات الموصى بها.