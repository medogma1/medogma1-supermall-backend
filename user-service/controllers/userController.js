// user-service/controllers/userController.js
// استخدام نموذج MySQL بدلاً من MongoDB
const userModel = require('../models/mysql-user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

// مساعد لإنشاء وإرسال الرمز المميز
const createSendToken = (user, statusCode, res) => {
  // إنشاء الرمز المميز
  const token = user.generateAuthToken();
  
  // تحديث آخر تسجيل دخول
  user.lastLogin = Date.now();
  user.save({ validateBeforeSave: false });
  
  // إعداد خيارات ملف تعريف الارتباط
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  
  // استخدام HTTPS في الإنتاج فقط
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
  // إرسال الرمز المميز في ملف تعريف الارتباط
  res.cookie('jwt', token, cookieOptions);
  
  // إزالة كلمة المرور من الإخراج
  user.password = undefined;
  
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// التسجيل
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, phoneNumber } = req.body;
    
    // التحقق من وجود المستخدم
    const existingUser = await userModel.findUserByEmailOrUsername(email, username);
    
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: existingUser.email === email 
          ? 'البريد الإلكتروني مستخدم بالفعل' 
          : 'اسم المستخدم مستخدم بالفعل'
      });
    }
    
    // إنشاء مستخدم جديد باستخدام نموذج MySQL
    const userData = {
      firstName,
      lastName,
      username,
      email,
      password,
      phoneNumber
    };
    
    const newUser = await userModel.createUser(userData);
    
    // إنشاء رمز التحقق من البريد الإلكتروني
    const emailVerificationToken = await userModel.createEmailVerificationToken(newUser.id);
    
    // TODO: إرسال بريد إلكتروني للتحقق
    // await sendVerificationEmail(newUser.email, emailVerificationToken);
    
    createSendToken(newUser, 201, res);
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // التحقق من وجود البريد الإلكتروني وكلمة المرور
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'يرجى تقديم البريد الإلكتروني وكلمة المرور'
      });
    }
    
    // التحقق من وجود المستخدم وصحة كلمة المرور باستخدام نموذج MySQL
    const user = await userModel.loginUser(email, password);
    
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }
    
    // التحقق من حالة المستخدم
    if (!user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'تم تعطيل حسابك. يرجى الاتصال بالدعم.'
      });
    }
    
    // إعادة تعيين محاولات تسجيل الدخول
    await userModel.resetLoginAttempts(user.id);
    
    // إنشاء وإرسال الرمز المميز
    const token = await userModel.generateAuthToken(user.id);
    
    // تحديث آخر تسجيل دخول
    await userModel.updateLastLogin(user.id);
    
    // إعداد خيارات ملف تعريف الارتباط
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    
    // استخدام HTTPS في الإنتاج فقط
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    
    // إرسال الرمز المميز في ملف تعريف الارتباط
    res.cookie('jwt', token, cookieOptions);
    
    // إزالة كلمة المرور من الإخراج
    delete user.password;
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تسجيل الخروج
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success'
  });
};

// حماية المسارات - التحقق من المصادقة
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // الحصول على الرمز المميز
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'أنت غير مسجل الدخول. يرجى تسجيل الدخول للوصول.'
      });
    }
    
    // التحقق من الرمز المميز
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // التحقق من وجود المستخدم باستخدام نموذج MySQL
    const currentUser = await userModel.findUserById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'المستخدم المالك لهذا الرمز لم يعد موجودًا.'
      });
    }
    
    // التحقق مما إذا تم تغيير كلمة المرور بعد إصدار الرمز المميز
    if (await userModel.hasPasswordChangedAfterToken(currentUser.id, decoded.iat)) {
      return res.status(401).json({
        status: 'fail',
        message: 'تم تغيير كلمة المرور مؤخرًا. يرجى تسجيل الدخول مرة أخرى.'
      });
    }
    
    // التحقق من حالة المستخدم
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'تم تعطيل حسابك. يرجى الاتصال بالدعم.'
      });
    }
    
    // منح الوصول إلى المسار المحمي
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'غير مصرح به. يرجى تسجيل الدخول مرة أخرى.'
    });
  }
};

// تقييد الوصول إلى أدوار معينة
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'ليس لديك إذن للقيام بهذا الإجراء'
      });
    }
    
    next();
  };
};

