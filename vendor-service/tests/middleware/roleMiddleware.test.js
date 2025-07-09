const roleMiddleware = require('../../middleware/roleMiddleware');

describe('Role Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // إعداد كائنات مزيفة للاختبار
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('يجب أن يرفض الطلب إذا لم يتم توفير معلومات المستخدم', () => {
    const middleware = roleMiddleware('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مصرح - يرجى تسجيل الدخول أولاً' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا كان دور المستخدم غير مسموح به', () => {
    req.user = { role: 'user' };
    const middleware = roleMiddleware('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'غير مسموح - ليس لديك الصلاحيات الكافية للوصول إلى هذا المورد',
      requiredRoles: ['admin'],
      yourRole: 'user'
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يستدعي next() إذا كان دور المستخدم مسموحًا به', () => {
    req.user = { role: 'admin' };
    const middleware = roleMiddleware('admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('يجب أن يستدعي next() إذا كان دور المستخدم أحد الأدوار المسموح بها', () => {
    req.user = { role: 'vendor' };
    const middleware = roleMiddleware('admin', 'vendor', 'user');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});