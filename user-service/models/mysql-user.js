// user-service/models/mysql-user.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');
const mysql = require('mysql2/promise');
require('dotenv').config();

// إنشاء مجمع اتصالات قاعدة البيانات
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// دالة مساعدة لتشفير كلمة المرور
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// دالة مساعدة لمقارنة كلمة المرور
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// دالة مساعدة لإنشاء رمز مميز للمصادقة
function generateAuthToken(userId, role) {
  return jwt.sign(
    { id: userId, role: role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

// دالة لإنشاء مستخدم جديد
async function createUser(userData) {
  try {
    // التحقق من وجود المستخدم
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [userData.email, userData.username]
    );
    
    if (existingUsers.length > 0) {
      return {
        success: false,
        error: existingUsers[0].email === userData.email 
          ? 'البريد الإلكتروني مستخدم بالفعل' 
          : 'اسم المستخدم مستخدم بالفعل'
      };
    }
    
    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(userData.password);
    
    // إنشاء رمز التحقق من البريد الإلكتروني
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    
    // إدخال المستخدم الجديد في قاعدة البيانات
    const [result] = await pool.execute(
      `INSERT INTO users (
        first_name, last_name, username, email, password, phone_number,
        role, is_email_verified, is_phone_verified, is_active,
        email_verification_token, email_verification_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.firstName,
        userData.lastName,
        userData.username,
        userData.email,
        hashedPassword,
        userData.phoneNumber || null,
        userData.role || 'user',
        false,
        false,
        true,
        hashedToken,
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ساعة
      ]
    );
    
    // إدخال تفضيلات المستخدم
    await pool.execute(
      `INSERT INTO user_preferences (
        user_id, language, notification_preferences
      ) VALUES (?, ?, ?)`,
      [
        result.insertId,
        'ar',
        JSON.stringify({})
      ]
    );
    
    // الحصول على المستخدم المدخل حديثًا
    const [user] = await pool.execute(
      `SELECT u.*, p.language, p.notification_preferences
      FROM users u
      LEFT JOIN user_preferences p ON u.id = p.user_id
      WHERE u.id = ?`,
      [result.insertId]
    );
    
    return {
      success: true,
      user: user[0],
      verificationToken
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة للبحث عن مستخدم حسب البريد الإلكتروني
async function findUserByEmail(email, includePassword = false) {
  try {
    let query = `
      SELECT u.*, p.language, p.notification_preferences
      FROM users u
      LEFT JOIN user_preferences p ON u.id = p.user_id
      WHERE u.email = ?
    `;
    
    const [users] = await pool.execute(query, [email]);
    
    if (users.length === 0) {
      return {
        success: false,
        error: 'المستخدم غير موجود'
      };
    }
    
    // إذا كان includePassword صحيحًا، قم بإرجاع كلمة المرور أيضًا
    if (!includePassword) {
      delete users[0].password;
    }
    
    return {
      success: true,
      user: users[0]
    };
  } catch (error) {
    console.error('Error finding user by email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة للبحث عن مستخدم حسب المعرف
async function findUserById(userId) {
  try {
    const [users] = await pool.execute(
      `SELECT u.*, p.language, p.notification_preferences
      FROM users u
      LEFT JOIN user_preferences p ON u.id = p.user_id
      WHERE u.id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        error: 'المستخدم غير موجود'
      };
    }
    
    // إزالة كلمة المرور من النتيجة
    delete users[0].password;
    
    return {
      success: true,
      user: users[0]
    };
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة لتسجيل دخول المستخدم
async function loginUser(email, password) {
  try {
    // البحث عن المستخدم بالبريد الإلكتروني
    const userResult = await findUserByEmail(email, true);
    
    if (!userResult.success) {
      return userResult;
    }
    
    const user = userResult.user;
    
    // التحقق من صحة كلمة المرور
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      };
    }
    
    // التحقق من حالة المستخدم
    if (!user.is_active) {
      return {
        success: false,
        error: 'تم تعطيل حسابك. يرجى الاتصال بالدعم.'
      };
    }
    
    // إعادة تعيين محاولات تسجيل الدخول
    await pool.execute(
      'UPDATE users SET login_attempts = 0, lock_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );
    
    // إنشاء الرمز المميز
    const token = generateAuthToken(user.id, user.role);
    
    // إزالة كلمة المرور من النتيجة
    delete user.password;
    
    return {
      success: true,
      user,
      token
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة لتحديث معلومات المستخدم
async function updateUser(userId, userData) {
  try {
    // التحقق من وجود المستخدم
    const userResult = await findUserById(userId);
    
    if (!userResult.success) {
      return userResult;
    }
    
    // بناء استعلام التحديث ديناميكيًا
    let updateFields = [];
    let updateValues = [];
    
    // تحديث الحقول المقدمة فقط
    if (userData.firstName) {
      updateFields.push('first_name = ?');
      updateValues.push(userData.firstName);
    }
    
    if (userData.lastName) {
      updateFields.push('last_name = ?');
      updateValues.push(userData.lastName);
    }
    
    if (userData.phoneNumber) {
      updateFields.push('phone_number = ?');
      updateValues.push(userData.phoneNumber);
    }
    
    if (userData.avatar) {
      updateFields.push('avatar = ?');
      updateValues.push(userData.avatar);
    }
    
    if (userData.isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(userData.isActive);
    }
    
    // إضافة معرف المستخدم للاستعلام
    updateValues.push(userId);
    
    // تنفيذ استعلام التحديث إذا كانت هناك حقول للتحديث
    if (updateFields.length > 0) {
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    }
    
    // تحديث تفضيلات المستخدم إذا تم تقديمها
    if (userData.preferences) {
      let prefUpdateFields = [];
      let prefUpdateValues = [];
      
      if (userData.preferences.language) {
        prefUpdateFields.push('language = ?');
        prefUpdateValues.push(userData.preferences.language);
      }
      
      // Currency field removed - using notification_preferences JSON instead
      
      if (userData.preferences.notifications) {
        if (userData.preferences.notifications.email !== undefined) {
          prefUpdateFields.push('email_notifications = ?');
          prefUpdateValues.push(userData.preferences.notifications.email);
        }
        
        if (userData.preferences.notifications.sms !== undefined) {
          prefUpdateFields.push('sms_notifications = ?');
          prefUpdateValues.push(userData.preferences.notifications.sms);
        }
        
        if (userData.preferences.notifications.push !== undefined) {
          prefUpdateFields.push('push_notifications = ?');
          prefUpdateValues.push(userData.preferences.notifications.push);
        }
      }
      
      if (userData.preferences.marketing) {
        if (userData.preferences.marketing.email !== undefined) {
          prefUpdateFields.push('email_marketing = ?');
          prefUpdateValues.push(userData.preferences.marketing.email);
        }
        
        if (userData.preferences.marketing.sms !== undefined) {
          prefUpdateFields.push('sms_marketing = ?');
          prefUpdateValues.push(userData.preferences.marketing.sms);
        }
      }
      
      // إضافة معرف المستخدم للاستعلام
      prefUpdateValues.push(userId);
      
      // تنفيذ استعلام تحديث التفضيلات إذا كانت هناك حقول للتحديث
      if (prefUpdateFields.length > 0) {
        await pool.execute(
          `UPDATE user_preferences SET ${prefUpdateFields.join(', ')} WHERE user_id = ?`,
          prefUpdateValues
        );
      }
    }
    
    // الحصول على المستخدم المحدث
    return await findUserById(userId);
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة لتغيير كلمة مرور المستخدم
async function changePassword(userId, currentPassword, newPassword) {
  try {
    // الحصول على المستخدم مع كلمة المرور
    const [users] = await pool.execute(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        error: 'المستخدم غير موجود'
      };
    }
    
    const user = users[0];
    
    // التحقق من صحة كلمة المرور الحالية
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'كلمة المرور الحالية غير صحيحة'
      };
    }
    
    // تشفير كلمة المرور الجديدة
    const hashedPassword = await hashPassword(newPassword);
    
    // تحديث كلمة المرور وتاريخ تغييرها
    await pool.execute(
      'UPDATE users SET password = ?, password_changed_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );
    
    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    };
  } catch (error) {
    console.error('Error changing password:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة لإنشاء رمز إعادة تعيين كلمة المرور
async function createPasswordResetToken(email) {
  try {
    // البحث عن المستخدم بالبريد الإلكتروني
    const userResult = await findUserByEmail(email);
    
    if (!userResult.success) {
      return userResult;
    }
    
    // إنشاء رمز عشوائي
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // تشفير الرمز
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // تحديث قاعدة البيانات برمز إعادة التعيين وتاريخ انتهاء صلاحيته
    await pool.execute(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [hashedToken, new Date(Date.now() + 10 * 60 * 1000), userResult.user.id] // 10 دقائق
    );
    
    return {
      success: true,
      resetToken
    };
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة للتحقق من رمز إعادة تعيين كلمة المرور وإعادة تعيين كلمة المرور
async function resetPassword(token, newPassword) {
  try {
    // تشفير الرمز للمقارنة
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // البحث عن المستخدم برمز إعادة التعيين
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [hashedToken]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        error: 'الرمز غير صالح أو منتهي الصلاحية'
      };
    }
    
    // تشفير كلمة المرور الجديدة
    const hashedPassword = await hashPassword(newPassword);
    
    // تحديث كلمة المرور وإزالة رمز إعادة التعيين
    await pool.execute(
      `UPDATE users SET 
        password = ?, 
        password_reset_token = NULL, 
        password_reset_expires = NULL,
        password_changed_at = NOW()
      WHERE id = ?`,
      [hashedPassword, users[0].id]
    );
    
    return {
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    };
  } catch (error) {
    console.error('Error resetting password:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة للتحقق من البريد الإلكتروني
async function verifyEmail(token) {
  try {
    // تشفير الرمز للمقارنة
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // البحث عن المستخدم برمز التحقق
    const [users] = await pool.execute(
      'SELECT id FROM users WHERE email_verification_token = ? AND email_verification_expires > NOW()',
      [hashedToken]
    );
    
    if (users.length === 0) {
      return {
        success: false,
        error: 'الرمز غير صالح أو منتهي الصلاحية'
      };
    }
    
    // تحديث حالة التحقق وإزالة الرمز
    await pool.execute(
      `UPDATE users SET 
        is_email_verified = TRUE, 
        email_verification_token = NULL, 
        email_verification_expires = NULL
      WHERE id = ?`,
      [users[0].id]
    );
    
    return {
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح'
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة للحصول على جميع المستخدمين مع الترشيح والصفحات
async function getAllUsers({ page = 1, limit = 10, sort = 'u.created_at DESC', filters = {} }) {
  try {
    // بناء استعلام SQL
    let query = `
      SELECT u.*, p.language, p.notification_preferences
      FROM users u
      LEFT JOIN user_preferences p ON u.id = p.user_id
      WHERE 1=1
    `;
    
    // إضافة شروط الترشيح
    const queryParams = [];
    
    if (filters.role) {
      query += ' AND u.role = ?';
      queryParams.push(filters.role);
    }
    
    if (filters.isActive !== undefined) {
      query += ' AND u.is_active = ?';
      queryParams.push(filters.isActive);
    }
    
    if (filters.isEmailVerified !== undefined) {
      query += ' AND u.is_email_verified = ?';
      queryParams.push(filters.isEmailVerified);
    }
    
    if (filters.search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.username LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    // استعلام لحساب إجمالي المستخدمين
    const countQuery = query.replace(
      'SELECT u.*, p.language, p.notification_preferences',
      'SELECT COUNT(*) as total'
    );
    
    // تنفيذ استعلام العدد
    const [countResult] = await pool.execute(countQuery, queryParams);
    const totalUsers = countResult[0].total;
    
    // إضافة الفرز والحد للاستعلام الرئيسي
    query += ` ORDER BY ${sort}`;
    query += ' LIMIT ? OFFSET ?';
    
    // حساب الإزاحة
    const offset = (page - 1) * limit;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    // تنفيذ الاستعلام الرئيسي
    const [users] = await pool.execute(query, queryParams);
    
    // إزالة كلمات المرور من النتائج
    users.forEach(user => {
      delete user.password;
      delete user.password_reset_token;
      delete user.password_reset_expires;
      delete user.email_verification_token;
      delete user.email_verification_expires;
    });
    
    return {
      success: true,
      users,
      totalUsers,
      page,
      limit
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// دالة للحصول على إحصائيات المستخدمين
async function getUserStats() {
  try {
    // إحصائيات حسب الدور
    const [roleStats] = await pool.execute(`
      SELECT 
        role, 
        COUNT(*) as total, 
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_email_verified = TRUE THEN 1 ELSE 0 END) as verified
      FROM users
      GROUP BY role
    `);
    
    // تنسيق إحصائيات الدور
    const formattedRoleStats = {};
    roleStats.forEach(stat => {
      formattedRoleStats[stat.role] = {
        total: stat.total,
        active: stat.active,
        verified: stat.verified
      };
    });
    
    // إحصائيات التسجيل
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    // تنسيق التواريخ لاستخدامها في استعلام SQL
    const lastYearFormatted = lastYear.toISOString().split('T')[0];
    const lastMonthFormatted = lastMonth.toISOString().split('T')[0];
    
    // إحصائيات التسجيل الشهرية
    const [monthlyStats] = await pool.execute(`
      SELECT 
        YEAR(created_at) as year, 
        MONTH(created_at) as month, 
        COUNT(*) as count
      FROM users
      WHERE created_at >= ?
      GROUP BY YEAR(created_at), MONTH(created_at)
      ORDER BY year ASC, month ASC
    `, [lastYearFormatted]);
    
    // إحصائيات التسجيل اليومية (آخر 30 يومًا)
    const [dailyStats] = await pool.execute(`
      SELECT 
        DATE(created_at) as date, 
        COUNT(*) as count
      FROM users
      WHERE created_at >= ?
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [lastMonthFormatted]);
    
    // إجمالي المستخدمين
    const [totalUsers] = await pool.execute('SELECT COUNT(*) as total FROM users');
    
    // المستخدمين النشطين
    const [activeUsers] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE is_active = TRUE');
    
    // المستخدمين المتحققين
    const [verifiedUsers] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE is_email_verified = TRUE');
    
    // المستخدمين الجدد (آخر 30 يومًا)
    const [newUsers] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= ?', 
      [lastMonthFormatted]
    );
    
    return {
      success: true,
      stats: {
        byRole: formattedRoleStats,
        monthly: monthlyStats,
        daily: dailyStats,
        totals: {
          all: totalUsers[0].total,
          active: activeUsers[0].total,
          verified: verifiedUsers[0].total,
          newLast30Days: newUsers[0].total
        }
      }
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// تصدير الدوال
module.exports = {
  pool,
  createUser,
  findUserByEmail,
  findUserById,
  loginUser,
  updateUser,
  changePassword,
  createPasswordResetToken,
  resetPassword,
  verifyEmail,
  generateAuthToken,
  comparePassword,
  getAllUsers,
  getUserStats
};