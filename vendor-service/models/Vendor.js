// models/Vendor.js
const pool = require('../config/database');
const slugify = require('slugify');
// const { logger } = require('../../utils/logger');

// Constants
const EMAIL_REGEX = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
// استيراد دوال معالجة رقم الهاتف
const { cleanPhoneNumber, validatePhoneNumber } = require('../../utils/phoneUtils');

// تعبير منتظم محسن للتحقق من صحة رقم الهاتف (مصري ودولي)
const PHONE_REGEX = /^(\+[1-9]\d{1,14}|01[0125][0-9]{8})$/;
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
    return obj === undefined ? null : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    let value = obj[key];
    
    // تحويل undefined إلى null
    if (value === undefined) {
      value = null;
    }
    
    // معالجة التواريخ
    if (value instanceof Date) {
      acc[snakeKey] = value.toISOString().slice(0, 19).replace('T', ' ');
    }
    // تحويل الكائنات إلى JSON للتخزين
    else if (snakeKey === 'social_media' || snakeKey === 'address' || snakeKey === 'location' || 
        snakeKey === 'working_hours' || snakeKey === 'verification_documents' || snakeKey === 'bank_account_info') {
      acc[snakeKey] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    } else {
      acc[snakeKey] = value !== null && typeof value === 'object' && !(value instanceof Date) ? camelToSnake(value) : value;
    }
    
    return acc;
  }, {});
}

class Vendor {
  // تخزين آخر خطأ تحقق
  static _lastValidationError = null;
  
  // قائمة الحقول المسموحة في جدول vendors
  static getAllowedFields() {
    return [
      'user_id', 'name', 'email', 'phone', 'store_name', 'store_slug',
      'store_description', 'store_logo_url', 'contact_email', 'contact_phone',
      'store_address', 'workshop_address', 'store_settings_completed',
      'logo', 'banner', 'description', 'short_description', 'website',
      'social_media', 'business_type', 'business_category', 'tax_number',
      'commercial_register', 'country', 'governorate', 'address', 'location',
      'working_hours', 'verification_status', 'verification_documents',
      'verification_date', 'is_featured', 'is_active', 'rating', 'review_count',
      'commission_rate', 'balance', 'total_sales', 'total_orders',
      'created_at', 'updated_at', 'national_id',
      // حقول إدارة المتاجر الجديدة
      'status', 'is_approved', 'approved_at', 'certification_status', 
      'is_certified', 'certified_at', 'is_banned', 'banned_at', 'ban_reason'
    ];
  }
  
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
        const errorMessage = this._lastValidationError || 'Validation failed';
        const error = new Error(errorMessage);
        error.statusCode = 400;
        error.details = Array.isArray(validationErrors) ? validationErrors : [validationErrors || errorMessage];
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
      
      // إنشاء slug فريد من اسم المتجر مع التحقق من الفرادة
      const storeName = vendorData.storeName || vendorData.store_name || vendorData.name;
      const baseSlug = slugify(storeName, { lower: true, strict: true });
      const storeSlug = await this.generateUniqueSlug(baseSlug);
      console.log('Generated unique store slug:', storeSlug);
      
      // تحويل أي قيم undefined أو فارغة إلى null في vendorData أولاً
      Object.keys(vendorData).forEach(key => {
        if (vendorData[key] === undefined || vendorData[key] === '') {
          vendorData[key] = null;
        }
      });

