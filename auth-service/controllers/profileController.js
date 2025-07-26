// auth-service/controllers/profileController.js
const { User } = require('../models/User');
const { pool } = require('../config/database');

// ─── عرض البيانات ─────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'المستخدم غير موجود',
        errors: {
          user: 'لم يتم العثور على المستخدم'
        }
      });
    }

    // إعداد بيانات المستخدم للإرجاع (حذف البيانات الحساسة)
    const userData = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      email: user.email,
      role: user.role,
      country: user.country,
      governorate: user.governorate,
      phone: user.phone,
      nationalId: user.national_id,
      workshopAddress: user.workshop_address,
      profileImage: user.profile_image,
      isActive: user.is_active === 1,
      isEmailVerified: user.is_email_verified === 1,
      isPhoneVerified: user.is_phone_verified === 1,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      vendorId: user.vendor_id
    };

    return res.status(200).json({
      status: 'success',
      message: 'تم جلب بيانات المستخدم بنجاح',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('❌ خطأ في جلب بيانات المستخدم:', error);
    return res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء جلب بيانات المستخدم',
      errors: {
        server: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى'
      }
    });
  }
};

// ─── تعديل البيانات ─────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, country, governorate, workshopAddress } = req.body;
    const userId = req.user.id;

    // التحقق من البيانات المطلوبة
    if ((!first_name && !last_name) || !email) {
      return res.status(400).json({
        status: 'error',
        message: 'جميع الحقول الأساسية مطلوبة',
        errors: {
          first_name: (!first_name && !last_name) ? 'الاسم الأول مطلوب' : null,
          email: !email ? 'البريد الإلكتروني مطلوب' : null
        }
      });
    }

    // التحقق من صحة البريد الإلكتروني
    if (!(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/).test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'البريد الإلكتروني غير صالح',
        errors: {
          email: 'يرجى إدخال بريد إلكتروني صالح'
        }
      });
    }

    // التحقق من وجود المستخدم
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'المستخدم غير موجود',
        errors: {
          user: 'لم يتم العثور على المستخدم'
        }
      });
    }

    // التحقق من عدم وجود بريد إلكتروني مكرر
    if (email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailExists = await User.findByEmail(email.toLowerCase());
      if (emailExists) {
        return res.status(400).json({
          status: 'error',
          message: 'البريد الإلكتروني مستخدم بالفعل',
          errors: {
            email: 'هذا البريد الإلكتروني مسجل مسبقاً'
          }
        });
      }
    }

    // تحديث بيانات المستخدم
    const updateData = {
      first_name: first_name || existingUser.first_name,
      last_name: last_name || existingUser.last_name,
      email: email.toLowerCase(),
      updated_at: new Date()
    };

    // إضافة البيانات الاختيارية إذا تم توفيرها
    if (phone) updateData.phone = phone;
    if (country) updateData.country = country;
    if (governorate) updateData.governorate = governorate;
    if (workshopAddress) updateData.workshop_address = workshopAddress;

    // تنفيذ التحديث
    await pool.execute(
      'UPDATE users SET ? WHERE id = ?',
      [updateData, userId]
    );

    // جلب البيانات المحدثة
    const updatedUser = await User.findById(userId);

    // إعداد بيانات المستخدم للإرجاع (حذف البيانات الحساسة)
    const userData = {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      country: updatedUser.country,
      governorate: updatedUser.governorate,
      phone: updatedUser.phone,
      nationalId: updatedUser.national_id,
      workshopAddress: updatedUser.workshop_address,
      profileImage: updatedUser.profile_image,
      isActive: updatedUser.is_active === 1,
      isEmailVerified: updatedUser.is_email_verified === 1,
      isPhoneVerified: updatedUser.is_phone_verified === 1,
      lastLogin: updatedUser.last_login,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
      vendorId: updatedUser.vendor_id
    };

    return res.status(200).json({
      status: 'success',
      message: 'تم تحديث بيانات المستخدم بنجاح',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث بيانات المستخدم:', error);
    return res.status(500).json({
      status: 'error',
      message: 'حدث خطأ أثناء تحديث بيانات المستخدم',
      errors: {
        server: 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى'
      }
    });
  }
};
