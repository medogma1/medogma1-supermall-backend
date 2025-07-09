// models/Vendor.js
const { pool } = require('../config/database');
const slugify = require('slugify');

// Constants
const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const PHONE_REGEX = /^01[0125][0-9]{8}$/;
const NATIONAL_ID_REGEX = /^[2-3][0-9]{13}$/;
const MAX_DESCRIPTION_LENGTH = 1000;
const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|gif|svg)$/i;

// دالة مساعدة لتحويل snake_case إلى camelCase
function snakeToCamel(obj) {
  // إذا كان الكائن null أو undefined أو ليس كائنًا، أعد القيمة كما هي
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // إذا كان الكائن مصفوفة، طبق الدالة على كل عنصر
  if (Array.isArray(obj)) {
    return obj.map(item => item !== null && item !== undefined ? snakeToCamel(item) : item);
  }

  // تحويل الكائن من snake_case إلى camelCase
  try {
    return Object.keys(obj).reduce((acc, key) => {
      // تحويل اسم الخاصية من snake_case إلى camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      const value = obj[key];
      
      // تحويل القيم JSON إلى كائنات JavaScript
      if (camelKey === 'socialMedia' || camelKey === 'address' || camelKey === 'location' || 
          camelKey === 'workingHours' || camelKey === 'verificationDocuments' || camelKey === 'bankAccountInfo') {
        try {
          acc[camelKey] = typeof value === 'string' ? JSON.parse(value) : snakeToCamel(value);
        } catch (e) {
          acc[camelKey] = value;
        }
      } else {
        acc[camelKey] = value !== null && typeof value === 'object' ? snakeToCamel(value) : value;
      }
      
      return acc;
    }, {});
  } catch (error) {
    console.error('Error in snakeToCamel:', error);
    return obj; // إرجاع الكائن الأصلي في حالة حدوث خطأ
  }
}

// دالة مساعدة لتحويل camelCase إلى snake_case
function camelToSnake(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const value = obj[key];
    
    // تحويل الكائنات إلى JSON للتخزين
    if (snakeKey === 'social_media' || snakeKey === 'address' || snakeKey === 'location' || 
        snakeKey === 'working_hours' || snakeKey === 'verification_documents' || snakeKey === 'bank_account_info') {
      acc[snakeKey] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    } else {
      acc[snakeKey] = value !== null && typeof value === 'object' ? camelToSnake(value) : value;
    }
    
    return acc;
  }, {});
}

