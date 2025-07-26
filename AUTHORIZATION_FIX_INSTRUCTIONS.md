# تعليمات تطبيق إصلاحات الصلاحيات

## الملفات المُحدثة:

1. **vendor-service/middleware/roleMiddleware.js** - جديد
2. **vendor-service/routes/vendorRoutes.js** - محدث
3. **vendor-service/tests/authorization.test.js** - جديد

## خطوات التطبيق:

### 1. إعادة تشغيل خدمة البائعين:
```bash
cd vendor-service
npm restart
# أو
pm2 restart vendor-service
```

### 2. تشغيل الاختبارات:
```bash
cd vendor-service
npm test tests/authorization.test.js
```

### 3. اختبار يدوي:
```bash
# اختبار وصول البائع لقائمة البائعين (يجب أن يفشل)
curl -H "Authorization: Bearer VENDOR_TOKEN" \
     http://localhost:5001/vendors

# اختبار وصول المدير لقائمة البائعين (يجب أن ينجح)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:5001/vendors
```

## التحقق من النجاح:

- [ ] البائع لا يمكنه الوصول لقائمة البائعين (403)
- [ ] المدير يمكنه الوصول لقائمة البائعين (200)
- [ ] البائع يمكنه الوصول لإعداداته فقط (200)
- [ ] البائع لا يمكنه الوصول لإعدادات بائع آخر (403)

## في حالة المشاكل:

1. تحقق من logs الخدمة
2. تأكد من إعادة تشغيل الخدمة
3. تحقق من صحة التوكنات
4. راجع ملف النسخة الاحتياطية إذا لزم الأمر
