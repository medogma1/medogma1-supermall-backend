// vendor-service/tests/test-create-vendor-supertest.js
const request = require('supertest');
const { expect } = require('chai');
const { describe, it, before, after } = require('mocha');
const app = require('../index'); // استيراد تطبيق Express
const { Vendor } = require('../models/Vendor');

// بيانات اختبار صالحة
const validVendorData = {
  name: 'متجر اختبار',
  email: 'test-vendor-supertest@example.com',
  phone: '01012345678',
  storeName: 'متجر اختبار الرسمي',
  storeDescription: 'وصف متجر الاختبار',
  storeLogoUrl: 'https://example.com/logo.png',
  contactEmail: 'contact@example.com',
  contactPhone: '01112345678',
  storeAddress: 'عنوان متجر الاختبار',
  country: 'مصر',
  governorate: 'القاهرة',
  nationalId: '29912345678901',
  user_id: 888, // استخدم معرف مستخدم غير موجود للاختبار
  business_type: 'retail'
};

// اختبار إنشاء بائع جديد باستخدام supertest
describe('اختبار API إنشاء بائع جديد (Supertest)', () => {
  let createdVendorId;

  // تنظيف البيانات بعد الاختبارات
  after(async () => {
    try {
      // حذف البائع الذي تم إنشاؤه خلال الاختبار إذا كان موجودًا
      if (createdVendorId) {
        await Vendor.delete(createdVendorId);
        console.log(`تم حذف البائع بمعرف ${createdVendorId}`);
      }
    } catch (error) {
      console.error('خطأ أثناء تنظيف البيانات:', error);
    }
  });

  // اختبار إنشاء بائع بنجاح
  it('يجب أن ينشئ بائعًا جديدًا مع البيانات الصحيحة', async () => {
    const response = await request(app)
      .post('/api/vendors')
      .send(validVendorData)
      .expect('Content-Type', /json/)
      .expect(201);

    // التحقق من الاستجابة
    expect(response.body).to.have.property('message');
    expect(response.body.message).to.equal('Vendor created successfully');
    expect(response.body).to.have.property('vendor');
    expect(response.body.vendor).to.have.property('id');
    
    // حفظ معرف البائع للاستخدام في الاختبارات اللاحقة والتنظيف
    createdVendorId = response.body.vendor.id;
    
    // التحقق من بيانات البائع
    expect(response.body.vendor.name).to.equal(validVendorData.name);
    expect(response.body.vendor.email).to.equal(validVendorData.email);
    expect(response.body.vendor.phone).to.equal(validVendorData.phone);
  });

  // اختبار الحقول المطلوبة
  it('يجب أن يفشل عند عدم توفير الحقول المطلوبة', async () => {
    const invalidData = {
      name: 'متجر اختبار',
      // email مفقود
      phone: '01012345678',
      // user_id مفقود
      // business_type مفقود
    };

    const response = await request(app)
      .post('/api/vendors')
      .send(invalidData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).to.have.property('message');
    expect(response.body.message).to.equal('All fields are required');
    expect(response.body).to.have.property('details');
  });

  // اختبار البريد الإلكتروني المكرر
  it('يجب أن يفشل عند استخدام بريد إلكتروني موجود بالفعل', async () => {
    // استخدام نفس البيانات الصالحة ولكن مع تغيير user_id
    const duplicateEmailData = {
      ...validVendorData,
      user_id: 889 // معرف مستخدم مختلف
    };

    // أولاً، تأكد من أن البائع الأول تم إنشاؤه بنجاح
    if (!createdVendorId) {
      throw new Error('لم يتم إنشاء البائع الأول بنجاح');
    }

    const response = await request(app)
      .post('/api/vendors')
      .send(duplicateEmailData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).to.have.property('message');
    expect(response.body.message).to.equal('Email already exists');
  });

  // اختبار معرف المستخدم غير الصالح
  it('يجب أن يفشل عند استخدام معرف مستخدم غير صالح', async () => {
    const invalidUserIdData = {
      ...validVendorData,
      email: 'different-email@example.com', // بريد إلكتروني مختلف
      user_id: 'abc' // معرف مستخدم غير صالح (ليس رقمًا)
    };

    const response = await request(app)
      .post('/api/vendors')
      .send(invalidUserIdData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).to.have.property('message');
    expect(response.body.message).to.equal('user_id must be a valid number');
  });

  // اختبار معرف المستخدم المكرر
  it('يجب أن يفشل عند استخدام معرف مستخدم موجود بالفعل', async () => {
    // استخدام نفس البيانات الصالحة ولكن مع تغيير البريد الإلكتروني
    const duplicateUserIdData = {
      ...validVendorData,
      email: 'another-email@example.com' // بريد إلكتروني مختلف
      // نفس user_id من البيانات الصالحة
    };

    // أولاً، تأكد من أن البائع الأول تم إنشاؤه بنجاح
    if (!createdVendorId) {
      throw new Error('لم يتم إنشاء البائع الأول بنجاح');
    }

    const response = await request(app)
      .post('/api/vendors')
      .send(duplicateUserIdData)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).to.have.property('message');
    expect(response.body.message).to.equal('User already has a vendor account');
  });

  // اختبار التحقق من صحة البيانات
  it('يجب أن يفشل عند استخدام بيانات غير صالحة', async () => {
    const invalidDataFormat = {
      ...validVendorData,
      email: 'invalid-email', // بريد إلكتروني بتنسيق غير صالح
      phone: '123', // رقم هاتف قصير جدًا
      user_id: 890 // معرف مستخدم مختلف
    };

    const response = await request(app)
      .post('/api/vendors')
      .send(invalidDataFormat)
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).to.have.property('message');
    // قد تختلف رسالة الخطأ بناءً على التحقق المنفذ في النموذج
    expect(response.body.message).to.be.oneOf(['Validation error', 'Invalid vendor data']);
  });
});