class Vendor {
  // تخزين آخر خطأ تحقق
  static _lastValidationError = null;
  // إنشاء بائع جديد
  static async create(vendorData) {
    try {
      console.log('Creating vendor with data:', JSON.stringify(vendorData, null, 2));
      
      // التأكد من أن user_id هو رقم
      if (vendorData.user_id) {
        if (typeof vendorData.user_id === 'string') {
          vendorData.user_id = parseInt(vendorData.user_id, 10);
          console.log('Converted user_id from string to number:', vendorData.user_id);
        }
        
        if (isNaN(vendorData.user_id)) {
          console.error('Error: user_id must be a valid number');
          const error = new Error('user_id must be a valid number');
          error.statusCode = 400;
          throw error;
        }
      } else {
        console.error('Error: user_id is required');
        const error = new Error('user_id is required');
        error.statusCode = 400;
        throw error;
      }
      
      // التحقق من صحة البيانات
      if (!this.validateVendorData(vendorData)) {
        console.error('Validation failed');
        const validationErrors = this.getValidationErrors(vendorData);
        const error = new Error('Validation failed');
        error.statusCode = 400;
        error.details = Array.isArray(validationErrors) ? validationErrors : [validationErrors || 'Unknown validation error'];
        throw error;
      }
      console.log('Vendor data validation passed');
      
      // التحقق من عدم وجود بائع بنفس user_id
      const existingVendor = await this.findByUserId(vendorData.user_id);
      if (existingVendor) {
        console.error(`Error: Vendor with user_id ${vendorData.user_id} already exists`);
        const error = new Error(`Vendor with user_id ${vendorData.user_id} already exists`);
        error.statusCode = 400;
        throw error;
      }
      
      // إنشاء slug من اسم المتجر
      const storeSlug = slugify(vendorData.storeName || vendorData.name, { lower: true, strict: true });
      console.log('Generated store slug:', storeSlug);
      
      // تحويل البيانات إلى snake_case وإعداد الحقول JSON
      const data = camelToSnake({
        ...vendorData,
        storeSlug,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Transformed data to snake_case:', JSON.stringify(data, null, 2));
      
      // التحقق من وجود الحقول المطلوبة
      const requiredFields = ['user_id', 'name', 'phone', 'business_type'];
      for (const field of requiredFields) {
        if (!data[field]) {
          console.error(`Error: ${field} is required`);
          const error = new Error(`${field} is required`);
          error.statusCode = 400;
          throw error;
        }
      }
      
      // التحقق من وجود إما email أو contact_email
      if (!data['email'] && !data['contact_email']) {
        console.error('Error: Either email or contact_email is required');
        const error = new Error('Either email or contact_email is required');
        error.statusCode = 400;
        throw error;
      }
      
      // إذا كان contact_email موجودًا ولكن email غير موجود، استخدم contact_email كـ email
      if (!data['email'] && data['contact_email']) {
        data['email'] = data['contact_email'];
        console.log('Using contact_email as email:', data['email']);
      }
      
      // إعداد استعلام الإدراج
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const query = `INSERT INTO vendors (${fields}) VALUES (${placeholders})`;
      console.log('SQL Query:', query);
      console.log('SQL Values:', JSON.stringify(values, null, 2));
      
      let result;
      try {
        [result] = await pool.execute(query, values);
        console.log('Insert result:', JSON.stringify(result, null, 2));
      } catch (sqlError) {
        console.error('SQL Error:', sqlError.message);
        console.error('SQL Error Stack:', sqlError.stack);
        
        // التحقق من أخطاء SQL المحددة
        if (sqlError.code === 'ER_DUP_ENTRY') {
          const error = new Error('Duplicate entry error');
          error.statusCode = 400;
          
          if (sqlError.message.includes('user_id')) {
            error.message = 'A vendor with this user ID already exists';
          } else if (sqlError.message.includes('email')) {
            error.message = 'A vendor with this email already exists';
          } else {
            error.message = sqlError.message;
          }
          
          throw error;
        }
        
        // إعداد خطأ SQL عام
        const error = new Error(sqlError.message || 'Database error');
        error.statusCode = 500;
        error.sqlError = true;
        throw error;
      }
      
      if (!result || !result.insertId) {
        console.error('Error: No insert ID returned');
        const error = new Error('Failed to create vendor - No insert ID returned');
        error.statusCode = 500;
        throw error;
      }
      
      // استرجاع البائع المدرج حديثًا
      const newVendor = await this.findById(result.insertId);
      if (!newVendor) {
        console.error('Error: Could not retrieve the newly created vendor');
        const error = new Error('Failed to retrieve the newly created vendor');
        error.statusCode = 500;
        throw error;
      }
      
      console.log('Retrieved new vendor:', JSON.stringify(newVendor, null, 2));
      return newVendor;
    } catch (error) {
      console.error('Error in create method:', error.message);
      console.error('Error stack:', error.stack);
      
      // إذا لم يكن للخطأ رمز حالة، نضيف رمز حالة 500
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      
      throw error;
    }
  }
  
  // البحث عن بائع بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendors WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن بائع بواسطة معرف المستخدم
  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendors WHERE user_id = ?', [userId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن بائع بواسطة البريد الإلكتروني
  static async findByEmail(email) {
    try {
      console.log(`Searching for vendor with email: ${email}`);
      
      // استخدام عمود contact_email بدلاً من email
      const [rows] = await pool.execute('SELECT * FROM vendors WHERE contact_email = ? OR email = ?', [email, email]);
      
      console.log(`Database query result:`, JSON.stringify(rows, null, 2));
      
      if (!rows || rows.length === 0) {
        console.log('No vendor found with this email');
        return null;
      }
      
      console.log('Found vendor, converting to camelCase');
      
      try {
        // تحويل البيانات من snake_case إلى camelCase
        const result = snakeToCamel(rows[0]);
        console.log('Conversion successful:', JSON.stringify(result, null, 2));
        return result;
      } catch (conversionError) {
        console.error('Error converting vendor data:', conversionError);
        // إرجاع البيانات الأصلية بدون تحويل في حالة حدوث خطأ
        return rows[0];
      }
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }
  
  // الحصول على قائمة البائعين مع خيارات التصفية والترتيب
  static async findAll(options = {}) {
    try {
      // تسجيل الخيارات المستلمة للتشخيص
      console.log('findAll called with options:', JSON.stringify(options, null, 2));
      
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        isActive,
        isVerified,
        isFeatured,
        businessType,
        search,
        is_active, // دعم الاسم البديل
        store_settings_completed // دعم الاسم البديل
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendors WHERE 1=1';
      const params = [];
      
      // إضافة شروط التصفية
      if (isActive !== undefined || is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive !== undefined ? isActive : is_active);
      }
      
      if (store_settings_completed !== undefined) {
        query += ' AND store_settings_completed = ?';
        params.push(store_settings_completed);
      }
      
      if (isVerified !== undefined) {
        query += ' AND verification_status = ?';
        params.push(isVerified ? 'verified' : 'pending');
      }
      
      if (isFeatured !== undefined) {
        query += ' AND is_featured = ?';
        params.push(isFeatured);
      }
      
      if (businessType) {
        query += ' AND business_type = ?';
        params.push(businessType);
      }
      
      if (search) {
        query += ' AND (store_name LIKE ? OR name LIKE ? OR email LIKE ? OR contact_email LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      console.log('Executing query:', query);
      console.log('With params:', params);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      console.log(`Query returned ${rows.length} rows`);
      
      // الحصول على إجمالي عدد البائعين
      let countQuery = 'SELECT COUNT(*) as total FROM vendors WHERE 1=1';
      const countParams = [];
      
      if (isActive !== undefined || is_active !== undefined) {
        countQuery += ' AND is_active = ?';
        countParams.push(isActive !== undefined ? isActive : is_active);
      }
      
      if (store_settings_completed !== undefined) {
        countQuery += ' AND store_settings_completed = ?';
        countParams.push(store_settings_completed);
      }
      
      if (isVerified !== undefined) {
        countQuery += ' AND verification_status = ?';
        countParams.push(isVerified ? 'verified' : 'pending');
      }
      
      if (isFeatured !== undefined) {
        countQuery += ' AND is_featured = ?';
        countParams.push(isFeatured);
      }
      
      if (businessType) {
        countQuery += ' AND business_type = ?';
        countParams.push(businessType);
      }
      
      if (search) {
        countQuery += ' AND (store_name LIKE ? OR name LIKE ? OR email LIKE ? OR contact_email LIKE ?)';
        const searchParam = `%${search}%`;
        countParams.push(searchParam, searchParam, searchParam, searchParam);
      }
      
      console.log('Executing count query:', countQuery);
      console.log('With count params:', countParams);
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      console.log('Total count:', total);
      
      // تحويل البيانات من snake_case إلى camelCase
      if (!Array.isArray(rows)) {
        console.error('Expected rows to be an array, but got:', typeof rows);
        throw new Error('Database returned invalid data format');
      }
      
      const vendors = rows.map(row => {
        try {
          return snakeToCamel(row);
        } catch (err) {
          console.error('Error converting row to camelCase:', err);
          console.error('Problematic row:', row);
          return row; // إرجاع الصف كما هو في حالة الخطأ
        }
      });
      
      const result = {
        vendors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
      
      console.log('Returning result with', vendors.length, 'vendors');
      return result;
    } catch (error) {
      console.error('Error in findAll method:', error);
      throw error;
    }
  }
  
  // تحديث بيانات البائع
  static async update(id, updateData) {
    try {
      // التحقق من وجود البائع
      const vendor = await this.findById(id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // تحويل البيانات إلى snake_case
      const data = camelToSnake({
        ...updateData,
        updatedAt: new Date()
      });
      
      // إعداد استعلام التحديث
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const query = `UPDATE vendors SET ${setClause} WHERE id = ?`;
      
      await pool.execute(query, values);
      
      // استرجاع البائع المحدث
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // حذف بائع
  static async delete(id) {
    try {
      // التحقق من وجود البائع
      const vendor = await this.findById(id);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // حذف البائع
      await pool.execute('DELETE FROM vendors WHERE id = ?', [id]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // تحديث تقييم البائع
  static async updateRating(id) {
    try {
      // حساب متوسط التقييم وعدد التقييمات
      const [ratingResult] = await pool.execute(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM vendor_ratings WHERE vendor_id = ? AND status = "approved"',
        [id]
      );
      
      const avgRating = ratingResult[0].avg_rating || 0;
      const reviewCount = ratingResult[0].count || 0;
      
      // تحديث تقييم البائع
      await pool.execute(
        'UPDATE vendors SET rating = ?, review_count = ? WHERE id = ?',
        [avgRating, reviewCount, id]
      );
      
      return { rating: avgRating, reviewCount };
    } catch (error) {
      throw error;
    }
  }
  
  // التحقق من صحة بيانات البائع
  static validateVendorData(data) {
    console.log('Validating vendor data:', JSON.stringify(data, null, 2));
    
    try {
      // التحقق من وجود user_id
      if (!data.user_id) {
        console.error('Error: user_id is required');
        throw new Error('user_id is required');
      }
      
      // التحقق من أن user_id هو رقم
      if (isNaN(Number(data.user_id))) {
        console.error('Error: user_id must be a number');
        throw new Error('user_id must be a number');
      }
      
      // التحقق من الحقول المطلوبة
      if (!data.name) {
        console.error('Error: name is required');
        throw new Error('Name is required');
      }
      
      if (!data.email) {
        console.error('Error: email is required');
        throw new Error('Email is required');
      }
      
      if (!EMAIL_REGEX.test(data.email)) {
        console.error('Error: invalid email format');
        throw new Error('Invalid email format');
      }
      
      if (!data.phone) {
        console.error('Error: phone is required');
        throw new Error('Phone is required');
      }
      
      if (!PHONE_REGEX.test(data.phone)) {
        console.error('Error: invalid phone format');
        throw new Error('Invalid phone format');
      }
      
      // التحقق من وجود business_type
      if (!data.business_type && !data.businessType) {
        console.error('Error: business_type is required');
        throw new Error('business_type is required');
      }
      
      // التحقق من طول الحقول
      if (data.name && (data.name.length < 2 || data.name.length > 100)) {
        throw new Error('Name must be between 2 and 100 characters');
      }
      
      if (data.storeName && data.storeName.length > 100) {
        throw new Error('Store name cannot exceed 100 characters');
      }
      
      if (data.storeDescription && data.storeDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Store description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      }
      
      if (data.storeAddress && data.storeAddress.length > 200) {
        throw new Error('Store address cannot exceed 200 characters');
      }
      
      // التحقق من تنسيق الصور
      if (data.storeLogoUrl && data.storeLogoUrl !== '' && !IMAGE_URL_REGEX.test(data.storeLogoUrl)) {
        throw new Error('Invalid store logo URL format');
      }
      
      if (data.logoUrl && data.logoUrl !== '' && !IMAGE_URL_REGEX.test(data.logoUrl)) {
        throw new Error('Invalid logo URL format');
      }
      
      // التحقق من البريد الإلكتروني للاتصال
      if (data.contactEmail && data.contactEmail !== '' && !EMAIL_REGEX.test(data.contactEmail)) {
        throw new Error('Invalid contact email format');
      }
      
      // التحقق من رقم الهاتف للاتصال
      if (data.contactPhone && data.contactPhone !== '' && !PHONE_REGEX.test(data.contactPhone)) {
        throw new Error('Invalid contact phone format');
      }
      
      // التحقق من الرقم القومي
      if (data.nationalId && data.nationalId !== '' && !NATIONAL_ID_REGEX.test(data.nationalId)) {
        throw new Error('Invalid national ID format');
      }
      
      console.log('Vendor data validation passed');
      return true;
    } catch (error) {
      console.error('Validation error:', error.message);
      // تخزين رسالة الخطأ لاستخدامها في getValidationErrors
      this._lastValidationError = error.message;
      return false;
    }
  }
  
  // الحصول على أخطاء التحقق من الصحة
  static getValidationErrors(data) {
    try {
      // تنفيذ التحقق من الصحة
      const isValid = this.validateVendorData(data);
      
      // إذا كانت البيانات صحيحة، نعيد مصفوفة فارغة
      if (isValid) {
        return [];
      }
      
      // التأكد من أن this._lastValidationError موجود، وإلا نعيد مصفوفة تحتوي على رسالة خطأ افتراضية
      return this._lastValidationError ? [this._lastValidationError] : ['Unknown validation error'];
    } catch (error) {
      // في حالة حدوث خطأ غير متوقع، نعيد مصفوفة تحتوي على رسالة الخطأ
      console.error('Unexpected error in getValidationErrors:', error);
      return [error.message || 'Unexpected validation error'];
    }
  }
  
  // دوال مساعدة للتحقق من حالة البائع
  static isVerified(vendor) {
    return vendor.verificationStatus === 'verified';
  }
  
  static isPending(vendor) {
    return vendor.verificationStatus === 'pending';
  }
  
  static isRejected(vendor) {
    return vendor.verificationStatus === 'rejected';
  }
  
  static hasCompleteProfile(vendor) {
    return !!vendor.storeName && !!vendor.storeDescription && !!vendor.storeAddress && vendor.storeSettingsCompleted;
  }
  
  static getVerificationStatusText(vendor) {
    switch(vendor.verificationStatus) {
      case 'pending': return 'Pending Verification';
      case 'verified': return 'Verified';
      case 'rejected': return 'Verification Rejected';
      default: return 'Unknown';
    }
  }
  
  static getBusinessTypeText(vendor) {
    switch(vendor.businessType) {
      case 'individual': return 'Individual';
      case 'company': return 'Company';
      case 'partnership': return 'Partnership';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  }
  
  // الحصول على معلومات الاتصال الكاملة
  static getFullContactInfo(vendor) {
    return {
      name: vendor.name,
      email: vendor.contactEmail || vendor.email,
      phone: vendor.contactPhone || vendor.phone,
      address: vendor.storeAddress
    };
  }
}

module.exports = {
  Vendor,
  constants: {
    EMAIL_REGEX,
    PHONE_REGEX,
    NATIONAL_ID_REGEX,
    MAX_DESCRIPTION_LENGTH
  }
};
