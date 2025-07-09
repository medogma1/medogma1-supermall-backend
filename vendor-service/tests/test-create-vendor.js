// vendor-service/tests/test-create-vendor.js
const axios = require('axios');
const { expect } = require('chai');
const { describe, it, before, after } = require('mocha');

// تكوين الاختبار
const API_URL = process.env.API_URL || 'http://localhost:3004';
const VENDOR_API = `${API_URL}/api/vendors`;

// بيانات اختبار صالحة
const validVendorData = {
  name: 'متجر اختبار',
  email: 'test-vendor@example.com',
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
  user_id: 999, // استخدم معرف مستخدم غير موجود للاختبار
  business_type: 'retail'
};

// اختبار إنشاء بائع جديد
describe('اختبار API إنشاء بائع جديد', () => {
  let createdVendorId;

  // تنظيف البيانات بعد الاختبارات
  after(async () => {
    // يمكن إضافة كود لحذف البائع الذي تم إنشاؤه خلال الاختبار
    // إذا كان هناك API لحذف البائعين
  });

  // اختبار إنشاء بائع بنجاح
  it('يجب أن ينشئ بائعًا جديدًا مع البيانات الصحيحة', async () => {
    try {
      const response = await axios.post(VENDOR_API, validVendorData);
      
      // التحقق من الاستجابة
      expect(response.status).to.equal(201);
      expect(response.data).to.have.property('message');
      expect(response.data.message).to.equal('Vendor created successfully');
      expect(response.data).to.have.property('vendor');
      expect(response.data.vendor).to.have.property('id');
      
      // حفظ معرف البائع للاستخدام في الاختبارات اللاحقة
      createdVendorId = response.data.vendor.id;
      
      // التحقق من بيانات البائع
      expect(response.data.vendor.name).to.equal(validVendorData.name);
      expect(response.data.vendor.email).to.equal(validVendorData.email);
      expect(response.data.vendor.phone).to.equal(validVendorData.phone);
      
    } catch (error) {
      console.error('خطأ في اختبار إنشاء بائع جديد:', error.response ? error.response.data : error.message);
      throw error;
    }
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

    try {
      await axios.post(VENDOR_API, invalidData);
      // يجب ألا يصل إلى هنا
      throw new Error('يجب أن يفشل الطلب بسبب نقص البيانات المطلوبة');
    } catch (error) {
      if (!error.response) throw error;
      
      expect(error.response.status).to.equal(400);
      expect(error.response.data).to.have.property('message');
      expect(error.response.data.message).to.equal('All fields are required');
      expect(error.response.data).to.have.property('details');
    }
  });

  // اختبار البريد الإلكتروني المكرر
  it('يجب أن يفشل عند استخدام بريد إلكتروني موجود بالفعل', async () => {
    // استخدام نفس البيانات الصالحة ولكن مع تغيير user_id
    const duplicateEmailData = {
      ...validVendorData,
      user_id: 998 // معرف مستخدم مختلف
    };

    try {
      // أولاً، تأكد من أن البائع الأول تم إنشاؤه بنجاح
      if (!createdVendorId) {
        throw new Error('لم يتم إنشاء البائع الأول بنجاح');
      }

      await axios.post(VENDOR_API, duplicateEmailData);
      // يجب ألا يصل إلى هنا
      throw new Error('يجب أن يفشل الطلب بسبب تكرار البريد الإلكتروني');
    } catch (error) {
      if (!error.response) throw error;
      
      expect(error.response.status).to.equal(400);
      expect(error.response.data).to.have.property('message');
      expect(error.response.data.message).to.equal('Email already exists');
    }
  });

  // اختبار معرف المستخدم غير الصالح
  it('يجب أن يفشل عند استخدام معرف مستخدم غير صالح', async () => {
    const invalidUserIdData = {
      ...validVendorData,
      email: 'different-email@example.com', // بريد إلكتروني مختلف
      user_id: 'abc' // معرف مستخدم غير صالح (ليس رقمًا)
    };

    try {
      await axios.post(VENDOR_API, invalidUserIdData);
      // يجب ألا يصل إلى هنا
      throw new Error('يجب أن يفشل الطلب بسبب معرف المستخدم غير الصالح');
    } catch (error) {
      if (!error.response) throw error;
      
      expect(error.response.status).to.equal(400);
      expect(error.response.data).to.have.property('message');
      expect(error.response.data.message).to.equal('user_id must be a valid number');
    }
  });

  // اختبار معرف المستخدم المكرر
  it('يجب أن يفشل عند استخدام معرف مستخدم موجود بالفعل', async () => {
    // استخدام نفس البيانات الصالحة ولكن مع تغيير البريد الإلكتروني
    const duplicateUserIdData = {
      ...validVendorData,
      email: 'another-email@example.com' // بريد إلكتروني مختلف
      // نفس user_id من البيانات الصالحة
    };

    try {
      // أولاً، تأكد من أن البائع الأول تم إنشاؤه بنجاح
      if (!createdVendorId) {
        throw new Error('لم يتم إنشاء البائع الأول بنجاح');
      }

      await axios.post(VENDOR_API, duplicateUserIdData);
      // يجب ألا يصل إلى هنا
      throw new Error('يجب أن يفشل الطلب بسبب تكرار معرف المستخدم');
    } catch (error) {
      if (!error.response) throw error;
      
      expect(error.response.status).to.equal(400);
      expect(error.response.data).to.have.property('message');
      expect(error.response.data.message).to.equal('User already has a vendor account');
    }
  });
});

// تشغيل الاختبارات
if (require.main === module) {
  describe('تشغيل اختبارات إنشاء البائع', () => {
    it('يجب أن يكون خادم API قيد التشغيل', () => {
      console.log(`التأكد من أن خادم API يعمل على ${API_URL}`);
      // هذا مجرد اختبار للتأكد من أن المستخدم قد قام بتشغيل الخادم
    });
  });
}