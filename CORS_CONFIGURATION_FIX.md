# إصلاح إعدادات CORS لدعم Flutter Web

## المشكلة
عند استخدام Flutter Web مع رفع الملفات، قد تحدث مشاكل CORS تمنع التطبيق من التواصل مع الخادم.

## الحل

### 1. تحديث إعدادات CORS في API Gateway

```javascript
// في api-gateway/index.js
const corsOptions = {
  origin: function (origin, callback) {
    // السماح للطلبات بدون origin (مثل تطبيقات الموبايل)
    if (!origin) return callback(null, true);
    
    // السماح لجميع localhost origins أثناء التطوير
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // إضافة دعم Flutter Web development server
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // رفض المصادر الأخرى
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'x-app-version',
    'X-CSRF-Token',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match',
    'User-Agent',
    'Referer',
    'DNT',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: ['Authorization', 'Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 hours
};
```

### 2. تحديث إعدادات CORS في Upload Service

```javascript
// في upload-service/index.js
const cors = require('cors');

// إعدادات CORS محسنة لخدمة الرفع
const corsOptions = {
  origin: function (origin, callback) {
    // السماح للطلبات المحلية
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // يمكن إضافة domains أخرى هنا للإنتاج
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// معالجة preflight requests بشكل صريح
app.options('*', cors(corsOptions));
```

### 3. إضافة middleware خاص لرفع الملفات

```javascript
// في upload-service/index.js
// إضافة middleware للتعامل مع Flutter Web
app.use('/upload', (req, res, next) => {
  // إضافة headers خاصة لـ Flutter Web
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // معالجة preflight
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
```

### 4. تحديث Flutter Web Configuration

```dart
// في Flutter - إضافة headers مطلوبة
class ApiService {
  static const String baseUrl = 'http://localhost:5001';
  
  static Map<String, String> get defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Request-With',
  };
  
  // للطلبات العادية
  static Future<http.Response> get(String endpoint) async {
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: defaultHeaders,
    );
    return response;
  }
  
  // لرفع الملفات
  static Future<http.StreamedResponse> uploadFile(String endpoint, Uint8List fileBytes, String fileName) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl$endpoint'));
    
    // إضافة headers
    request.headers.addAll({
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    
    // إضافة الملف
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        fileBytes,
        filename: fileName,
      ),
    );
    
    return await request.send();
  }
}
```

### 5. إعدادات إضافية لـ Flutter Web

```html
<!-- في web/index.html -->
<head>
  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="description" content="SuperMall App">
  
  <!-- إضافة meta tags للأمان -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' http://localhost:* https://localhost:* data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';">
  
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="SuperMall">
  <link rel="apple-touch-icon" href="icons/Icon-192.png">
  
  <title>SuperMall</title>
  <link rel="manifest" href="manifest.json">
</head>
```

## خطوات التطبيق

1. **تحديث API Gateway**:
   ```bash
   # تحديث ملف api-gateway/index.js
   ```

2. **تحديث Upload Service**:
   ```bash
   # تحديث ملف upload-service/index.js
   ```

3. **إعادة تشغيل الخدمات**:
   ```bash
   cd c:\Users\Win10\Desktop\supermall-backend
   node start-all.js
   ```

4. **تحديث Flutter App**:
   - استخدم `file_picker` package
   - طبق الكود المحدث لرفع الملفات
   - اختبر في بيئة الويب

## اختبار الحل

```bash
# اختبار CORS
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:5001/upload
```

يجب أن ترى headers CORS في الاستجابة.

## ملاحظات

- هذه الإعدادات مخصصة للتطوير
- في الإنتاج، يجب تحديد domains محددة بدلاً من `*`
- تأكد من تحديث جميع الخدمات لتتوافق مع إعدادات CORS الجديدة