const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/authMiddleware');
const config = require('../../config');

// تجاهل استدعاء jwt.verify الحقيقي واستبداله بدالة مزيفة
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    // إعداد كائنات مزيفة للاختبار
    req = {
      headers: {}
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

  test('يجب أن يرفض الطلب إذا لم يتم توفير رأس التفويض', () => {
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مصرح - التوكن مطلوب' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا كان رأس التفويض بتنسيق غير صحيح', () => {
    req.headers.authorization = 'InvalidFormat';
    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مصرح - التوكن مطلوب' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا كان التوكن غير صالح', () => {
    req.headers.authorization = 'Bearer invalidToken';
    const error = new Error('توكن غير صالح');
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('invalidToken', config.jwtSecret);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'توكن غير صالح', error: error.message });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يرفض الطلب إذا كان المستخدم بائعًا بدون معرف بائع', () => {
    req.headers.authorization = 'Bearer validToken';
    jwt.verify.mockReturnValue({ id: '123', role: 'vendor' });

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validToken', config.jwtSecret);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'غير مصرح - معلومات البائع غير متوفرة' });
    expect(next).not.toHaveBeenCalled();
  });

  test('يجب أن يضيف بيانات المستخدم إلى الطلب ويستدعي next() إذا كان التوكن صالحًا', () => {
    req.headers.authorization = 'Bearer validToken';
    const user = { id: '123', role: 'admin' };
    jwt.verify.mockReturnValue(user);

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validToken', config.jwtSecret);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('يجب أن يضيف بيانات المستخدم إلى الطلب ويستدعي next() إذا كان المستخدم بائعًا مع معرف بائع', () => {
    req.headers.authorization = 'Bearer validToken';
    const user = { id: '123', role: 'vendor', vendorId: 'v456' };
    jwt.verify.mockReturnValue(user);

    authMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('validToken', config.jwtSecret);
    expect(req.user).toEqual(user);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});