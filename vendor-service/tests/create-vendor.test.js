/**
 * اختبارات Jest لوظيفة إنشاء بائع جديد
 */

const vendorController = require('../controllers/vendorController');
const Vendor = require('../models/Vendor');

// Mock للنموذج Vendor
jest.mock('../models/Vendor', () => {
  return {
    validateVendorData: jest.fn(),
    create: jest.fn(),
  };
});

// Mock للـ logger
jest.mock('../utils/logger', () => {
  return {
    info: jest.fn(),
    error: jest.fn(),
  };
});

describe('vendorController - createVendor', () => {
  let req, res, next;

  beforeEach(() => {
    // إعادة تعيين المحاكاة قبل كل اختبار
    jest.clearAllMocks();
    
    // إعداد الطلب والاستجابة والتالي
    req = {
      body: {
        name: 'تاجر جديد',
        email: 'vendor@example.com',
        phone: '0123456789',
        user_id: 123,
        business_type: 'retail',
        storeName: 'متجر جديد',
        storeDescription: 'وصف المتجر',
        storeLogoUrl: 'https://example.com/logo.png',
        contactEmail: 'contact@example.com',
        contactPhone: '0123456789',
        storeAddress: 'عنوان المتجر',
        country: 'مصر',
        governorate: 'القاهرة',
        nationalId: '12345678901234'
      },
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  test('يجب إنشاء بائع جديد بنجاح مع بيانات صالحة', async () => {
    // تهيئة المحاكاة
    Vendor.validateVendorData.mockReturnValue({ isValid: true });
    Vendor.create.mockResolvedValue({ id: 1, ...req.body });

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(Vendor.validateVendorData).toHaveBeenCalled();
    expect(Vendor.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.any(String),
      vendor: expect.objectContaining({ id: 1 })
    }));
  });

  test('يجب أن يفشل الإنشاء عند عدم توفير الحقول المطلوبة', async () => {
    // تعديل الطلب لإزالة الحقول المطلوبة
    req.body = {
      name: 'تاجر جديد',
      // حذف email
      phone: '0123456789',
      user_id: 123,
      // حذف business_type
    };

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'All fields are required'
    }));
  });

  test('يجب أن يفشل الإنشاء عند استخدام بيانات غير صالحة', async () => {
    // تهيئة المحاكاة لإرجاع خطأ في التحقق من صحة البيانات
    Vendor.validateVendorData.mockReturnValue({
      isValid: false,
      errors: ['البريد الإلكتروني غير صالح']
    });

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(Vendor.validateVendorData).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid vendor data',
      errors: expect.any(Array)
    }));
  });

  test('يجب أن يفشل الإنشاء عند استخدام بريد إلكتروني موجود بالفعل', async () => {
    // تهيئة المحاكاة
    Vendor.validateVendorData.mockReturnValue({ isValid: true });
    
    // محاكاة خطأ البريد الإلكتروني المكرر
    const duplicateError = new Error('Duplicate email');
    duplicateError.code = 'ER_DUP_ENTRY';
    duplicateError.sqlMessage = "Duplicate entry 'vendor@example.com' for key 'email'";
    Vendor.create.mockRejectedValue(duplicateError);

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(Vendor.validateVendorData).toHaveBeenCalled();
    expect(Vendor.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('already exists')
    }));
  });

  test('يجب أن يفشل الإنشاء عند استخدام معرف مستخدم موجود بالفعل', async () => {
    // تهيئة المحاكاة
    Vendor.validateVendorData.mockReturnValue({ isValid: true });
    
    // محاكاة خطأ معرف المستخدم المكرر
    const duplicateError = new Error('Duplicate user_id');
    duplicateError.code = 'ER_DUP_ENTRY';
    duplicateError.sqlMessage = "Duplicate entry '123' for key 'user_id'";
    Vendor.create.mockRejectedValue(duplicateError);

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(Vendor.validateVendorData).toHaveBeenCalled();
    expect(Vendor.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('already exists')
    }));
  });

  test('يجب أن يفشل الإنشاء عند استخدام معرف مستخدم غير صالح', async () => {
    // تعديل الطلب لاستخدام معرف مستخدم غير صالح
    req.body.user_id = 'not-a-number';

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('user_id must be a number')
    }));
  });

  test('يجب أن يفشل الإنشاء عند حدوث استثناء غير متوقع', async () => {
    // تهيئة المحاكاة
    Vendor.validateVendorData.mockReturnValue({ isValid: true });
    
    // محاكاة خطأ غير متوقع
    const unexpectedError = new Error('Unexpected error');
    Vendor.create.mockRejectedValue(unexpectedError);

    // استدعاء الدالة
    await vendorController.createVendor(req, res, next);

    // التحقق من النتائج
    expect(Vendor.validateVendorData).toHaveBeenCalled();
    expect(Vendor.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Failed to create vendor'
    }));
  });
});