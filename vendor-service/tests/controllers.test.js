// vendor-service/tests/controllers.test.js
const { describe, it, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');

// استيراد وحدات التحكم
const vendorController = require('../controllers/vendorController');
const serviceController = require('../controllers/serviceController');

// استيراد النماذج
const Vendor = require('../models/Vendor');
const VendorSettings = require('../models/VendorSettings');
const Service = require('../models/Service');

describe('اختبارات وحدات التحكم', () => {
  let sandbox;
  let req, res, next;

  beforeEach(() => {
    // إنشاء sandbox للـ stubs
    sandbox = sinon.createSandbox();

    // تهيئة كائنات الطلب والاستجابة والتالي
    req = {
      params: {},
      body: {},
      query: {}
    };

    res = {
      status: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
      send: sandbox.stub().returnsThis()
    };

    next = sandbox.stub();
  });

  afterEach(() => {
    // استعادة الدوال الأصلية
    sandbox.restore();
  });

  describe('وحدة تحكم البائع (vendorController)', () => {
    describe('createVendor', () => {
      it('يجب أن ينشئ بائعًا جديدًا ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          email: 'test@example.com',
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
          user_id: 123,
          business_type: 'retail'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findByEmail').resolves(null);
        sandbox.stub(Vendor, 'findByUserId').resolves(null);
        sandbox.stub(Vendor, 'validateVendorData').returns(true);
        sandbox.stub(Vendor, 'create').resolves({
          id: 1,
          name: 'متجر اختبار',
          email: 'test@example.com'
        });

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findByEmail.calledOnce).to.be.true;
        expect(Vendor.findByUserId.calledOnce).to.be.true;
        expect(Vendor.validateVendorData.calledOnce).to.be.true;
        expect(Vendor.create.calledOnce).to.be.true;
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('Vendor created successfully');
        expect(responseData).to.have.property('vendor');
        expect(responseData.vendor.id).to.equal(1);
      });

      it('يجب أن يعيد خطأ إذا كان البريد الإلكتروني موجودًا بالفعل', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          email: 'existing@example.com',
          phone: '01012345678',
          user_id: 123,
          business_type: 'retail'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findByEmail').resolves({
          id: 2,
          email: 'existing@example.com'
        });

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findByEmail.calledOnce).to.be.true;
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('Email already exists');
      });

      it('يجب أن يعيد خطأ إذا كان المستخدم لديه حساب بائع بالفعل', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          email: 'test@example.com',
          phone: '01012345678',
          user_id: 123,
          business_type: 'retail'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findByEmail').resolves(null);
        sandbox.stub(Vendor, 'findByUserId').resolves({
          id: 2,
          user_id: 123
        });

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findByEmail.calledOnce).to.be.true;
        expect(Vendor.findByUserId.calledOnce).to.be.true;
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('User already has a vendor account');
      });

      it('يجب أن يعيد خطأ إذا كان user_id ليس رقمًا صحيحًا', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          email: 'test@example.com',
          phone: '01012345678',
          user_id: 'abc',
          business_type: 'retail'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findByEmail').resolves(null);
        sandbox.stub(Vendor, 'findByUserId').resolves(null);

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findByEmail.calledOnce).to.be.true;
        expect(Vendor.findByUserId.calledOnce).to.be.true;
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('user_id must be a valid number');
      });

      it('يجب أن يعيد خطأ إذا كانت البيانات غير صالحة', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          email: 'test@example.com',
          phone: '01012345678',
          user_id: 123,
          business_type: 'retail'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findByEmail').resolves(null);
        sandbox.stub(Vendor, 'findByUserId').resolves(null);
        sandbox.stub(Vendor, 'validateVendorData').returns(false);
        sandbox.stub(Vendor, 'getValidationErrors').returns(['خطأ في التحقق من صحة البيانات']);

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findByEmail.calledOnce).to.be.true;
        expect(Vendor.findByUserId.calledOnce).to.be.true;
        expect(Vendor.validateVendorData.calledOnce).to.be.true;
        expect(Vendor.getValidationErrors.calledOnce).to.be.true;
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('Validation error');
        expect(responseData).to.have.property('error');
        expect(responseData).to.have.property('details');
      });

      it('يجب أن يعيد خطأ إذا كانت الحقول المطلوبة مفقودة', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          // email مفقود
          phone: '01012345678',
          // user_id مفقود
          // business_type مفقود
        };

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(res.status.calledWith(400)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('All fields are required');
        expect(responseData).to.have.property('details');
        expect(responseData.details).to.include('name, email, phone, user_id, and business_type are required');
      });

      it('يجب أن يعيد خطأ عند حدوث استثناء أثناء إنشاء البائع', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'متجر اختبار',
          email: 'test@example.com',
          phone: '01012345678',
          user_id: 123,
          business_type: 'retail'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findByEmail').resolves(null);
        sandbox.stub(Vendor, 'findByUserId').resolves(null);
        sandbox.stub(Vendor, 'validateVendorData').returns(true);
        sandbox.stub(Vendor, 'create').rejects(new Error('خطأ في قاعدة البيانات'));

        // استدعاء الدالة
        await vendorController.createVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findByEmail.calledOnce).to.be.true;
        expect(Vendor.findByUserId.calledOnce).to.be.true;
        expect(Vendor.validateVendorData.calledOnce).to.be.true;
        expect(Vendor.create.calledOnce).to.be.true;
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.equal('Error creating vendor');
        expect(responseData).to.have.property('error');
      });
    });

    describe('getVendorById', () => {
      it('يجب أن يجد بائعًا بواسطة المعرف ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.params.id = '1';

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves({
          id: 1,
          name: 'متجر اختبار',
          email: 'test@example.com'
        });

        // استدعاء الدالة
        await vendorController.getVendorById(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(Vendor.findById.calledWith(1)).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('vendor');
        expect(responseData.vendor.id).to.equal(1);
      });

      it('يجب أن يعيد خطأ إذا لم يتم العثور على البائع', async () => {
        // تهيئة البيانات
        req.params.id = '999';

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves(null);

        // استدعاء الدالة
        await vendorController.getVendorById(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(Vendor.findById.calledWith(999)).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('error');
        expect(responseData.error).to.include('لم يتم العثور على البائع');
      });
    });

    describe('updateVendor', () => {
      it('يجب أن يحدث بائعًا ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.params.id = '1';
        req.body = {
          name: 'متجر اختبار محدث',
          phone: '+9661234567891'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves({
          id: 1,
          name: 'متجر اختبار',
          email: 'test@example.com'
        });
        sandbox.stub(Vendor, 'update').resolves(true);

        // استدعاء الدالة
        await vendorController.updateVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(Vendor.update.calledOnce).to.be.true;
        expect(Vendor.update.calledWith(1, req.body)).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.include('تم تحديث البائع بنجاح');
      });

      it('يجب أن يعيد خطأ إذا لم يتم العثور على البائع', async () => {
        // تهيئة البيانات
        req.params.id = '999';
        req.body = {
          name: 'متجر اختبار محدث'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves(null);

        // استدعاء الدالة
        await vendorController.updateVendor(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('error');
        expect(responseData.error).to.include('لم يتم العثور على البائع');
      });
    });

    describe('updateStoreSettings', () => {
      it('يجب أن يحدث إعدادات المتجر ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.params.id = '1';
        req.body = {
          storeName: 'متجر اختبار محدث',
          description: 'وصف متجر الاختبار المحدث'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves({
          id: 1,
          name: 'متجر اختبار'
        });
        sandbox.stub(VendorSettings, 'findByVendorId').resolves({
          id: 1,
          vendorId: 1,
          storeName: 'متجر اختبار'
        });
        sandbox.stub(VendorSettings, 'update').resolves(true);
        sandbox.stub(Vendor, 'update').resolves(true);

        // استدعاء الدالة
        await vendorController.updateStoreSettings(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(VendorSettings.findByVendorId.calledOnce).to.be.true;
        expect(VendorSettings.update.calledOnce).to.be.true;
        expect(Vendor.update.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.include('تم تحديث إعدادات المتجر بنجاح');
      });

      it('يجب أن ينشئ إعدادات متجر جديدة إذا لم تكن موجودة', async () => {
        // تهيئة البيانات
        req.params.id = '1';
        req.body = {
          storeName: 'متجر اختبار جديد',
          description: 'وصف متجر الاختبار الجديد'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves({
          id: 1,
          name: 'متجر اختبار'
        });
        sandbox.stub(VendorSettings, 'findByVendorId').resolves(null);
        sandbox.stub(VendorSettings, 'create').resolves(1);
        sandbox.stub(Vendor, 'update').resolves(true);

        // استدعاء الدالة
        await vendorController.updateStoreSettings(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(VendorSettings.findByVendorId.calledOnce).to.be.true;
        expect(VendorSettings.create.calledOnce).to.be.true;
        expect(Vendor.update.calledOnce).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.include('تم تحديث إعدادات المتجر بنجاح');
      });
    });
  });

  describe('وحدة تحكم الخدمة (serviceController)', () => {
    describe('createService', () => {
      it('يجب أن ينشئ خدمة جديدة ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'خدمة اختبار',
          description: 'وصف خدمة الاختبار',
          price: 100.00,
          currency: 'SAR',
          type: 1,
          vendorId: 1
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves({
          id: 1,
          name: 'متجر اختبار'
        });
        sandbox.stub(Service, 'create').resolves(1);
        sandbox.stub(Service, 'findById').resolves({
          id: 1,
          name: 'خدمة اختبار',
          price: 100.00,
          vendorId: 1
        });

        // استدعاء الدالة
        await serviceController.createService(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(Service.create.calledOnce).to.be.true;
        expect(Service.findById.calledOnce).to.be.true;
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('service');
        expect(responseData.service.id).to.equal(1);
      });

      it('يجب أن يعيد خطأ إذا لم يتم العثور على البائع', async () => {
        // تهيئة البيانات
        req.body = {
          name: 'خدمة اختبار',
          vendorId: 999
        };

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves(null);

        // استدعاء الدالة
        await serviceController.createService(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('error');
        expect(responseData.error).to.include('لم يتم العثور على البائع');
      });
    });

    describe('getServiceById', () => {
      it('يجب أن يجد خدمة بواسطة المعرف ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.params.id = '1';

        // تهيئة stub للنموذج
        sandbox.stub(Service, 'findById').resolves({
          id: 1,
          name: 'خدمة اختبار',
          price: 100.00,
          vendorId: 1
        });

        // استدعاء الدالة
        await serviceController.getServiceById(req, res, next);

        // التحقق من النتائج
        expect(Service.findById.calledOnce).to.be.true;
        expect(Service.findById.calledWith(1)).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('service');
        expect(responseData.service.id).to.equal(1);
      });

      it('يجب أن يعيد خطأ إذا لم يتم العثور على الخدمة', async () => {
        // تهيئة البيانات
        req.params.id = '999';

        // تهيئة stub للنموذج
        sandbox.stub(Service, 'findById').resolves(null);

        // استدعاء الدالة
        await serviceController.getServiceById(req, res, next);

        // التحقق من النتائج
        expect(Service.findById.calledOnce).to.be.true;
        expect(Service.findById.calledWith(999)).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('error');
        expect(responseData.error).to.include('لم يتم العثور على الخدمة');
      });
    });

    describe('updateService', () => {
      it('يجب أن يحدث خدمة ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.params.id = '1';
        req.body = {
          name: 'خدمة اختبار محدثة',
          price: 150.00
        };

        // تهيئة stub للنموذج
        sandbox.stub(Service, 'findById').resolves({
          id: 1,
          name: 'خدمة اختبار',
          price: 100.00,
          vendorId: 1
        });
        sandbox.stub(Service, 'update').resolves(true);

        // استدعاء الدالة
        await serviceController.updateService(req, res, next);

        // التحقق من النتائج
        expect(Service.findById.calledOnce).to.be.true;
        expect(Service.update.calledOnce).to.be.true;
        expect(Service.update.calledWith(1, req.body)).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('message');
        expect(responseData.message).to.include('تم تحديث الخدمة بنجاح');
      });

      it('يجب أن يعيد خطأ إذا لم يتم العثور على الخدمة', async () => {
        // تهيئة البيانات
        req.params.id = '999';
        req.body = {
          name: 'خدمة اختبار محدثة'
        };

        // تهيئة stub للنموذج
        sandbox.stub(Service, 'findById').resolves(null);

        // استدعاء الدالة
        await serviceController.updateService(req, res, next);

        // التحقق من النتائج
        expect(Service.findById.calledOnce).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('error');
        expect(responseData.error).to.include('لم يتم العثور على الخدمة');
      });
    });

    describe('getVendorServices', () => {
      it('يجب أن يجد خدمات بائع محدد ويعيد استجابة ناجحة', async () => {
        // تهيئة البيانات
        req.params.vendorId = '1';

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves({
          id: 1,
          name: 'متجر اختبار'
        });
        sandbox.stub(Service, 'findByVendorId').resolves([
          {
            id: 1,
            name: 'خدمة اختبار 1',
            price: 100.00,
            vendorId: 1
          },
          {
            id: 2,
            name: 'خدمة اختبار 2',
            price: 200.00,
            vendorId: 1
          }
        ]);

        // استدعاء الدالة
        await serviceController.getVendorServices(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(Service.findByVendorId.calledOnce).to.be.true;
        expect(Service.findByVendorId.calledWith(1)).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('services');
        expect(responseData.services).to.be.an('array');
        expect(responseData.services.length).to.equal(2);
      });

      it('يجب أن يعيد خطأ إذا لم يتم العثور على البائع', async () => {
        // تهيئة البيانات
        req.params.vendorId = '999';

        // تهيئة stub للنموذج
        sandbox.stub(Vendor, 'findById').resolves(null);

        // استدعاء الدالة
        await serviceController.getVendorServices(req, res, next);

        // التحقق من النتائج
        expect(Vendor.findById.calledOnce).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        const responseData = res.json.firstCall.args[0];
        expect(responseData).to.have.property('error');
        expect(responseData.error).to.include('لم يتم العثور على البائع');
      });
    });
  });
});