# Product Service - Enhanced

خدمة إدارة المنتجات المحسنة في نظام SuperMall مع دعم MySQL وميزات متقدمة

## الميزات الجديدة

### 🚀 التحسينات الأساسية
- **قاعدة بيانات MySQL محسنة** مع جداول منفصلة للعلامات
- **نظام علامات متقدم** مع إمكانية البحث والتصفية
- **إدارة مخزون محسنة** مع تتبع التغييرات
- **نظام تقييمات محسن** مع حسابات تلقائية
- **إحصائيات شاملة** للمنتجات والمبيعات
- **دعم متغيرات المنتج** (الحجم، اللون، إلخ)
- **نظام صور متعددة** لكل منتج
- **تتبع المخزون** مع سجل التغييرات

### 🔍 ميزات البحث المتقدمة
- البحث النصي الكامل في الأسماء والأوصاف
- البحث بالعلامات المتعددة
- تصفية متقدمة بالسعر والفئة والمخزون
- ترتيب ذكي بالسعر والتقييم والتاريخ

### 📊 الإحصائيات والتحليلات
- إحصائيات شاملة للمنتجات
- تتبع المخزون والمبيعات
- تحليل الأداء والتقييمات
- تقارير البائعين

## المتطلبات

- Node.js (v14 أو أحدث)
- MySQL (v8 أو أحدث)

## التثبيت

1. قم بتثبيت الاعتماديات:

```bash
npm install
```

2. قم بإنشاء ملف `.env` في المجلد الرئيسي للخدمة وأضف المتغيرات البيئية التالية:

```
NODE_ENV=development
PORT=5003

# إعدادات قاعدة البيانات MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=supermall_products

# إعدادات JWT
JWT_SECRET=your_jwt_secret

# إعدادات الصفحات
PAGINATION_LIMIT=10

# عناوين الخدمات الأخرى
AUTH_SERVICE_URL=http://localhost:5001
VENDOR_SERVICE_URL=http://localhost:5004
```

3. قم بإنشاء قاعدة البيانات وجداولها:

```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS supermall_products CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# استيراد هيكل قاعدة البيانات
mysql -u root -p supermall_products < config/database.sql
```

## تشغيل الخدمة

### وضع التطوير

```bash
npm run dev
```

### وضع الإنتاج

```bash
npm start
```

### اختبار الخدمة
```bash
# اختبار شامل للميزات الجديدة
node test-enhanced-product-service.js
```

## API Endpoints المحسنة

### المنتجات الأساسية
```
POST   /api/products              - إنشاء منتج جديد
GET    /api/products              - جلب جميع المنتجات مع تصفية متقدمة
GET    /api/products/:id          - جلب منتج محدد
PUT    /api/products/:id          - تحديث منتج
DELETE /api/products/:id          - حذف منتج
```

### البحث والتصفية
```
GET    /api/products/search           - البحث النصي في المنتجات
GET    /api/products/search/tags      - البحث بالعلامات
GET    /api/products/vendor/:vendorId - منتجات بائع محدد
```

### العلامات والتقييمات
```
GET    /api/products/:id/tags     - جلب علامات منتج
PUT    /api/products/:id/rating   - تحديث تقييم منتج
```

### الإحصائيات
```
GET    /api/products/stats        - إحصائيات شاملة للمنتجات
```

### الفئات

- `GET /api/categories` - الحصول على قائمة الفئات الرئيسية
- `GET /api/categories/:id` - الحصول على فئة رئيسية محددة
- `GET /api/categories/:id/subcategories` - الحصول على الفئات الفرعية لفئة رئيسية
- `POST /api/categories` - إنشاء فئة رئيسية جديدة (للمسؤولين فقط)
- `PUT /api/categories/:id` - تحديث فئة رئيسية (للمسؤولين فقط)
- `DELETE /api/categories/:id` - حذف فئة رئيسية (للمسؤولين فقط)

### المراجعات

- `GET /api/products/:id/reviews` - الحصول على مراجعات منتج
- `POST /api/products/:id/reviews` - إضافة مراجعة لمنتج
- `PUT /api/reviews/:id` - تحديث حالة مراجعة (للمسؤولين فقط)
- `POST /api/reviews/:id/report` - الإبلاغ عن مراجعة

### المفضلات

- `GET /api/favorites` - الحصول على قائمة المفضلات للمستخدم الحالي
- `POST /api/favorites` - إضافة عنصر إلى المفضلة
- `DELETE /api/favorites/:id` - إزالة عنصر من المفضلة

### البحث المتقدم

- `GET /api/search` - البحث عن منتجات

## معاملات التصفية المتقدمة

### جلب المنتجات مع تصفية
```
GET /api/products?page=1&limit=10&category=1&minPrice=100&maxPrice=1000&inStock=true&vendor=1&sortBy=price_asc
```

### البحث بالعلامات
```
GET /api/products/search/tags?tags=smartphone,apple&page=1&limit=10
```

### إحصائيات البائع
```
GET /api/products/stats?vendorId=1
```

## هيكل قاعدة البيانات المحسنة

### الجداول الرئيسية
- `products` - المنتجات الأساسية
- `product_tags` - علامات المنتجات (جدول منفصل)
- `categories` - فئات المنتجات
- `product_images` - صور متعددة للمنتجات
- `product_variants` - متغيرات المنتج
- `product_reviews` - مراجعات المنتجات
- `product_inventory_log` - سجل تغييرات المخزون

### الفهارس المحسنة
- فهارس مركبة للبحث السريع
- فهارس النص الكامل للبحث
- فهارس الأداء للتصفية

## هيكل المشروع

```
product-service/
├── config/
│   ├── database.js     # إعدادات الاتصال بقاعدة البيانات
│   └── database.sql    # هيكل قاعدة البيانات
├── controllers/        # وحدات التحكم بالطلبات
├── middleware/         # الوسائط البرمجية
├── models/             # نماذج البيانات
├── routes/             # مسارات API
├── utils/              # أدوات مساعدة
├── .env                # متغيرات البيئة
├── index.js            # نقطة الدخول للتطبيق
└── package.json        # تبعيات المشروع
```

## التحويل من MongoDB إلى MySQL

تم تحويل هذه الخدمة من استخدام MongoDB إلى MySQL. تم تحديث جميع النماذج والوحدات للعمل مع MySQL بدلاً من Mongoose.

### التغييرات الرئيسية:

1. استبدال مخططات Mongoose بفئات JavaScript تحتوي على طرق ثابتة للتفاعل مع MySQL
2. تحويل استعلامات MongoDB إلى استعلامات SQL
3. إضافة تنسيق للبيانات لتحويل snake_case إلى camelCase
4. تخزين البيانات المعقدة (مثل المصفوفات والكائنات) كـ JSON في MySQL

## المساهمة

يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) للحصول على تفاصيل حول عملية تقديم طلبات السحب.

## الترخيص

هذا المشروع مرخص بموجب [ترخيص MIT](LICENSE).