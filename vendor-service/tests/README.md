# اختبارات خدمة البائعين (Vendor Service Tests)

هذا المستند يشرح اختبارات خدمة البائعين في نظام SuperMall وكيفية تشغيلها.

## أنواع الاختبارات

تحتوي خدمة البائعين على ثلاثة أنواع من الاختبارات:

1. **اختبارات الوحدة (Unit Tests)**: تختبر وحدات التحكم والنماذج بشكل منفصل باستخدام stubs و mocks.
2. **اختبارات التكامل (Integration Tests)**: تختبر تكامل المكونات المختلفة معًا.
3. **اختبارات API**: تختبر واجهات API الخارجية للخدمة.

## ملفات الاختبار

- `controllers.test.js`: اختبارات وحدة لوحدات التحكم (controllers).
- `models.test.js`: اختبارات وحدة للنماذج (models).
- `test-create-vendor.js`: اختبارات API لإنشاء بائع جديد باستخدام axios.
- `test-create-vendor-supertest.js`: اختبارات API لإنشاء بائع جديد باستخدام supertest.

## كيفية تشغيل الاختبارات

### تثبيت التبعيات

قبل تشغيل الاختبارات، تأكد من تثبيت جميع التبعيات المطلوبة:

```bash
npm install
```

### تشغيل جميع الاختبارات

لتشغيل جميع الاختبارات، استخدم الأمر التالي:

```bash
npm test
```

### تشغيل اختبارات محددة

لتشغيل ملف اختبار محدد، استخدم الأمر التالي:

```bash
npm test -- tests/controllers.test.js
```

أو باستخدام mocha مباشرة:

```bash
./node_modules/.bin/mocha tests/controllers.test.js
```

### تشغيل اختبارات API

لتشغيل اختبارات API، يجب أولاً تشغيل خادم API:

```bash
npm start
```

ثم في نافذة طرفية أخرى، قم بتشغيل اختبارات API:

```bash
node tests/test-create-vendor.js
```

أو باستخدام mocha:

```bash
./node_modules/.bin/mocha tests/test-create-vendor.js
```

## اختبارات إنشاء بائع جديد

### اختبارات الوحدة (Unit Tests)

تم إضافة اختبارات وحدة لوظيفة `createVendor` في ملف `controllers.test.js`. تغطي هذه الاختبارات الحالات التالية:

1. إنشاء بائع جديد بنجاح مع بيانات صالحة.
2. فشل الإنشاء عند استخدام بريد إلكتروني موجود بالفعل.
3. فشل الإنشاء عند استخدام معرف مستخدم موجود بالفعل.
4. فشل الإنشاء عند استخدام معرف مستخدم غير صالح (ليس رقمًا).
5. فشل الإنشاء عند استخدام بيانات غير صالحة.
6. فشل الإنشاء عند عدم توفير الحقول المطلوبة.
7. فشل الإنشاء عند حدوث استثناء أثناء عملية الإنشاء.

### اختبارات API

تم إنشاء ملفين لاختبارات API لوظيفة إنشاء بائع جديد:

1. `test-create-vendor.js`: يستخدم axios لاختبار API عبر HTTP.
2. `test-create-vendor-supertest.js`: يستخدم supertest لاختبار API مباشرة بدون الحاجة لتشغيل الخادم.

تغطي هذه الاختبارات الحالات التالية:

1. إنشاء بائع جديد بنجاح مع بيانات صالحة.
2. فشل الإنشاء عند عدم توفير الحقول المطلوبة.
3. فشل الإنشاء عند استخدام بريد إلكتروني موجود بالفعل.
4. فشل الإنشاء عند استخدام معرف مستخدم غير صالح.
5. فشل الإنشاء عند استخدام معرف مستخدم موجود بالفعل.
6. فشل الإنشاء عند استخدام بيانات بتنسيق غير صالح.

## إضافة اختبارات جديدة

لإضافة اختبارات جديدة، اتبع الخطوات التالية:

1. قم بإنشاء ملف اختبار جديد في مجلد `tests`.
2. استورد المكتبات اللازمة مثل mocha و chai.
3. استورد الوحدات التي تريد اختبارها.
4. اكتب اختباراتك باستخدام describe و it.
5. قم بتشغيل الاختبارات للتأكد من أنها تعمل بشكل صحيح.

## مثال على اختبار وحدة

```javascript
const { expect } = require('chai');
const sinon = require('sinon');
const vendorController = require('../controllers/vendorController');
const Vendor = require('../models/Vendor');

describe('vendorController', () => {
  let sandbox;
  let req, res, next;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = { body: {}, params: {} };
    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis()
    };
    next = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createVendor', () => {
    it('should create a new vendor with valid data', async () => {
      // تهيئة البيانات والـ stubs
      // ...

      // استدعاء الدالة
      await vendorController.createVendor(req, res, next);

      // التحقق من النتائج
      // ...
    });
  });
});
```

## مثال على اختبار API

```javascript
const request = require('supertest');
const { expect } = require('chai');
const app = require('../index');

describe('Vendor API', () => {
  it('should create a new vendor with valid data', async () => {
    const response = await request(app)
      .post('/api/vendors')
      .send(validVendorData)
      .expect(201);

    expect(response.body).to.have.property('message');
    expect(response.body.message).to.equal('Vendor created successfully');
  });
});
```