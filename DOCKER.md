# دليل استخدام Docker مع Super Mall Backend

يوفر هذا الدليل تعليمات مفصلة حول كيفية استخدام Docker لتشغيل مشروع Super Mall Backend. يتيح Docker تشغيل جميع الخدمات المصغرة في بيئة معزولة ومتسقة، مما يسهل عملية التطوير والنشر.

## المتطلبات الأساسية

- [Docker](https://www.docker.com/get-started) (الإصدار 20.10.0 أو أحدث)
- [Docker Compose](https://docs.docker.com/compose/install/) (الإصدار 2.0.0 أو أحدث)
- مساحة قرص كافية (على الأقل 2 جيجابايت)

## هيكل الملفات

تتضمن إعدادات Docker في المشروع الملفات التالية:

- `docker-compose.yml`: ملف تكوين Docker Compose لتشغيل جميع الخدمات معًا
- `Dockerfile.template`: قالب Dockerfile يمكن استخدامه لكل خدمة مصغرة
- `.env.docker`: ملف متغيرات البيئة المخصص للاستخدام مع Docker
- `.dockerignore`: قائمة الملفات والمجلدات التي يجب تجاهلها عند بناء صور Docker

## بدء التشغيل السريع

لتشغيل المشروع بالكامل باستخدام Docker Compose:

1. انسخ ملف `.env.docker` إلى `.env`:

   ```bash
   cp .env.docker .env
   ```

2. قم بتشغيل جميع الخدمات باستخدام Docker Compose:

   ```bash
   docker-compose up -d
   ```

   سيقوم هذا الأمر ببناء وتشغيل جميع الخدمات المحددة في ملف `docker-compose.yml`.

3. للتحقق من حالة الخدمات:

   ```bash
   docker-compose ps
   ```

4. لعرض سجلات جميع الخدمات:

   ```bash
   docker-compose logs -f
   ```

   أو لعرض سجلات خدمة محددة:

   ```bash
   docker-compose logs -f <service-name>
   ```

5. لإيقاف جميع الخدمات:

   ```bash
   docker-compose down
   ```

## تشغيل خدمات محددة

يمكنك تشغيل خدمات محددة فقط باستخدام الأمر التالي:

```bash
docker-compose up -d <service1> <service2> ...
```

على سبيل المثال، لتشغيل بوابة API وخدمة المصادقة وخدمة المستخدم فقط:

```bash
docker-compose up -d mysql redis api-gateway auth-service user-service
```

## إدارة البيانات

يتم تخزين بيانات MySQL في حجم Docker مسمى `mysql_data`. هذا يضمن استمرار البيانات حتى بعد إيقاف الحاويات.

لحذف جميع البيانات وإعادة ضبط قاعدة البيانات:

```bash
docker-compose down -v
```

> **تحذير**: سيؤدي هذا الأمر إلى حذف جميع البيانات المخزنة في أحجام Docker.

## تخصيص الإعدادات

### تعديل منافذ الخدمات

يمكنك تعديل المنافذ المعروضة للخدمات عن طريق تغيير القيم في ملف `.env` أو عن طريق تعديل ملف `docker-compose.yml` مباشرة.

### تخصيص إعدادات قاعدة البيانات

يمكنك تعديل إعدادات MySQL عن طريق تغيير المتغيرات ذات الصلة في ملف `.env`:

```
MYSQL_ROOT_PASSWORD=your_new_root_password
MYSQL_DATABASE=your_database_name
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
```

## استكشاف الأخطاء وإصلاحها

### التحقق من حالة الحاويات

```bash
docker-compose ps
```

### عرض سجلات الخدمات

```bash
docker-compose logs -f <service-name>
```

### إعادة بناء خدمة محددة

إذا قمت بتغيير الكود المصدري لخدمة ما، يمكنك إعادة بناء تلك الخدمة فقط:

```bash
docker-compose build <service-name>
docker-compose up -d <service-name>
```

### الدخول إلى حاوية

للدخول إلى حاوية قيد التشغيل (على سبيل المثال، للتحقق من الملفات أو تنفيذ أوامر):

```bash
docker-compose exec <service-name> sh
```

### مشاكل الاتصال بين الخدمات

إذا واجهت مشاكل في الاتصال بين الخدمات، تأكد من أن الخدمات تستخدم أسماء الخدمات كعناوين بدلاً من `localhost`. على سبيل المثال، استخدم `mysql` بدلاً من `localhost` للاتصال بقاعدة البيانات من داخل حاوية.

## أفضل الممارسات

1. **الأمان**: لا تقم أبدًا بتخزين كلمات المرور أو المفاتيح السرية في ملفات Docker أو الكود المصدري. استخدم ملفات `.env` أو أسرار Docker.

2. **الأداء**: قم بتحسين صور Docker عن طريق استخدام `.dockerignore` لاستبعاد الملفات غير الضرورية وتقليل حجم الصورة.

3. **التطوير المحلي**: يمكنك تعيين أحجام لتخزين الكود المصدري للتطوير المحلي، مما يتيح لك تعديل الكود دون إعادة بناء الصور.

4. **المراقبة**: فكر في إضافة خدمات مراقبة مثل Prometheus و Grafana لتتبع أداء التطبيق.

## الخطوات التالية

- **تكامل CI/CD**: إعداد خط أنابيب CI/CD لبناء ونشر صور Docker تلقائيًا.
- **Kubernetes**: الترقية إلى Kubernetes لإدارة النشر على نطاق أوسع وتحسين التوافر.
- **تحسين الأمان**: تنفيذ فحص الأمان للصور وإدارة الأسرار بشكل أفضل.

## الموارد

- [وثائق Docker الرسمية](https://docs.docker.com/)
- [وثائق Docker Compose](https://docs.docker.com/compose/)
- [أفضل ممارسات Docker](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)