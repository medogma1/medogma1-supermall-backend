const vendorOwnershipMiddleware = require('../../middleware/vendorOwnershipMiddleware');
const { Service } = require('../../models/Service');

// تجاهل استدعاء Service.findByPk الحقيقي واستبداله بدالة مزيفة
jest.mock('../../models/Service', () => ({
  Service: {
    findByPk: jest.fn()
  }
}));

describe('Vendor Ownership Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // إعداد كائنات مزيفة للاختبار
    req = {
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('يجب أن يرفض الطلب إذا لم يتم توفير معلومات المستخدم', async () => {
    await vendorOwnershipMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مصرح - يرجى تسجيل الدخول أولاً' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يستدعي next() إذا كان المستخدم مشرفًا', async () => {
    req.user = { role: 'admin' };
    await vendorOwnershipMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(Service.findByPk).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا كان المستخدم ليس بائعًا', async () => {
    req.user = { role: 'user' };
    await vendorOwnershipMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مسموح - يجب أن تكون بائعًا للوصول إلى هذا المورد' });
    expect(next).not.toHaveBeenCalled();
    expect(Service.findByPk).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا لم يتم توفير معرف الخدمة', async () => {
    req.user = { role: 'vendor', vendorId: 'v123' };
    await vendorOwnershipMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'معرف الخدمة مطلوب' });
    expect(next).not.toHaveBeenCalled();
    expect(Service.findByPk).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا لم يتم العثور على الخدمة', async () => {
    req.user = { role: 'vendor', vendorId: 'v123' };
    req.params.id = 's456';
    Service.findByPk.mockResolvedValue(null);

    await vendorOwnershipMiddleware(req, res, next);

    expect(Service.findByPk).toHaveBeenCalledWith('s456');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'الخدمة غير موجودة' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا كان البائع ليس مالك الخدمة', async () => {
    req.user = { role: 'vendor', vendorId: 'v123' };
    req.params.id = 's456';
    Service.findByPk.mockResolvedValue({ vendor_id: 'v789' });

    await vendorOwnershipMiddleware(req, res, next);

    expect(Service.findByPk).toHaveBeenCalledWith('s456');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مسموح - لا يمكنك الوصول إلى خدمة لا تملكها' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يضيف الخدمة إلى الطلب ويستدعي next() إذا كان البائع هو المالك', async () => {
    req.user = { role: 'vendor', vendorId: 'v123' };
    req.params.id = 's456';
    const service = { vendor_id: 'v123', id: 's456', name: 'Test Service' };
    Service.findByPk.mockResolvedValue(service);

    await vendorOwnershipMiddleware(req, res, next);

    expect(Service.findByPk).toHaveBeenCalledWith('s456');
    expect(req.service).toEqual(service);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('يجب أن يتعامل مع الأخطاء بشكل صحيح', async () => {
    req.user = { role: 'vendor', vendorId: 'v123' };
    req.params.id = 's456';
    const error = new Error('خطأ في قاعدة البيانات');
    Service.findByPk.mockRejectedValue(error);

    await vendorOwnershipMiddleware(req, res, next);

    expect(Service.findByPk).toHaveBeenCalledWith('s456');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'خطأ في التحقق من ملكية الخدمة', error: error.message });
    expect(next).not.toHaveBeenCalled();
  });
});