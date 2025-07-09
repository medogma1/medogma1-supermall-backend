// vendor-service/tests/models.test.js
const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const mysql = require('mysql2/promise');

// استيراد النماذج
const Vendor = require('../models/Vendor');
const VendorSettings = require('../models/VendorSettings');
const Service = require('../models/Service');

// استيراد تجمع قاعدة البيانات
const pool = require('../config/database');

describe('نماذج قاعدة البيانات', () => {
  let sandbox;
  let poolStub;

  before(() => {
    // إنشاء sandbox للـ stubs
    sandbox = sinon.createSandbox();

    // إنشاء stub لتجمع قاعدة البيانات
    poolStub = {
      execute: sandbox.stub(),
      query: sandbox.stub(),
      getConnection: sandbox.stub()
    };

    // استبدال تجمع قاعدة البيانات الحقيقي بـ stub
    sandbox.stub(pool, 'execute').callsFake(poolStub.execute);
    sandbox.stub(pool, 'query').callsFake(poolStub.query);
    sandbox.stub(pool, 'getConnection').callsFake(poolStub.getConnection);
  });

  after(() => {
    // استعادة الدوال الأصلية
    sandbox.restore();
  });

  describe('نموذج البائع (Vendor)', () => {
    it('يجب أن ينشئ بائعًا جديدًا', async () => {
      // تهيئة البيانات
      const vendorData = {
        name: 'متجر اختبار',
        email: 'test@example.com',
        phone: '+9661234567890',
        businessType: 'شركة',
        taxId: 'TX12345',
        registrationNumber: 'RG67890',
        isVerified: true,
        isActive: true
      };

      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ insertId: 1 }]);

      // استدعاء الدالة
      const result = await Vendor.create(vendorData);

      // التحقق من النتائج
      expect(result).to.equal(1);
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('INSERT INTO `vendors`');
      expect(params).to.include(vendorData.email);
    });

    it('يجب أن يجد بائعًا بواسطة المعرف', async () => {
      // تهيئة استجابة قاعدة البيانات
      const vendorData = {
        id: 1,
        name: 'متجر اختبار',
        email: 'test@example.com',
        is_active: 1
      };
      poolStub.execute.resolves([[vendorData]]);

      // استدعاء الدالة
      const vendor = await Vendor.findById(1);

      // التحقق من النتائج
      expect(vendor).to.be.an('object');
      expect(vendor.id).to.equal(1);
      expect(vendor.name).to.equal('متجر اختبار');
      expect(vendor.isActive).to.be.true; // تحويل من is_active إلى isActive
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('SELECT * FROM `vendors`');
      expect(query).to.include('WHERE `id` = ?');
      expect(params[0]).to.equal(1);
    });

    it('يجب أن يجد بائعًا بواسطة البريد الإلكتروني', async () => {
      // تهيئة استجابة قاعدة البيانات
      const vendorData = {
        id: 1,
        name: 'متجر اختبار',
        email: 'test@example.com',
        is_active: 1
      };
      poolStub.execute.resolves([[vendorData]]);

      // استدعاء الدالة
      const vendor = await Vendor.findByEmail('test@example.com');

      // التحقق من النتائج
      expect(vendor).to.be.an('object');
      expect(vendor.id).to.equal(1);
      expect(vendor.email).to.equal('test@example.com');
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('SELECT * FROM `vendors`');
      expect(query).to.include('WHERE `email` = ?');
      expect(params[0]).to.equal('test@example.com');
    });

    it('يجب أن يحدث بائعًا', async () => {
      // تهيئة البيانات
      const vendorData = {
        name: 'متجر اختبار محدث',
        phone: '+9661234567891'
      };

      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await Vendor.update(1, vendorData);

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('UPDATE `vendors` SET');
      expect(query).to.include('WHERE `id` = ?');
      expect(params).to.include('متجر اختبار محدث');
      expect(params).to.include('+9661234567891');
    });

    it('يجب أن يحذف بائعًا', async () => {
      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await Vendor.delete(1);

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('DELETE FROM `vendors`');
      expect(query).to.include('WHERE `id` = ?');
      expect(params[0]).to.equal(1);
    });
  });

  describe('نموذج إعدادات البائع (VendorSettings)', () => {
    it('يجب أن ينشئ إعدادات متجر جديدة', async () => {
      // تهيئة البيانات
      const settingsData = {
        vendorId: 1,
        storeName: 'متجر اختبار',
        description: 'وصف متجر الاختبار',
        logoUrl: '/uploads/logos/test-logo.png',
        contactEmail: 'contact@test.com',
        contactPhone: '+9661234567890',
        address: { street: 'شارع الاختبار', city: 'مدينة الاختبار' }
      };

      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ insertId: 1 }]);

      // استدعاء الدالة
      const result = await VendorSettings.create(settingsData);

      // التحقق من النتائج
      expect(result).to.equal(1);
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('INSERT INTO `vendor_settings`');
      expect(params).to.include(1); // vendorId
      expect(params).to.include('متجر اختبار'); // storeName
    });

    it('يجب أن يجد إعدادات متجر بواسطة معرف البائع', async () => {
      // تهيئة استجابة قاعدة البيانات
      const settingsData = {
        id: 1,
        vendor_id: 1,
        store_name: 'متجر اختبار',
        description: 'وصف متجر الاختبار',
        is_completed: 1
      };
      poolStub.execute.resolves([[settingsData]]);

      // استدعاء الدالة
      const settings = await VendorSettings.findByVendorId(1);

      // التحقق من النتائج
      expect(settings).to.be.an('object');
      expect(settings.id).to.equal(1);
      expect(settings.vendorId).to.equal(1); // تحويل من vendor_id إلى vendorId
      expect(settings.storeName).to.equal('متجر اختبار'); // تحويل من store_name إلى storeName
      expect(settings.isCompleted).to.be.true; // تحويل من is_completed إلى isCompleted
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('SELECT * FROM `vendor_settings`');
      expect(query).to.include('WHERE `vendor_id` = ?');
      expect(params[0]).to.equal(1);
    });

    it('يجب أن يحدث إعدادات متجر', async () => {
      // تهيئة البيانات
      const settingsData = {
        storeName: 'متجر اختبار محدث',
        description: 'وصف متجر الاختبار المحدث'
      };

      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await VendorSettings.update(1, settingsData);

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('UPDATE `vendor_settings` SET');
      expect(query).to.include('WHERE `vendor_id` = ?');
      expect(params).to.include('متجر اختبار محدث');
      expect(params).to.include('وصف متجر الاختبار المحدث');
    });
  });

  describe('نموذج الخدمة (Service)', () => {
    it('يجب أن ينشئ خدمة جديدة', async () => {
      // تهيئة البيانات
      const serviceData = {
        name: 'خدمة اختبار',
        description: 'وصف خدمة الاختبار',
        price: 100.00,
        currency: 'SAR',
        type: 1,
        status: 1,
        vendorId: 1,
        imageUrls: ['uploads/services/test-1.jpg'],
        tags: ['اختبار', 'تجربة'],
        category: 'فئة الاختبار',
        availability: { days: [1, 2, 3, 4, 5], hours: { start: '09:00', end: '17:00' } }
      };

      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ insertId: 1 }]);

      // استدعاء الدالة
      const result = await Service.create(serviceData);

      // التحقق من النتائج
      expect(result).to.equal(1);
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('INSERT INTO `services`');
      expect(params).to.include('خدمة اختبار');
      expect(params).to.include(100.00);
    });

    it('يجب أن يجد خدمة بواسطة المعرف', async () => {
      // تهيئة استجابة قاعدة البيانات
      const serviceData = {
        id: 1,
        name: 'خدمة اختبار',
        description: 'وصف خدمة الاختبار',
        price: 100.00,
        vendor_id: 1,
        status: 1
      };
      poolStub.execute.resolves([[serviceData]]);

      // استدعاء الدالة
      const service = await Service.findById(1);

      // التحقق من النتائج
      expect(service).to.be.an('object');
      expect(service.id).to.equal(1);
      expect(service.name).to.equal('خدمة اختبار');
      expect(service.vendorId).to.equal(1); // تحويل من vendor_id إلى vendorId
      expect(service.status).to.equal(1);
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('SELECT * FROM `services`');
      expect(query).to.include('WHERE `id` = ?');
      expect(params[0]).to.equal(1);
    });

    it('يجب أن يجد خدمات بائع محدد', async () => {
      // تهيئة استجابة قاعدة البيانات
      const servicesData = [
        {
          id: 1,
          name: 'خدمة اختبار 1',
          vendor_id: 1,
          status: 1
        },
        {
          id: 2,
          name: 'خدمة اختبار 2',
          vendor_id: 1,
          status: 1
        }
      ];
      poolStub.execute.resolves([servicesData]);

      // استدعاء الدالة
      const services = await Service.findByVendorId(1);

      // التحقق من النتائج
      expect(services).to.be.an('array');
      expect(services.length).to.equal(2);
      expect(services[0].id).to.equal(1);
      expect(services[0].name).to.equal('خدمة اختبار 1');
      expect(services[0].vendorId).to.equal(1); // تحويل من vendor_id إلى vendorId
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('SELECT * FROM `services`');
      expect(query).to.include('WHERE `vendor_id` = ?');
      expect(params[0]).to.equal(1);
    });

    it('يجب أن يحدث خدمة', async () => {
      // تهيئة البيانات
      const serviceData = {
        name: 'خدمة اختبار محدثة',
        price: 150.00
      };

      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await Service.update(1, serviceData);

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('UPDATE `services` SET');
      expect(query).to.include('WHERE `id` = ?');
      expect(params).to.include('خدمة اختبار محدثة');
      expect(params).to.include(150.00);
    });

    it('يجب أن يحذف خدمة', async () => {
      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await Service.delete(1);

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('DELETE FROM `services`');
      expect(query).to.include('WHERE `id` = ?');
      expect(params[0]).to.equal(1);
    });

    it('يجب أن يحدث حالة خدمة', async () => {
      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await Service.updateStatus(1, 2); // تغيير الحالة إلى 2 (غير نشط)

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('UPDATE `services` SET `status` = ?');
      expect(query).to.include('WHERE `id` = ?');
      expect(params[0]).to.equal(2);
      expect(params[1]).to.equal(1);
    });

    it('يجب أن يحدث تقييم خدمة', async () => {
      // تهيئة استجابة قاعدة البيانات
      poolStub.execute.resolves([{ affectedRows: 1 }]);

      // استدعاء الدالة
      const result = await Service.updateRating(1, 4.5);

      // التحقق من النتائج
      expect(result).to.be.true;
      expect(poolStub.execute.calledOnce).to.be.true;
      const [query, params] = poolStub.execute.firstCall.args;
      expect(query).to.include('UPDATE `services` SET `rating` = ?');
      expect(query).to.include('WHERE `id` = ?');
      expect(params[0]).to.equal(4.5);
      expect(params[1]).to.equal(1);
    });
  });
});