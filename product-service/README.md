# خدمة المنتجات - SuperMall

هذه الخدمة مسؤولة عن إدارة المنتجات والفئات والمراجعات والمفضلات في تطبيق SuperMall.

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
PORT=5002

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
VENDOR_SERVICE_URL=http://localhost:5003
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

## واجهات برمجة التطبيقات (APIs)

### المنتجات

- `GET /api/products` - الحصول على قائمة المنتجات
- `GET /api/products/:id` - الحصول على منتج محدد
- `POST /api/products` - إنشاء منتج جديد (للبائعين فقط)
- `PUT /api/products/:id` - تحديث منتج (للبائعين فقط)
- `DELETE /api/products/:id` - حذف منتج (للبائعين فقط)

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

### البحث

- `GET /api/search` - البحث عن منتجات

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