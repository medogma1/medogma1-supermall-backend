# دليل استكشاف الأخطاء وإصلاحها - خدمة البائعين

## مشكلة: خطأ 401 Unauthorized عند PUT /vendors/:id/settings

### السبب الجذري
المشكلة الأساسية هي أن التطبيق يرسل توكن JWT غير صالح. الخطأ `jwt malformed` يشير إلى أن التوكن المرسل ليس بتنسيق JWT الصحيح.

### الحلول

#### 1. التحقق من التوكن في التطبيق
```dart
// في Flutter، تأكد من أن التوكن يتم حفظه واسترجاعه بشكل صحيح
String? token = await storage.read(key: 'auth_token');
if (token == null || token.isEmpty) {
  // إعادة توجيه للتسجيل
  return;
}

// التأكد من إضافة Bearer قبل التوكن
headers: {
  'Authorization': 'Bearer $token',
  'Content-Type': 'application/json',
}
```

#### 2. التحقق من عملية تسجيل الدخول
تأكد من أن خدمة المصادقة ترجع توكن JWT صالح:
```javascript
// في auth-service، تأكد من إنشاء التوكن بشكل صحيح
const token = jwt.sign(
  {
    id: user.id,
    vendorId: user.vendorId, // مهم للبائعين
    email: user.email,
    role: user.role
  },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);
```

#### 3. البيانات المطلوبة لتحديث إعدادات المتجر
عند إرسال طلب PUT لتحديث إعدادات المتجر، يجب تضمين البيانات التالية:

```json
{
  "storeName": "اسم المتجر",
  "storeDescription": "وصف المتجر",
  "storeLogoUrl": "رابط شعار المتجر",
  "contactEmail": "email@example.com",
  "contactPhone": "+966501234567",
  "storeAddress": "عنوان المتجر الكامل",
  "businessHours": {
    "monday": { "open": "09:00", "close": "18:00" },
    "tuesday": { "open": "09:00", "close": "18:00" }
    // ... باقي الأيام
  }
}
```

### اختبار الحل

#### استخدام التوكن الصالح للاختبار
```bash
# تشغيل مولد التوكن
node test-auth.js

# استخدام التوكن المُنشأ في الطلب
curl -X PUT "http://localhost:5005/vendors/52/settings" \
  -H "Authorization: Bearer [TOKEN_HERE]" \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "متجر تجريبي",
    "storeDescription": "وصف المتجر",
    "storeLogoUrl": "https://example.com/logo.png",
    "contactEmail": "test@example.com",
    "contactPhone": "+966501234567",
    "storeAddress": "الرياض، السعودية"
  }'
```

### رسائل الخطأ الشائعة

1. **"jwt malformed"** - التوكن ليس بتنسيق JWT صحيح
2. **"غير مصرح - التوكن مطلوب"** - لم يتم إرسال التوكن
3. **"توكن غير صالح"** - التوكن منتهي الصلاحية أو مُوقع بمفتاح خاطئ
4. **"بيانات غير مكتملة"** - بيانات مطلوبة مفقودة في الطلب

### نصائح للمطورين

1. **تسجيل التوكن**: أضف console.log لطباعة التوكن قبل الإرسال
2. **فحص انتهاء الصلاحية**: تحقق من تاريخ انتهاء التوكن
3. **التحقق من المفتاح السري**: تأكد من أن JWT_SECRET متطابق في جميع الخدمات
4. **استخدام أدوات التطوير**: استخدم jwt.io لفحص محتوى التوكن

### ملفات الاختبار المتوفرة

- `test-auth.js` - لإنشاء توكنات اختبار صالحة
- `test-request.js` - لاختبار المسارات مع توكنات مختلفة

### المسارات المحمية في خدمة البائعين

- `PUT /vendors/:id/settings` - تحديث إعدادات المتجر (بائع أو مدير)
- `GET /vendors/:id/settings` - جلب إعدادات المتجر (بائع أو مدير)
- `PUT /vendors/:id` - تحديث بيانات البائع (بائع أو مدير)
- `POST /vendors/:vendorId/upload-logo` - رفع شعار المتجر (بائع أو مدير)

### الصلاحيات

- **البائع**: يمكنه الوصول لبياناته وإعداداته فقط
- **المدير**: يمكنه الوصول لجميع البيانات والإعدادات