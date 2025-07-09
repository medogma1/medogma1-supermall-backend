# خدمة رفع الملفات (Upload Service)

خدمة مستقلة لرفع الملفات في تطبيق سوبر مول.

## المتطلبات

- Node.js (الإصدار 14 أو أحدث)
- npm

## التثبيت

```bash
npm install
```

## حل مشاكل التثبيت

إذا واجهت مشاكل مع مجلد `node_modules` أو تبعيات المشروع، يمكنك استخدام ملف `reinstall-dependencies.bat` لإعادة تثبيت التبعيات:

```bash
# تشغيل ملف إعادة التثبيت
./reinstall-dependencies.bat
```

هذا الملف سيقوم بحذف مجلد `node_modules` وملف `package-lock.json` ثم إعادة تثبيت جميع التبعيات من جديد.

## الأدوات المساعدة

تم توفير عدة أدوات لتسهيل استخدام وصيانة الخدمة:

1. **تشغيل الخدمة:**
   ```bash
   ./start-service.bat
   ```
   يقوم بالتحقق من وجود التبعيات وتشغيل الخدمة.

2. **تشخيص المشاكل:**
   ```bash
   ./diagnose.bat
   ```
   يقوم بفحص التكوين والتبعيات ومجلدات التحميل.

3. **اختبار الخدمة:**
   ```bash
   ./test-service.bat
   ```
   يقوم باختبار نقاط النهاية المختلفة ووظيفة رفع الملفات.

4. **استكشاف الأخطاء وإصلاحها:**
   راجع ملف `TROUBLESHOOTING.md` للحصول على معلومات مفصلة حول حل المشاكل الشائعة.

## تكوين الإعدادات

قم بإنشاء ملف `.env` في المجلد الرئيسي للمشروع وأضف الإعدادات التالية:

```
PORT=5009
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/svg+xml
```

## تشغيل الخدمة

```bash
npm start
```

## واجهات برمجة التطبيقات (APIs)

### رفع ملف

- **URL**: `/upload`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Parameter**: `file` (الملف المراد رفعه)

#### استجابة ناجحة

```json
{
  "success": true,
  "url": "http://localhost:5009/uploads/filename.jpg",
  "filename": "filename.jpg",
  "mimetype": "image/jpeg",
  "size": 12345
}
```

#### استجابة خاطئة

```json
{
  "success": false,
  "message": "رسالة الخطأ"
}
```

### التحقق من حالة الخدمة

- **URL**: `/health`
- **Method**: `GET`

#### استجابة

```json
{
  "status": "ok",
  "service": "upload-service"
}
```

### معلومات الخدمة

- **URL**: `/info`
- **Method**: `GET`

#### استجابة

```json
{
  "maxFileSize": 5242880,
  "allowedTypes": ["image/jpeg", "image/png", "image/gif", "image/svg+xml"]
}
```

## الوصول إلى الملفات المرفوعة

يمكن الوصول إلى الملفات المرفوعة من خلال المسار التالي:

```
http://localhost:5009/uploads/filename.jpg
```