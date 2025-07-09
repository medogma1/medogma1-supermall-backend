# خدمة البائعين (Vendor Service)

خدمة البائعين هي جزء من نظام SuperMall للتجارة الإلكترونية. تدير هذه الخدمة كل ما يتعلق بالبائعين والمتاجر، بما في ذلك إدارة الملفات الشخصية للبائعين، والفروع، والمعاملات المالية، وطلبات السحب، والتقييمات، والإعدادات.

## التحسينات المطبقة

- استخدام متغيرات البيئة في `.env` وملف `config.js`.
- تسجيل الأخطاء باستخدام مكتبة winston في `logger.js`.
- التحقق من نوع وحجم الصور المرفوعة.
- إضافة نقطة نهاية لرفع شعار المتجر.
- التحقق من صحة البيانات في نموذج البائع.
- **ترحيل قاعدة البيانات من MongoDB إلى MySQL**.

## المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- MySQL (الإصدار 8 أو أحدث)

## الإعداد

1. قم بإعداد ملف `.env` مع متغيرات البيئة المناسبة:

```
# متغيرات بيئية لخدمة البائعين
NODE_ENV=development
PORT=5003

# إعدادات قاعدة البيانات MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=supermall_vendors

# المصادقة والأمان
JWT_SECRET=your_jwt_secret_key

# إعدادات التصفية
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100

# عناوين الخدمات الأخرى
AUTH_SERVICE_URL=http://localhost:5000
PRODUCT_SERVICE_URL=http://localhost:5002

# مسار رفع الصور
UPLOADS_PATH=uploads/
```

2. قم بتثبيت التبعيات:

```bash
npm install express mysql2 multer dotenv winston
```

3. قم بإنشاء قاعدة البيانات وتهيئتها:

```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS supermall_vendors CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# استيراد هيكل قاعدة البيانات
mysql -u root -p supermall_vendors < config/database.sql
```

4. شغّل الخدمة:

```bash
# وضع التطوير
npm run dev

# وضع الإنتاج
npm start
```

## هيكل المشروع

```
vendor-service/
├── config/
│   ├── database.js     # إعداد اتصال MySQL
│   └── database.sql    # هيكل قاعدة البيانات
├── controllers/        # وحدات التحكم بالطلبات
├── middleware/         # الوسائط البرمجية
├── models/             # نماذج البيانات
├── routes/             # مسارات API
├── utils/              # أدوات مساعدة
├── uploads/            # لحفظ الصور المرفوعة
├── .env                # متغيرات البيئة
├── index.js            # نقطة الدخول للتطبيق
└── package.json        # تبعيات المشروع
```

## التغييرات الرئيسية في الترحيل من MongoDB إلى MySQL

1. **استبدال مخططات Mongoose بفئات JavaScript**:
   - تم إنشاء فئات JavaScript تحتوي على طرق ثابتة للعمليات الأساسية (CRUD).
   - تم استخدام مجمع اتصالات MySQL لتنفيذ استعلامات قاعدة البيانات.
   - تم إنشاء نماذج جديدة: `Vendor.js`, `VendorSettings.js`, و `Service.js`.

2. **تحويل الاستعلامات**:
   - تم تحويل استعلامات MongoDB إلى استعلامات SQL.
   - تم تنفيذ عمليات الفرز والتصفية والترتيب باستخدام جمل SQL.
   - تم تحديث وحدات التحكم `vendorController.js` و `serviceController.js` لاستخدام النماذج الجديدة.

3. **التعامل مع snake_case و camelCase**:
   - تم تنفيذ دوال مساعدة لتحويل أسماء الحقول بين snake_case (في قاعدة البيانات) و camelCase (في واجهة API).
   - تم تطبيق هذا التحويل في جميع النماذج لضمان اتساق واجهة API.

4. **تخزين البيانات المعقدة كـ JSON**:
   - تم استخدام أعمدة JSON في MySQL لتخزين البيانات المعقدة مثل social_media و address و location و working_hours و verification_documents.

5. **هيكل قاعدة البيانات**:
   - تم إنشاء ملفات SQL لتعريف هيكل قاعدة البيانات:
     - `vendors.sql`: لجدول البائعين
     - `vendor_settings.sql`: لجدول إعدادات البائعين
     - `vendor_ratings.sql`: لجدول تقييمات البائعين
     - `services.sql`: لجدول الخدمات
     - `init.sql`: لتهيئة قاعدة البيانات وتنفيذ جميع الملفات السابقة