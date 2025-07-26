# دليل رفع شعار المتجر (Store Logo Upload)

## نظرة عامة
تم إضافة ميزة رفع شعار المتجر مباشرة من الجهاز بدلاً من استخدام رابط URL فقط. هذه الميزة تسمح للبائعين برفع صور الشعار مباشرة إلى الخادم.

## الميزات الجديدة

### 1. نقطة نهاية جديدة لرفع الشعار
```
POST /vendors/:vendorId/upload-logo
```

### 2. المواصفات التقنية
- **الحد الأقصى لحجم الملف**: 5MB
- **أنواع الملفات المدعومة**: جميع أنواع الصور (JPEG, PNG, GIF, SVG, إلخ)
- **المصادقة**: مطلوبة (توكن البائع أو المشرف)
- **التخزين**: في مجلد `vendor-service/uploads/`

### 3. الصلاحيات
- **البائع**: يمكنه رفع شعار لمتجره فقط
- **المشرف**: يمكنه رفع شعار لأي متجر

## كيفية الاستخدام

### 1. باستخدام cURL

#### رفع شعار للبائع الحالي
```bash
curl -X POST "http://localhost:5001/vendors/53/upload-logo" \
  -H "Authorization: Bearer YOUR_VENDOR_TOKEN" \
  -F "logo=@path/to/your/logo.jpg"
```

#### رفع شعار كمشرف
```bash
curl -X POST "http://localhost:5001/vendors/53/upload-logo" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "logo=@path/to/your/logo.jpg"
```

### 2. باستخدام JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('logo', fileInput.files[0]);

fetch(`/vendors/${vendorId}/upload-logo`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('تم رفع الشعار:', data.logoUrl);
})
.catch(error => {
  console.error('خطأ في رفع الشعار:', error);
});
```

### 3. باستخدام Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

Future<String?> uploadStoreLogo(File logoFile, String vendorId, String token) async {
  try {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/vendors/$vendorId/upload-logo'),
    );
    
    request.headers['Authorization'] = 'Bearer $token';
    
    request.files.add(
      await http.MultipartFile.fromPath(
        'logo',
        logoFile.path,
        contentType: MediaType('image', 'jpeg'), // أو نوع الصورة المناسب
      ),
    );
    
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 200) {
      var data = json.decode(responseData);
      return data['logoUrl'];
    } else {
      print('خطأ في رفع الشعار: ${response.statusCode}');
      return null;
    }
  } catch (e) {
    print('خطأ في رفع الشعار: $e');
    return null;
  }
}
```

## الاستجابات

### نجح الرفع (200 OK)
```json
{
  "message": "تم رفع الشعار بنجاح",
  "logoUrl": "/uploads/logo-1737437628123-logo.jpg",
  "vendor": {
    "id": 53,
    "store_logo_url": "/uploads/logo-1737437628123-logo.jpg",
    // ... باقي بيانات البائع
  }
}
```

### خطأ في المصادقة (401 Unauthorized)
```json
{
  "status": "fail",
  "message": "غير مصرح - التوكن مطلوب"
}
```

### خطأ في الصلاحيات (403 Forbidden)
```json
{
  "message": "غير مسموح - لا يمكنك رفع شعار لمتجر آخر"
}
```

### خطأ في الملف (400 Bad Request)
```json
{
  "message": "يجب رفع صورة شعار المتجر"
}
```

### حجم الملف كبير (400 Bad Request)
```json
{
  "message": "حجم الملف كبير جداً. الحد الأقصى 5MB"
}
```

### نوع ملف غير مدعوم (400 Bad Request)
```json
{
  "message": "يُسمح برفع الصور فقط"
}
```

## إنشاء التوكنات للاختبار

يمكنك استخدام الملف `generate-token.js` لإنشاء توكنات صالحة للاختبار:

```bash
node generate-token.js
```

## اختبار الميزة

### 1. اختبار بسيط
```bash
# إنشاء صورة اختبار
echo '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#4CAF50"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="16">LOGO</text></svg>' > test-logo.svg

# رفع الشعار
curl -X POST "http://localhost:5001/vendors/53/upload-logo" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "logo=@test-logo.svg"

# تنظيف
del test-logo.svg
```

### 2. اختبار شامل
```bash
node test-logo-upload.js
```

## التكامل مع الواجهة الأمامية

### تحديث نموذج إعدادات المتجر

بدلاً من حقل إدخال URL فقط، يمكنك إضافة خيار لرفع الصورة:

```html
<!-- الطريقة القديمة -->
<input type="url" name="storeLogoUrl" placeholder="رابط شعار المتجر">

<!-- الطريقة الجديدة -->
<div>
  <label>شعار المتجر:</label>
  <input type="file" name="logoFile" accept="image/*">
  <span>أو</span>
  <input type="url" name="storeLogoUrl" placeholder="رابط شعار المتجر">
</div>
```

### معالجة الرفع في JavaScript

```javascript
function handleLogoUpload(vendorId, token) {
  const fileInput = document.querySelector('input[name="logoFile"]');
  const urlInput = document.querySelector('input[name="storeLogoUrl"]');
  
  if (fileInput.files.length > 0) {
    // رفع الملف
    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);
    
    return fetch(`/vendors/${vendorId}/upload-logo`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    .then(response => response.json())
    .then(data => data.logoUrl);
  } else if (urlInput.value) {
    // استخدام الرابط
    return Promise.resolve(urlInput.value);
  } else {
    return Promise.reject('يجب رفع صورة أو إدخال رابط');
  }
}
```

## الملاحظات المهمة

1. **الأمان**: يتم التحقق من نوع الملف وحجمه قبل الرفع
2. **التخزين**: الملفات تُحفظ في مجلد `uploads/` مع أسماء فريدة
3. **الصلاحيات**: كل بائع يمكنه رفع شعار لمتجره فقط
4. **التوافق**: الميزة تعمل مع الطريقة القديمة (URL) والجديدة (رفع مباشر)
5. **الأداء**: يُنصح بضغط الصور قبل الرفع لتحسين الأداء

## استكشاف الأخطاء

### مشكلة: "Proxy error"
- تأكد من تشغيل خدمة البائع على المنفذ 5005
- تأكد من تشغيل API Gateway على المنفذ 5001

### مشكلة: "توكن غير صالح"
- تأكد من استخدام مفتاح JWT الصحيح: `supermall_secret_key_2024`
- تأكد من أن التوكن لم ينته صلاحيته

### مشكلة: "حجم الملف كبير"
- الحد الأقصى هو 5MB
- قم بضغط الصورة أو تقليل جودتها

### مشكلة: "نوع ملف غير مدعوم"
- تأكد من أن الملف هو صورة (JPEG, PNG, GIF, SVG, إلخ)
- تحقق من MIME type للملف