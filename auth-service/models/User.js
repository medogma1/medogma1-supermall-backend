// auth-service/models/User.js
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// ثوابت
const ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  CUSTOMER: 'customer'
};

class User {
  // إنشاء مستخدم جديد
  static async create(userData) {
    try {
      // تشفير كلمة المرور
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // التحقق من صحة الدور وتعيين قيمة افتراضية إذا لزم الأمر
      let dbRole = userData.role;
      if (!dbRole || !['admin', 'vendor', 'customer'].includes(dbRole)) {
        dbRole = 'customer'; // قيمة افتراضية
      }
      // تحويل 'user' إلى 'customer' للتوافق مع قاعدة البيانات
      if (dbRole === 'user') {
        dbRole = 'customer';
      }

      const [result] = await pool.execute(
        `INSERT INTO users (
          first_name, last_name, email, password, role, country, governorate, 
          phone, national_id, workshop_address, profile_image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          userData.first_name || 'غير محدد',
          userData.last_name || 'غير محدد',
          userData.email,
          hashedPassword,
          dbRole,
          userData.country || null,
          userData.governorate || null,
          userData.phone || null,
          userData.national_id || null,
          userData.workshop_address || null,
          userData.profile_image || ''
        ]
      );

      if (result.insertId) {
        return this.findById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء المستخدم:', error);
      throw error;
    }
  }

  // البحث عن مستخدم بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length) {
        const user = rows[0];
        return user;
      }
      return null;
    } catch (error) {
      console.error('خطأ في البحث عن المستخدم بواسطة المعرف:', error);
      throw error;
    }
  }

  // البحث عن مستخدم بواسطة البريد الإلكتروني
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length) {
        const user = rows[0];
        return user;
      }
      return null;
    } catch (error) {
      console.error('خطأ في البحث عن المستخدم بواسطة البريد الإلكتروني:', error);
      throw error;
    }
  }

  // تحديث بيانات المستخدم
  static async update(id, updateData) {
    try {
      // إنشاء أجزاء الاستعلام ديناميكيًا
      const allowedFields = [
        'username', 'email', 'role', 'is_active', 'country', 'governorate',
        'phone', 'national_id', 'workshop_address', 'profile_image',
        'is_email_verified', 'is_phone_verified'
      ];

      const updates = [];
      const values = [];

      // إنشاء جزء SET من الاستعلام
      for (const [key, value] of Object.entries(updateData)) {
        // تحويل camelCase إلى snake_case
        const fieldName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        if (allowedFields.includes(fieldName)) {
          updates.push(`${fieldName} = ?`);
          // تحويل undefined إلى null لتجنب خطأ MySQL
          values.push(value === undefined ? null : value);
        }
      }

      // إذا كان هناك تحديثات
      if (updates.length > 0) {
        values.push(id); // إضافة معرف المستخدم للشرط WHERE

        const [result] = await pool.execute(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        return result.affectedRows > 0;
      }

      return false;
    } catch (error) {
      console.error('خطأ في تحديث بيانات المستخدم:', error);
      throw error;
    }
  }

  // تحديث كلمة المرور
  static async updatePassword(id, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const [result] = await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في تحديث كلمة المرور:', error);
      throw error;
    }
  }

  // حذف مستخدم
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error);
      throw error;
    }
  }

  // التحقق من كلمة المرور
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // زيادة عدد محاولات تسجيل الدخول الفاشلة
  static async incrementLoginAttempts(id) {
    try {
      // الحصول على عدد المحاولات الحالي وتاريخ القفل
      const [rows] = await pool.execute(
        'SELECT failed_login_attempts, account_lock_until FROM users WHERE id = ?',
        [id]
      );

      if (!rows.length) return false;

      const user = rows[0];
      const now = new Date();
      let attempts = user.failed_login_attempts;
      let lockUntil = user.account_lock_until ? new Date(user.account_lock_until) : null;

      // إذا كان هناك قفل سابق وانتهت مدته
      if (lockUntil && lockUntil < now) {
        await pool.execute(
          'UPDATE users SET failed_login_attempts = 1, account_lock_until = NULL WHERE id = ?',
          [id]
        );
        return true;
      }

      // زيادة عدد المحاولات وقفل الحساب إذا تجاوز الحد
      attempts += 1;
      if (attempts >= 5) {
        // قفل لمدة 15 دقيقة
        const lockTime = new Date(now.getTime() + 15 * 60 * 1000);
        await pool.execute(
          'UPDATE users SET failed_login_attempts = ?, account_lock_until = ? WHERE id = ?',
          [attempts, lockTime, id]
        );
      } else {
        await pool.execute(
          'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
          [attempts, id]
        );
      }

      return true;
    } catch (error) {
      console.error('خطأ في زيادة عدد محاولات تسجيل الدخول الفاشلة:', error);
      throw error;
    }
  }

  // إعادة تعيين محاولات تسجيل الدخول الفاشلة
  static async resetLoginAttempts(id) {
    try {
      await pool.execute(
        'UPDATE users SET failed_login_attempts = 0, account_lock_until = NULL WHERE id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('خطأ في إعادة تعيين محاولات تسجيل الدخول الفاشلة:', error);
      throw error;
    }
  }

  // التحقق من قفل الحساب
  static async isAccountLocked(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT account_lock_until FROM users WHERE id = ?',
        [id]
      );

      if (!rows.length) return false;

      const lockUntil = rows[0].account_lock_until;
      return lockUntil && new Date(lockUntil) > new Date();
    } catch (error) {
      console.error('خطأ في التحقق من قفل الحساب:', error);
      throw error;
    }
  }

  // الحصول على الاسم الكامل
 static getFullName(user) {
    return user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'غير محدد';
  }

  // التحقق من نوع المستخدم
  static isAdmin(user) {
    return user.role === ROLES.ADMIN;
  }

  static isVendor(user) {
    return user.role === ROLES.VENDOR;
  }

  static isCustomer(user) {
    return user && user.role === 'customer';
  }

  // للتوافق مع الإصدارات السابقة
  static isUser(user) {
    return this.isCustomer(user);
  }
  
  // إنشاء حساب المسؤول إذا لم يكن موجودًا
  static async createAdminIfNotExists() {
    try {
      // التحقق من وجود حساب المسؤول
      const adminEmail = 'admin@supermall.com';
      const existingAdmin = await this.findByEmail(adminEmail);
      
      if (!existingAdmin) {
        console.log('🔧 إنشاء حساب المسؤول الافتراضي...');
        
        // إنشاء حساب المسؤول
        const adminData = {
          username: 'admin',
          email: adminEmail,
          password: 'xx100100',  // كلمة المرور الافتراضية
          role: ROLES.ADMIN,
          is_active: true,
          is_email_verified: true
        };
        
        await this.create(adminData);
        console.log('✅ تم إنشاء حساب المسؤول بنجاح');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ خطأ في إنشاء حساب المسؤول:', error);
      throw error;
    }
  }
}

module.exports = {
  User,
  ROLES
};
