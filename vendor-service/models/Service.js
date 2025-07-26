// vendor-service/models/Service.js
const db = require('../config/database');
// const { logger } = require('../../utils/logger');

// تعريف الثوابت
const MIN_PRICE = 0.0;
const MAX_PRICE = 1000000.0;
const MAX_TAGS = 10;
const DEFAULT_CURRENCY = 'EGP';
const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP'];
const SUPPORTED_TYPES = ['repair', 'maintenance', 'installation', 'consultation', 'other'];
const SUPPORTED_STATUSES = ['active', 'inactive', 'pending', 'rejected'];

class Service {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.currency = data.currency || DEFAULT_CURRENCY;
    this.type = data.type;
    this.status = data.status || 'pending';
    this.vendor_id = data.vendor_id;
    this.vendor_name = data.vendor_name;
    this.image_url = data.image_url || null;
    this.additional_images = data.additional_images || [];
    this.tags = data.tags || [];
    this.category_id = data.category_id;
    this.category_name = data.category_name;
    this.rating = data.rating || 0.0;
    this.review_count = data.review_count || 0;
    this.is_available = data.is_available !== undefined ? data.is_available : true;
    this.is_featured = data.is_featured || false;
    this.specifications = data.specifications || {};
    this.requirements = data.requirements || {};
    this.available_start_time = data.available_start_time || null;
    this.available_end_time = data.available_end_time || null;
    this.estimated_duration = data.estimated_duration || 60;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // التحقق من صحة البيانات
  static validate(data) {
    const errors = [];

    // التحقق من الحقول المطلوبة
    if (!data.name) errors.push('اسم الخدمة مطلوب');
    if (!data.description) errors.push('وصف الخدمة مطلوب');
    if (data.price === undefined) errors.push('سعر الخدمة مطلوب');
    if (!data.type) errors.push('نوع الخدمة مطلوب');
    if (!data.vendor_id) errors.push('معرف البائع مطلوب');
    if (!data.vendor_name) errors.push('اسم البائع مطلوب');
    if (!data.category_id) errors.push('معرف الفئة مطلوب');
    if (!data.category_name) errors.push('اسم الفئة مطلوب');

    // التحقق من صحة القيم
    if (data.price !== undefined && (data.price < MIN_PRICE || data.price > MAX_PRICE)) {
      errors.push(`السعر يجب أن يكون بين ${MIN_PRICE} و ${MAX_PRICE}`);
    }

    if (data.currency && !SUPPORTED_CURRENCIES.includes(data.currency)) {
      errors.push(`العملة غير مدعومة. العملات المدعومة هي: ${SUPPORTED_CURRENCIES.join(', ')}`);
    }

    if (data.type && !SUPPORTED_TYPES.includes(data.type)) {
      errors.push(`نوع الخدمة غير مدعوم. الأنواع المدعومة هي: ${SUPPORTED_TYPES.join(', ')}`);
    }

    if (data.status && !SUPPORTED_STATUSES.includes(data.status)) {
      errors.push(`حالة الخدمة غير صالحة. الحالات المدعومة هي: ${SUPPORTED_STATUSES.join(', ')}`);
    }

    if (data.tags && data.tags.length > MAX_TAGS) {
      errors.push(`عدد الكلمات المفتاحية يجب أن لا يتجاوز ${MAX_TAGS}`);
    }

    if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
      errors.push('التقييم يجب أن يكون بين 0 و 5');
    }

    if (data.review_count !== undefined && data.review_count < 0) {
      errors.push('عدد المراجعات يجب أن يكون 0 أو أكثر');
    }

    if (data.estimated_duration !== undefined && data.estimated_duration < 1) {
      errors.push('المدة المقدرة يجب أن تكون 1 دقيقة أو أكثر');
    }

    // التحقق من أوقات التوفر
    if (data.available_start_time && data.available_end_time) {
      const startTime = new Date(data.available_start_time);
      const endTime = new Date(data.available_end_time);
      if (endTime < startTime) {
        errors.push('وقت النهاية يجب أن يكون بعد وقت البداية');
      }
    }