// نسيت كلمة المرور
exports.forgotPassword = async (req, res) => {
  try {
    // الحصول على المستخدم بناءً على البريد الإلكتروني باستخدام نموذج MySQL
    const user = await userModel.findUserByEmail(req.body.email);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'لا يوجد مستخدم بهذا البريد الإلكتروني'
      });
    }
    
    // إنشاء رمز إعادة تعيين باستخدام نموذج MySQL
    const resetToken = await userModel.createPasswordResetToken(user.id);
    
    // إنشاء عنوان URL لإعادة التعيين
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    
    // TODO: إرسال بريد إلكتروني مع رابط إعادة التعيين
    // await sendPasswordResetEmail(user.email, resetURL);
    
    res.status(200).json({
      status: 'success',
      message: 'تم إرسال رمز إعادة التعيين إلى البريد الإلكتروني'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى لاحقًا!'
    });
  }
};

// إعادة تعيين كلمة المرور
exports.resetPassword = async (req, res) => {
  try {
    // الحصول على المستخدم بناءً على الرمز باستخدام نموذج MySQL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    // التحقق من صلاحية الرمز والحصول على المستخدم
    const user = await userModel.verifyPasswordResetToken(hashedToken);
    
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرمز غير صالح أو منتهي الصلاحية'
      });
    }
    
    // تعيين كلمة المرور الجديدة
    await userModel.resetPassword(user.id, req.body.password);
    
    // إنشاء وإرسال الرمز المميز للتسجيل التلقائي
    const token = await userModel.generateAuthToken(user.id);
    
    // تحديث آخر تسجيل دخول
    await userModel.updateLastLogin(user.id);
    
    // إعداد خيارات ملف تعريف الارتباط
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    
    // استخدام HTTPS في الإنتاج فقط
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    
    // إرسال الرمز المميز في ملف تعريف الارتباط
    res.cookie('jwt', token, cookieOptions);
    
    // إزالة كلمة المرور من الإخراج
    delete user.password;
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تحديث كلمة المرور
exports.updatePassword = async (req, res) => {
  try {
    // التحقق من كلمة المرور الحالية باستخدام نموذج MySQL
    const isPasswordCorrect = await userModel.verifyCurrentPassword(
      req.user.id,
      req.body.currentPassword
    );
    
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: 'fail',
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }
    
    // تحديث كلمة المرور باستخدام نموذج MySQL
    await userModel.updatePassword(req.user.id, req.body.newPassword);
    
    // الحصول على بيانات المستخدم المحدثة
    const user = await userModel.findUserById(req.user.id);
    
    // إنشاء وإرسال الرمز المميز الجديد
    const token = await userModel.generateAuthToken(user.id);
    
    // تحديث آخر تسجيل دخول
    await userModel.updateLastLogin(user.id);
    
    // إعداد خيارات ملف تعريف الارتباط
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true
    };
    
    // استخدام HTTPS في الإنتاج فقط
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    
    // إرسال الرمز المميز في ملف تعريف الارتباط
    res.cookie('jwt', token, cookieOptions);
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// الحصول على الملف الشخصي الحالي
exports.getMe = async (req, res) => {
  // الحصول على بيانات المستخدم المحدثة من قاعدة البيانات
  const user = await userModel.findUserById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
};

// تحديث الملف الشخصي
exports.updateMe = async (req, res) => {
  try {
    // التحقق من عدم وجود محاولة لتحديث كلمة المرور
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: 'هذا المسار ليس لتحديث كلمة المرور. يرجى استخدام /updatePassword.'
      });
    }
    
    // تصفية الحقول غير المسموح بها
    const filteredBody = {};
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'avatar', 'preferences'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });
    
    // تحديث المستخدم باستخدام نموذج MySQL
    const updatedUser = await userModel.updateUser(req.user.id, filteredBody);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تعطيل الحساب
exports.deleteMe = async (req, res) => {
  try {
    // تعطيل الحساب باستخدام نموذج MySQL
    await userModel.deactivateUser(req.user.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// التحقق من البريد الإلكتروني
exports.verifyEmail = async (req, res) => {
  try {
    // الحصول على المستخدم بناءً على الرمز باستخدام نموذج MySQL
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    
    // التحقق من صلاحية الرمز والحصول على المستخدم
    const user = await userModel.verifyEmailToken(hashedToken);
    
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'الرمز غير صالح أو منتهي الصلاحية'
      });
    }
    
    // تحديث حالة التحقق باستخدام نموذج MySQL
    await userModel.confirmEmail(user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'تم التحقق من البريد الإلكتروني بنجاح'
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// إعادة إرسال رمز التحقق من البريد الإلكتروني
exports.resendVerificationEmail = async (req, res) => {
  try {
    // الحصول على المستخدم باستخدام نموذج MySQL
    const user = await userModel.findUserById(req.user.id);
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        status: 'fail',
        message: 'البريد الإلكتروني مُتحقق منه بالفعل'
      });
    }
    
    // إنشاء رمز جديد باستخدام نموذج MySQL
    const verificationToken = await userModel.createEmailVerificationToken(user.id);
    
    // TODO: إرسال بريد إلكتروني للتحقق
    // await sendVerificationEmail(user.email, verificationToken);
    
    res.status(200).json({
      status: 'success',
      message: 'تم إرسال رمز التحقق الجديد إلى البريد الإلكتروني'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ في إرسال البريد الإلكتروني. يرجى المحاولة مرة أخرى لاحقًا!'
    });
  }
};

