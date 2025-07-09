# خدمة المصادقة والمستخدمين - SuperMall

هذه الخدمة مسؤولة عن إدارة المستخدمين والمصادقة والتفويض في تطبيق SuperMall.

## المتطلبات

- Node.js (v14 أو أحدث)
- MySQL (v8 أو أحدث)

## المتطلبات

- Node.js (v14 أو أحدث)
- MySQL (v8 أو أحدث)

## حساب المسؤول

### معلومات حساب المسؤول الافتراضي

يتم إنشاء حساب مسؤول افتراضي تلقائيًا عند بدء تشغيل خدمة المصادقة إذا لم يكن موجودًا بالفعل. تفاصيل الحساب هي:

- **اسم المستخدم**: admin
- **البريد الإلكتروني**: admin@supermall.com
- **كلمة المرور**: xx100100
- **الدور**: admin

### ملاحظات حول حساب المسؤول

- تم تخفيف متطلبات كلمة مرور المسؤول بحيث لا تتطلب حروف كبيرة أو صغيرة.
- يمكن تسجيل الدخول باستخدام كلمة المرور بغض النظر عن حالة الأحرف.
- يتم التحقق من وجود حساب المسؤول عند بدء تشغيل الخدمة وإنشائه تلقائيًا إذا لم يكن موجودًا.

## التثبيت

1. قم بتثبيت الاعتماديات:

```bash
npm install
```

2. قم بإنشاء ملف `.env` في المجلد الرئيسي للخدمة وأضف المتغيرات البيئية التالية:

```
NODE_ENV=development
PORT=5001

# إعدادات قاعدة البيانات MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=supermall_auth

# إعدادات JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7

# إعدادات البريد الإلكتروني
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USERNAME=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@supermall.com

# عناوين الخدمات الأخرى
PRODUCT_SERVICE_URL=http://localhost:5002
VENDOR_SERVICE_URL=http://localhost:5003
```

3. قم بإنشاء قاعدة البيانات وجداولها:

```bash
# إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS supermall_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# استيراد هيكل قاعدة البيانات
mysql -u root -p supermall_auth < config/database.sql
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

### المصادقة

- `POST /api/auth/register` - تسجيل مستخدم جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/logout` - تسجيل الخروج
- `GET /api/auth/verify-email/:token` - تأكيد البريد الإلكتروني
- `POST /api/auth/forgot-password` - طلب إعادة تعيين كلمة المرور
- `POST /api/auth/reset-password/:token` - إعادة تعيين كلمة المرور

### الملف الشخصي

- `GET /api/profile` - الحصول على الملف الشخصي للمستخدم الحالي
- `PUT /api/profile` - تحديث الملف الشخصي للمستخدم الحالي
- `PUT /api/profile/password` - تغيير كلمة المرور
- `POST /api/profile/image` - تحميل صورة الملف الشخصي

### المستخدمين (للمسؤولين فقط)

- `GET /api/users` - الحصول على قائمة المستخدمين
- `GET /api/users/:id` - الحصول على مستخدم محدد
- `POST /api/users` - إنشاء مستخدم جديد
- `PUT /api/users/:id` - تحديث مستخدم
- `DELETE /api/users/:id` - حذف مستخدم
- `PUT /api/users/:id/status` - تغيير حالة المستخدم (تنشيط/تعطيل)

### الإشعارات

- `GET /api/notifications` - الحصول على إشعارات المستخدم الحالي
- `PUT /api/notifications/:id/read` - تحديد إشعار كمقروء
- `PUT /api/notifications/read-all` - تحديد جميع الإشعارات كمقروءة

## هيكل المشروع

```
auth-service/
├── config/
│   ├── database.js     # إعدادات الاتصال بقاعدة البيانات
│   └── database.sql    # هيكل قاعدة البيانات
├── controllers/        # وحدات التحكم بالطلبات
├── middleware/         # الوسائط البرمجية
├── models/             # نماذج البيانات
├── routes/             # مسارات API
├── utils/              # أدوات مساعدة
│   ├── constants.js    # الثوابت والتحققات
│   ├── email.js        # إرسال البريد الإلكتروني
│   └── errorHandler.js # معالجة الأخطاء
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
4. تخزين البيانات المعقدة (مثل العناوين وإعدادات المستخدم) كـ JSON في MySQL

## التحديثات الأخيرة

### تحسينات حساب المسؤول (2023-12-15)

- تم إضافة وظيفة `createAdminIfNotExists()` في نموذج المستخدم لإنشاء حساب المسؤول تلقائيًا عند بدء تشغيل الخدمة.
- تم تخفيف متطلبات كلمة مرور المسؤول بحيث لا تتطلب حروف كبيرة أو صغيرة.
- تم تعديل وظيفة تسجيل الدخول للسماح بتسجيل دخول المسؤول بغض النظر عن حالة الأحرف في كلمة المرور.

## المساهمة

يرجى قراءة [دليل المساهمة](CONTRIBUTING.md) للحصول على تفاصيل حول عملية تقديم طلبات السحب.

## الترخيص

هذا المشروع مرخص بموجب [ترخيص MIT](LICENSE).