    return errors;
  }

  // تحويل البيانات من camelCase إلى snake_case للتخزين في قاعدة البيانات
  static toSnakeCase(data) {
    const snakeCaseData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        let value = data[key];
        
        // تحويل المصفوفات والكائنات إلى JSON
        if (Array.isArray(value) || (typeof value === 'object' && value !== null && !(value instanceof Date))) {
          value = JSON.stringify(value);
        }
        
        snakeCaseData[snakeKey] = value;
      }
    }
    return snakeCaseData;
  }

  // تحويل البيانات من snake_case إلى camelCase للاستخدام في التطبيق
  static toCamelCase(data) {
    const camelCaseData = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        let value = data[key];
        
        // تحويل النصوص JSON إلى كائنات أو مصفوفات
        if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
          try {
            value = JSON.parse(value);
          } catch (error) {
            // إذا فشل التحويل، احتفظ بالقيمة كما هي
          }
        }
        
        camelCaseData[camelKey] = value;
      }
    }
    return camelCaseData;
  }

  // إنشاء خدمة جديدة
  static async create(serviceData) {
    try {
      // التحقق من صحة البيانات
      const validationErrors = this.validate(serviceData);
      if (validationErrors.length > 0) {
        throw new Error(`خطأ في التحقق من البيانات: ${validationErrors.join(', ')}`);
      }

      // تحويل البيانات إلى snake_case
      const dbData = this.toSnakeCase(serviceData);
      
      // إضافة طوابع الوقت
      const now = new Date();
      dbData.created_at = now;
      dbData.updated_at = now;

      // إنشاء استعلام SQL
      const fields = Object.keys(dbData).join(', ');
      const placeholders = Object.keys(dbData).map(() => '?').join(', ');
      const values = Object.values(dbData);

      // تحويل قيم undefined إلى null
      const cleanValues = values.map(value => value === undefined ? null : value);

      const [result] = await db.execute(
        `INSERT INTO services (${fields}) VALUES (${placeholders})`,
        cleanValues
      );

      // استرجاع الخدمة المنشأة
      const [rows] = await db.execute('SELECT * FROM services WHERE id = ?', [result.insertId]);
      return new Service(this.toCamelCase(rows[0]));
    } catch (error) {
      console.error('خطأ في إنشاء خدمة جديدة:', error);
      throw error;
    }
  }

  // البحث عن خدمة بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM services WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      return new Service(this.toCamelCase(rows[0]));
    } catch (error) {
      console.error(`خطأ في البحث عن خدمة بالمعرف ${id}:`, error);
      throw error;
    }
  }

  // البحث عن خدمات بناءً على معايير محددة
  static async find(criteria = {}) {
    try {
      let query = 'SELECT * FROM services';
      const values = [];
      const conditions = [];

      // بناء شروط البحث
      for (const [key, value] of Object.entries(criteria)) {
        if (value !== undefined) {
          conditions.push(`${key} = ?`);
          values.push(value);
        }
      }

      // إضافة الشروط إلى الاستعلام إذا وجدت
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // تحويل قيم undefined إلى null
      const cleanValues = values.map(value => value === undefined ? null : value);
      const [rows] = await db.execute(query, cleanValues);
      return rows.map(row => new Service(this.toCamelCase(row)));
    } catch (error) {
      console.error('خطأ في البحث عن الخدمات:', error);
      throw error;
    }
  }

  // تحديث خدمة
  static async update(id, updateData) {
    try {
      // التحقق من وجود الخدمة
      const service = await this.findById(id);
      if (!service) {
        throw new Error('الخدمة غير موجودة');
      }

      // تحويل البيانات إلى snake_case
      const dbData = this.toSnakeCase(updateData);
      
      // إضافة طابع الوقت للتحديث
      dbData.updated_at = new Date();

      // بناء استعلام التحديث
      const setClause = Object.keys(dbData).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(dbData), id];

      // تحويل قيم undefined إلى null
      const cleanValues = values.map(value => value === undefined ? null : value);
      
      await db.execute(
        `UPDATE services SET ${setClause} WHERE id = ?`,
        cleanValues
      );

      // استرجاع الخدمة المحدثة
      return await this.findById(id);
    } catch (error) {
      console.error(`خطأ في تحديث الخدمة بالمعرف ${id}:`, error);
      throw error;
    }
  }

  // حذف خدمة
  static async delete(id) {
    try {
      // التحقق من وجود الخدمة
      const service = await this.findById(id);
      if (!service) {
        throw new Error('الخدمة غير موجودة');
      }

      await db.execute('DELETE FROM services WHERE id = ?', [id]);
      return service;
    } catch (error) {
      console.error(`خطأ في حذف الخدمة بالمعرف ${id}:`, error);
      throw error;
    }
  }

  // البحث عن خدمات بائع معين
  static async findByVendorId(vendorId, status = null) {
    try {
      let query = 'SELECT * FROM services WHERE vendor_id = ?';
      const values = [vendorId];

      if (status) {
        query += ' AND status = ?';
        values.push(status);
      }

      // تحويل قيم undefined إلى null
      const cleanValues = values.map(value => value === undefined ? null : value);
      const [rows] = await db.execute(query, cleanValues);
      return rows.map(row => new Service(this.toCamelCase(row)));
    } catch (error) {
      console.error(`خطأ في البحث عن خدمات البائع ${vendorId}:`, error);
      throw error;
    }
  }

  // البحث عن الخدمات المميزة
  static async findFeatured(limit = 10) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM services WHERE is_featured = ? AND status = ? AND is_available = ? LIMIT ?',
        [true, 'active', true, limit]
      );
      return rows.map(row => new Service(this.toCamelCase(row)));
    } catch (error) {
      console.error('خطأ في البحث عن الخدمات المميزة:', error);
      throw error;
    }
  }

  // البحث عن الخدمات بالنص
  static async search(searchParams) {
    try {
      const { query, category, type, minPrice, maxPrice } = searchParams;
      let sqlQuery = 'SELECT * FROM services WHERE status = ? AND is_available = ?';
      const values = ['active', true];

      // البحث بالنص
      if (query) {
        sqlQuery += ' AND (name LIKE ? OR description LIKE ? OR JSON_SEARCH(tags, "one", ?) IS NOT NULL)';
        const searchTerm = `%${query}%`;
        values.push(searchTerm, searchTerm, query);
      }

      // فلترة حسب الفئة
      if (category) {
        sqlQuery += ' AND category_id = ?';
        values.push(category);
      }

      // فلترة حسب النوع
      if (type) {
        sqlQuery += ' AND type = ?';
        values.push(type);
      }

      // فلترة حسب السعر
      if (minPrice !== undefined) {
        sqlQuery += ' AND price >= ?';
        values.push(parseFloat(minPrice));
      }

      if (maxPrice !== undefined) {
        sqlQuery += ' AND price <= ?';
        values.push(parseFloat(maxPrice));
      }

      // تحويل قيم undefined إلى null
      const cleanValues = values.map(value => value === undefined ? null : value);
      const [rows] = await db.execute(sqlQuery, cleanValues);
      return rows.map(row => new Service(this.toCamelCase(row)));
    } catch (error) {
      console.error('خطأ في البحث عن الخدمات:', error);
      throw error;
    }
  }

  // تحديث تقييم الخدمة
  static async updateRating(id, rating, reviewCount) {
    try {
      await db.execute(
        'UPDATE services SET rating = ?, review_count = ?, updated_at = ? WHERE id = ?',
        [rating, reviewCount, new Date(), id]
      );
      return await this.findById(id);
    } catch (error) {
      console.error(`خطأ في تحديث تقييم الخدمة ${id}:`, error);
      throw error;
    }
  }

  // طرق مساعدة
  isCurrentlyAvailable() {
    if (!this.is_available || this.status !== 'active') return false;
    if (!this.available_start_time || !this.available_end_time) return true;

    const now = new Date();
    return now > new Date(this.available_start_time) && now < new Date(this.available_end_time);
  }

  getTypeText() {
    const typeMap = {
      'repair': 'إصلاح',
      'maintenance': 'صيانة',
      'installation': 'تركيب',
      'consultation': 'استشارة',
      'other': 'أخرى'
    };
    return typeMap[this.type] || 'أخرى';
  }

  getStatusText() {
    const statusMap = {
      'active': 'نشط',
      'inactive': 'غير نشط',
      'pending': 'قيد المراجعة',
      'rejected': 'مرفوض'
    };
    return statusMap[this.status] || 'قيد المراجعة';
  }

  getFormattedDuration() {
    if (this.estimated_duration < 60) {
      return `${this.estimated_duration} دقيقة`;
    } else {
      const hours = Math.floor(this.estimated_duration / 60);
      const minutes = this.estimated_duration % 60;
      if (minutes === 0) {
        return `${hours} ساعة`;
      } else {
        return `${hours} ساعة و ${minutes} دقيقة`;
      }
    }
  }
}

module.exports = Service;