// إدارة العناوين
// إضافة عنوان جديد
exports.addAddress = async (req, res) => {
  try {
    // إضافة عنوان جديد باستخدام نموذج MySQL
    const result = await userModel.addAddress(req.user.id, req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        addresses: result.addresses,
        defaultAddress: result.defaultAddress
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تحديث عنوان
exports.updateAddress = async (req, res) => {
  try {
    // تحديث عنوان باستخدام نموذج MySQL
    const result = await userModel.updateAddress(req.user.id, req.params.addressId, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        addresses: result.addresses,
        defaultAddress: result.defaultAddress
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// حذف عنوان
exports.deleteAddress = async (req, res) => {
  try {
    // حذف عنوان باستخدام نموذج MySQL
    const result = await userModel.removeAddress(req.user.id, req.params.addressId);
    
    res.status(200).json({
      status: 'success',
      data: {
        addresses: result.addresses,
        defaultAddress: result.defaultAddress
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تعيين عنوان افتراضي
exports.setDefaultAddress = async (req, res) => {
  try {
    // تعيين عنوان افتراضي باستخدام نموذج MySQL
    const result = await userModel.setDefaultAddress(req.user.id, req.params.addressId);
    
    res.status(200).json({
      status: 'success',
      data: {
        addresses: result.addresses,
        defaultAddress: result.defaultAddress
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// الحصول على جميع العناوين
exports.getAddresses = async (req, res) => {
  try {
    // الحصول على جميع العناوين باستخدام نموذج MySQL
    const result = await userModel.getAddresses(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        addresses: result.addresses,
        defaultAddress: result.defaultAddress
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// وظائف المسؤول
// الحصول على جميع المستخدمين
exports.getAllUsers = async (req, res) => {
  try {
    // تنفيذ الاستعلام مع الترشيح والفرز والحد باستخدام نموذج MySQL
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // إعداد معايير الترشيح
    const filters = {};
    
    if (req.query.role) filters.role = req.query.role;
    if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
    if (req.query.isEmailVerified !== undefined) filters.isEmailVerified = req.query.isEmailVerified === 'true';
    if (req.query.search) filters.search = req.query.search;
    
    // تنفيذ الاستعلام باستخدام نموذج MySQL
    const result = await userModel.getAllUsers({
      page,
      limit,
      sort: req.query.sort || 'createdAt DESC',
      filters
    });
    
    res.status(200).json({
      status: 'success',
      results: result.users.length,
      totalPages: Math.ceil(result.totalUsers / limit),
      currentPage: page,
      totalUsers: result.totalUsers,
      data: {
        users: result.users
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// الحصول على مستخدم واحد
exports.getUser = async (req, res) => {
  try {
    // الحصول على مستخدم واحد باستخدام نموذج MySQL
    const user = await userModel.findUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'لا يوجد مستخدم بهذا المعرف'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// تحديث مستخدم
exports.updateUser = async (req, res) => {
  try {
    // تصفية الحقول غير المسموح بها
    const filteredBody = {};
    const allowedFields = ['firstName', 'lastName', 'phoneNumber', 'role', 'isActive', 'avatar', 'preferences'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredBody[key] = req.body[key];
      }
    });
    
    // التحقق من وجود المستخدم أولاً
    const existingUser = await userModel.findUserById(req.params.id);
    
    if (!existingUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'لا يوجد مستخدم بهذا المعرف'
      });
    }
    
    // تحديث المستخدم باستخدام نموذج MySQL
    const user = await userModel.updateUser(req.params.id, filteredBody);
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// حذف مستخدم
exports.deleteUser = async (req, res) => {
  try {
    // التحقق من وجود المستخدم أولاً
    const existingUser = await userModel.findUserById(req.params.id);
    
    if (!existingUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'لا يوجد مستخدم بهذا المعرف'
      });
    }
    
    // حذف المستخدم باستخدام نموذج MySQL
    await userModel.deleteUser(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// إحصائيات المستخدمين
exports.getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          verified: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    // إعادة تنظيم البيانات
    const formattedStats = {};
    stats.forEach(stat => {
      formattedStats[stat._id] = {
        total: stat.count,
        active: stat.active,
        verified: stat.verified
      };
    });
    
    // إحصائيات التسجيل
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    const registrationStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: lastYear }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        roleStats: formattedStats,
        registrationStats
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};