      // تحويل البيانات إلى snake_case وإعداد الحقول JSON
      const data = camelToSnake({
        ...vendorData,
        storeSlug,
        // إضافة الحقول المطلوبة للتوافق مع الفرونت إند
        storeName: vendorData.storeName || vendorData.store_name || vendorData.name,
        storeDescription: vendorData.storeDescription || vendorData.description || '',
        storeLogoUrl: vendorData.storeLogoUrl || vendorData.logo || '',
        contactEmail: vendorData.contactEmail || vendorData.contact_email || vendorData.email,
        contactPhone: vendorData.contactPhone || vendorData.contact_phone || vendorData.phone,
        storeAddress: vendorData.storeAddress || vendorData.address || '',
        storeSettingsCompleted: vendorData.storeSettingsCompleted || false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // تحويل أي قيم undefined أو فارغة إلى null في data أيضاً
      Object.keys(data).forEach(key => {
        if (data[key] === undefined || data[key] === '') {
          data[key] = null;
        }
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
      
      // تصفية البيانات للحقول المسموحة فقط
      const allowedFields = this.getAllowedFields();
      const filteredData = {};
      
      Object.keys(data).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = data[key];
        } else {
          console.warn(`⚠️ [Vendor.create] Ignoring unauthorized field: ${key}`);
        }
      });
      
      console.log('🔍 [Vendor.create] Filtered data:', Object.keys(filteredData));
      
      // إعداد استعلام الإدراج
      const fields = Object.keys(filteredData).join(', ');
      const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
      // تحويل قيم undefined إلى null
      const values = Object.values(filteredData).map(value => value === undefined ? null : value);
      
      const query = `INSERT INTO vendors (${fields}) VALUES (${placeholders})`;
      console.log('SQL Query:', query);
      console.log('SQL Values:', JSON.stringify(values, null, 2));
      console.log('Values after undefined cleanup:', values.map((v, i) => `${Object.keys(data)[i]}: ${v === null ? 'NULL' : typeof v} = ${v}`));
      
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
      
      const finalResult = {
        vendors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
      
      console.log('Returning result with', vendors.length, 'vendors');
      return finalResult;
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
      // تحويل قيم undefined إلى null
      const values = [...Object.values(data).map(value => value === undefined ? null : value), id];
      
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
      
      // التحقق من وجود إما email أو contact_email
      if (!data.email && !data.contact_email && !data.contactEmail) {
        console.error('Error: email or contact_email is required');
        throw new Error('Email or contact_email is required');
      }
      
      // التحقق من تنسيق البريد الإلكتروني
      const emailToValidate = data.email || data.contact_email || data.contactEmail;
      if (emailToValidate && !EMAIL_REGEX.test(emailToValidate)) {
        console.error('Error: invalid email format');
        throw new Error('Invalid email format');
      }
      
      if (!data.phone) {
        console.error('Error: phone is required');
        throw new Error('Phone is required');
      }
      
      // تنظيف وتحقق من رقم الهاتف
      const cleanedPhone = cleanPhoneNumber(data.phone);
      if (!validatePhoneNumber(cleanedPhone)) {
        console.error('Error: invalid phone format');
        throw new Error('Invalid phone format');
      } else {
        // تحديث الرقم بالنسخة المنظفة
        data.phone = cleanedPhone;
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
      
      if (data.storeAddress && data.storeAddress.length > 500) {
        throw new Error('Store address cannot exceed 500 characters');
      }
      
      // التحقق من الحقول المطلوبة للفرونت إند (اختياري)
      // if (!data.storeName && !data.store_name) {
      //   throw new Error('Store name is required');
      // }
      
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
      
      // تنظيف وتحقق من رقم هاتف التواصل
      if (data.contactPhone && data.contactPhone !== '') {
        const cleanedContactPhone = cleanPhoneNumber(data.contactPhone);
        if (!validatePhoneNumber(cleanedContactPhone)) {
          throw new Error('Invalid contact phone format');
        } else {
          // تحديث الرقم بالنسخة المنظفة
          data.contactPhone = cleanedContactPhone;
        }
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
  
  // إنشاء slug فريد بالتحقق من قاعدة البيانات
  static async generateUniqueSlug(baseSlug) {
    try {
      let slug = baseSlug;
      let counter = 1;
      
      // التحقق من وجود slug في قاعدة البيانات
      while (await this.slugExists(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      
      return slug;
    } catch (error) {
      console.error('Error generating unique slug:', error);
      // في حالة الخطأ، نعيد slug مع timestamp لضمان الفرادة
      return `${baseSlug}-${Date.now()}`;
    }
  }
  
  // التحقق من وجود slug في قاعدة البيانات
  static async slugExists(slug) {
    try {
      const [rows] = await pool.execute('SELECT id FROM vendors WHERE store_slug = ?', [slug]);
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking slug existence:', error);
      return false;
    }
  }

  // جلب البائعين العامين (بدون مصادقة)
  static async getPublicVendors() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          id, 
          name,
          email,
          phone,
          store_name, 
          store_description, 
          store_logo_url,
          contact_phone,
          contact_email,
          store_address,
          country,
          governorate,
          is_approved,
          certification_status,
          is_certified,
          created_at
        FROM vendors 
        WHERE is_approved = 1 AND is_certified = 1
        ORDER BY created_at DESC
      `);
      return rows.map(row => snakeToCamel(row));
    } catch (error) {
      console.error('Error fetching public vendors:', error);
      throw error;
    }
  }

  // جلب جميع البائعين (للمدير)
  static async getAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM vendors 
        ORDER BY created_at DESC
      `);
      return rows.map(row => snakeToCamel(row));
    } catch (error) {
      console.error('Error fetching all vendors:', error);
      throw error;
    }
  }

  // تحديث حالة البائع
  static async updateStatus(id, status) {
    try {
      // تحويل active/inactive إلى 1/0 للحقل is_active
      const isActive = status === 'active' ? 1 : 0;
      
      const query = `
        UPDATE vendors 
        SET is_active = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(query, [isActive, id]);
      return result;
    } catch (error) {
      console.error('خطأ في تحديث حالة البائع:', error);
      throw error;
    }
  }

  // جلب إحصائيات البائعين
  static async getAnalytics() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_vendors,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_vendors,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_vendors,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_vendors,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_vendors_last_30_days
        FROM vendors
      `;
      
      const [rows] = await pool.execute(query);
      return rows[0];
    } catch (error) {
      console.error('خطأ في جلب إحصائيات البائعين:', error);
      throw error;
    }
  }

  // تحديث شعار البائع
  static async updateLogo(id, logoUrl) {
    try {
      const query = `
        UPDATE vendors 
        SET store_logo_url = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(query, [logoUrl, id]);
      return result;
    } catch (error) {
      console.error('خطأ في تحديث شعار البائع:', error);
      throw error;
    }
  }

  // جلب طلبات البائع
  static async getOrders(vendorId) {
    try {
      const query = `
        SELECT o.*, u.name as customer_name 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.vendor_id = ? 
        ORDER BY o.created_at DESC
      `;
      
      const [rows] = await pool.execute(query, [vendorId]);
      return rows;
    } catch (error) {
      console.error('خطأ في جلب طلبات البائع:', error);
      throw error;
    }
  }

  // جلب منتجات البائع
  static async getProducts(vendorId) {
    try {
      const query = `
        SELECT * FROM products 
        WHERE vendor_id = ? 
        ORDER BY created_at DESC
      `;
      
      const [rows] = await pool.execute(query, [vendorId]);
      return rows;
    } catch (error) {
      console.error('خطأ في جلب منتجات البائع:', error);
      throw error;
    }
  }

  // جلب تقييمات البائع
  static async getReviews(vendorId) {
    try {
      const query = `
        SELECT r.*, u.name as customer_name 
        FROM vendor_reviews r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.vendor_id = ? 
        ORDER BY r.created_at DESC
      `;
      
      const [rows] = await db.execute(query, [vendorId]);
      return rows;
    } catch (error) {
      console.error('خطأ في جلب تقييمات البائع:', error);
      throw error;
    }
  }

  // جلب لوحة تحكم البائع
  static async getDashboard(vendorId) {
    try {
      const [ordersCount] = await pool.execute('SELECT COUNT(*) as count FROM orders WHERE vendor_id = ?', [vendorId]);
      const [productsCount] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE vendor_id = ?', [vendorId]);
      const [revenue] = await pool.execute('SELECT SUM(total_amount) as total FROM orders WHERE vendor_id = ? AND status = "completed"', [vendorId]);
      
      return {
        orders_count: ordersCount[0].count,
        products_count: productsCount[0].count,
        total_revenue: revenue[0].total || 0
      };
    } catch (error) {
      console.error('خطأ في جلب لوحة تحكم البائع:', error);
      throw error;
    }
  }

  // ==================== المتاجر المميزة ====================

  // جلب المتاجر المميزة
  static async getFeaturedStores() {
    try {
      const query = `
        SELECT 
          fs.id,
          fs.store_id as storeId,
          fs.priority,
          fs.created_at,
          fs.updated_at,
          v.store_name as storeName,
          v.store_logo_url as storeLogoUrl,
          v.store_description as storeDescription,
          v.rating,
          v.is_verified,
          v.is_active
        FROM featured_stores fs
        JOIN vendors v ON fs.store_id = v.id
        WHERE v.is_active = 1
        ORDER BY fs.priority ASC, fs.created_at DESC
      `;
      
      const [rows] = await pool.execute(query);
      return rows.map(row => snakeToCamel(row));
    } catch (error) {
      console.error('خطأ في جلب المتاجر المميزة:', error);
      throw error;
    }
  }

  // إضافة متجر مميز
  static async addFeaturedStore(storeId, priority = null) {
    try {
      // التحقق من وجود المتجر
      const [vendor] = await pool.execute(
        'SELECT id, store_name FROM vendors WHERE id = ? AND is_active = 1',
        [storeId]
      );
      
      if (vendor.length === 0) {
        throw new Error('المتجر غير موجود أو غير نشط');
      }
      
      // التحقق من عدم وجود المتجر في المتاجر المميزة بالفعل
      const [existing] = await pool.execute(
        'SELECT id FROM featured_stores WHERE store_id = ?',
        [storeId]
      );
      
      if (existing.length > 0) {
        throw new Error('المتجر مميز بالفعل');
      }
      
      // تحديد الأولوية إذا لم يتم تمريرها
      if (priority === null) {
        const [maxPriority] = await pool.execute(
          'SELECT COALESCE(MAX(priority), 0) + 1 as next_priority FROM featured_stores'
        );
        priority = maxPriority[0].next_priority;
      }
      
      // إضافة المتجر إلى المتاجر المميزة
      const [result] = await pool.execute(
        'INSERT INTO featured_stores (store_id, priority, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [storeId, priority]
      );
      
      return {
        id: result.insertId,
        storeId: storeId,
        priority: priority,
        storeName: vendor[0].store_name
      };
    } catch (error) {
      console.error('خطأ في إضافة متجر مميز:', error);
      throw error;
    }
  }

  // تحديث متجر مميز
  static async updateFeaturedStore(id, updates) {
    try {
      const { priority } = updates;
      
      const [result] = await pool.execute(
        'UPDATE featured_stores SET priority = ?, updated_at = NOW() WHERE id = ?',
        [priority, id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('المتجر المميز غير موجود');
      }
      
      return { id, priority };
    } catch (error) {
      console.error('خطأ في تحديث متجر مميز:', error);
      throw error;
    }
  }

  // حذف متجر مميز
  static async removeFeaturedStore(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM featured_stores WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('المتجر المميز غير موجود');
      }
      
      return { id };
    } catch (error) {
      console.error('خطأ في حذف متجر مميز:', error);
      throw error;
    }
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
