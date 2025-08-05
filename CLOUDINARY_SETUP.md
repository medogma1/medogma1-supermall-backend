# دليل إعداد Cloudinary - Super Mall Backend

## حالة التكامل الحالية ✅

تم تثبيت وتكوين Cloudinary بنجاح في النظام، ولكن يحتاج إلى API Secret صحيح لإكمال الإعداد.

## الملفات المُحدثة 📁

### 1. ملفات التكوين
- `utils/cloudinary.js` - وظائف Cloudinary الأساسية
- `utils/cloudinaryMiddleware.js` - وسائط التحقق والأمان
- `utils/config.js` - إعدادات التكوين
- `.env` - متغيرات البيئة

### 2. خدمة الرفع
- `upload-service/index.js` - تم إضافة endpoints جديدة لـ Cloudinary

## API Endpoints الجديدة 🚀

### 1. رفع الصور إلى Cloudinary
```
POST /upload/cloudinary
Content-Type: multipart/form-data

Body: { file: [image file] }

Response:
{
  "success": true,
  "data": {
    "public_id": "supermall/image_id",
    "secure_url": "https://res.cloudinary.com/...",
    "width": 800,
    "height": 600,
    "format": "jpg",
    "storage": "cloudinary"
  }
}
```

### 2. حذف الصور من Cloudinary
```
DELETE /cloudinary/:publicId

Response:
{
  "success": true,
  "message": "تم حذف الصورة بنجاح"
}
```

### 3. تحسين الصور
```
GET /cloudinary/optimize/:publicId?width=300&height=300&quality=auto

Response:
{
  "success": true,
  "optimized_url": "https://res.cloudinary.com/...",
  "square_url": "https://res.cloudinary.com/..."
}
```

## إعداد متغيرات البيئة 🔧

### الحصول على الإعدادات الصحيحة من Cloudinary:

1. **تسجيل الدخول إلى Cloudinary Dashboard:**
   - اذهب إلى: https://cloudinary.com/console
   - سجل دخولك إلى حسابك

2. **نسخ الإعدادات:**
   - في الصفحة الرئيسية، ستجد قسم "Account Details"
   - انسخ القيم التالية:
     - `Cloud name`
     - `API Key`
     - `API Secret` (اضغط على "Reveal" لإظهاره)

3. **تحديث ملف .env:**
```env
# إعدادات Cloudinary
CLOUD_NAME=your_actual_cloud_name
CLOUD_API_KEY=your_actual_api_key
CLOUD_API_SECRET=your_actual_api_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## اختبار التكامل 🧪

### 1. اختبار الإعدادات:
```bash
node verify-cloudinary.js
```

### 2. اختبار رفع صورة:
```bash
curl -X POST http://localhost:3005/upload/cloudinary \
  -F "file=@path/to/your/image.jpg"
```

### 3. اختبار تحسين الصور:
```bash
curl http://localhost:3005/cloudinary/optimize/your_public_id?width=300&height=300
```

## الميزات المتاحة 🎯

### 1. رفع الصور
- رفع تلقائي إلى مجلد `supermall`
- تحسين تلقائي للجودة
- دعم تنسيقات: JPG, PNG, GIF, WebP
- حد أقصى: 5MB

### 2. تحسين الصور
- تغيير الأبعاد
- ضغط تلقائي
- تحويل التنسيق
- إنشاء صور مربعة للأفاتار

### 3. إدارة الصور
- حذف الصور
- الحصول على URLs محسنة
- معاينة بأحجام مختلفة

## الأمان 🔒

- التحقق من نوع الملف
- التحقق من حجم الملف
- التحقق من صحة الإعدادات
- معالجة الأخطاء الشاملة

## استكمال الإعداد ⚡

**الخطوات المطلوبة:**

1. **احصل على API Secret الصحيح من Cloudinary Dashboard**
2. **حدث ملف .env بالقيم الصحيحة**
3. **شغل اختبار التحقق:**
   ```bash
   node verify-cloudinary.js
   ```
4. **ابدأ الخدمة:**
   ```bash
   npm start
   ```

## حل المشاكل 🔧

### خطأ "api_secret mismatch":
- تأكد من نسخ API Secret بشكل صحيح
- تأكد من عدم وجود مسافات إضافية
- تأكد من أن الحساب نشط

### خطأ "Invalid Signature":
- تحقق من صحة جميع الإعدادات
- تأكد من تطابق Cloud Name مع الحساب

### خطأ الاتصال:
- تحقق من الاتصال بالإنترنت
- تأكد من عدم حجب Cloudinary بواسطة Firewall

---

**ملاحظة:** بمجرد إدخال API Secret الصحيح، سيعمل التكامل بشكل كامل وستتمكن من استخدام جميع ميزات Cloudinary في تطبيق Super Mall.