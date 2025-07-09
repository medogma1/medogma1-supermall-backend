# اختبارات Postman لواجهة API البائعين

هذا المجلد يحتوي على مجموعة اختبارات Postman لواجهة API البائعين في نظام SuperMall.

## المحتويات

- `vendor-api.postman_collection.json`: مجموعة اختبارات Postman لواجهة API البائعين.
- `vendor-api.postman_environment.json`: ملف بيئة Postman يحتوي على المتغيرات المستخدمة في الاختبارات.
- `newman.config.json`: ملف تكوين Newman لتشغيل الاختبارات من سطر الأوامر.

## متطلبات التشغيل

1. تثبيت Postman: [تحميل Postman](https://www.postman.com/downloads/)
2. تثبيت Newman (لتشغيل الاختبارات من سطر الأوامر):

```bash
npm install -g newman newman-reporter-htmlextra
```

## كيفية التشغيل

### باستخدام Postman

1. افتح Postman.
2. استورد مجموعة الاختبارات `vendor-api.postman_collection.json`.
3. استورد ملف البيئة `vendor-api.postman_environment.json`.
4. اختر البيئة "Vendor API - Local" من القائمة المنسدلة للبيئات.
5. قم بتشغيل المجموعة كاملة أو اختبارات محددة.

### باستخدام Newman (سطر الأوامر)

1. انتقل إلى مجلد الاختبارات:

```bash
cd tests/postman
```

2. قم بتشغيل الاختبارات باستخدام ملف التكوين:

```bash
newman run newman.config.json
```

أو قم بتشغيل الاختبارات مباشرة:

```bash
newman run vendor-api.postman_collection.json -e vendor-api.postman_environment.json
```

3. لإنشاء تقرير HTML:

```bash
newman run vendor-api.postman_collection.json -e vendor-api.postman_environment.json -r htmlextra --reporter-htmlextra-export ../reports/newman/vendor-api-report.html
```

## تقارير الاختبارات

عند تشغيل الاختبارات باستخدام Newman مع ملف التكوين، سيتم إنشاء تقارير في المجلد `../reports/newman/`:

- `vendor-api-report.html`: تقرير HTML مفصل.
- `vendor-api-report.json`: تقرير JSON يمكن استخدامه للتكامل مع أنظمة أخرى.

## إضافة اختبارات جديدة

1. افتح Postman.
2. استورد مجموعة الاختبارات الحالية.
3. أضف طلبات جديدة أو مجلدات جديدة حسب الحاجة.
4. أضف اختبارات للطلبات الجديدة باستخدام علامة التبويب "Tests".
5. قم بتصدير المجموعة المحدثة واستبدال الملف الحالي.

## ملاحظات

- تأكد من تشغيل خادم API المحلي قبل تشغيل الاختبارات.
- يمكن تعديل ملف البيئة لاستخدام خادم API مختلف (مثل بيئة الاختبار أو الإنتاج).
- يمكن إضافة متغيرات بيئة إضافية حسب الحاجة.