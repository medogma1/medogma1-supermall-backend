// models/VendorRating.js
const { pool } = require('../config/database');
const { Vendor } = require('./Vendor');

// دالة مساعدة لتحويل snake_case إلى camelCase
function snakeToCamel(obj) {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = obj[key];
    
    // تحويل القيم JSON إلى كائنات JavaScript
    if (camelKey === 'metadata') {
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
    if (snakeKey === 'metadata') {
      acc[snakeKey] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    } else {
      acc[snakeKey] = value !== null && typeof value === 'object' ? camelToSnake(value) : value;
    }
    
    return acc;
  }, {});
}

class VendorRating {
  // إنشاء تقييم جديد
  static async create(ratingData) {
    try {
      // التحقق من وجود البائع
      const vendor = await Vendor.findById(ratingData.vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // التحقق من صحة البيانات
      this.validateRatingData(ratingData);
      
      // التحقق من عدم وجود تقييم سابق من نفس المستخدم
      const existingRating = await this.findByUserAndVendor(ratingData.userId, ratingData.vendorId);
      if (existingRating) {
        throw new Error('User has already rated this vendor');
      }
      
      // تحويل البيانات إلى snake_case وإعداد الحقول JSON
      const data = camelToSnake({
        ...ratingData,
        status: ratingData.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // إعداد استعلام الإدراج
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const query = `INSERT INTO vendor_ratings (${fields}) VALUES (${placeholders})`;
      
      const [result] = await pool.execute(query, values);
      
      // تحديث متوسط تقييم البائع إذا كانت حالة التقييم معتمدة
      if (data.status === 'approved') {
        await Vendor.updateRating(data.vendor_id);
      }
      
      // استرجاع التقييم المدرج حديثًا
      return this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن تقييم بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendor_ratings WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن تقييم بواسطة المستخدم والبائع
  static async findByUserAndVendor(userId, vendorId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendor_ratings WHERE user_id = ? AND vendor_id = ?', [userId, vendorId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن تقييمات بائع معين
  static async findByVendorId(vendorId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        status
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendor_ratings WHERE vendor_id = ?';
      const params = [vendorId];
      
      // إضافة شروط التصفية
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      // الحصول على إجمالي عدد التقييمات
      let countQuery = 'SELECT COUNT(*) as total FROM vendor_ratings WHERE vendor_id = ?';
      const countParams = [vendorId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const ratings = rows.map(row => snakeToCamel(row));
      
      return {
        ratings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // الحصول على قائمة التقييمات مع خيارات التصفية والترتيب
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        vendorId,
        userId,
        status,
        minRating,
        maxRating
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendor_ratings WHERE 1=1';
      const params = [];
      
      // إضافة شروط التصفية
      if (vendorId) {
        query += ' AND vendor_id = ?';
        params.push(vendorId);
      }
      
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      if (minRating !== undefined) {
        query += ' AND rating >= ?';
        params.push(minRating);
      }
      
      if (maxRating !== undefined) {
        query += ' AND rating <= ?';
        params.push(maxRating);
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      // الحصول على إجمالي عدد التقييمات
      let countQuery = 'SELECT COUNT(*) as total FROM vendor_ratings WHERE 1=1';
      const countParams = [];
      
      if (vendorId) {
        countQuery += ' AND vendor_id = ?';
        countParams.push(vendorId);
      }
      
      if (userId) {
        countQuery += ' AND user_id = ?';
        countParams.push(userId);
      }
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (minRating !== undefined) {
        countQuery += ' AND rating >= ?';
        countParams.push(minRating);
      }
      
      if (maxRating !== undefined) {
        countQuery += ' AND rating <= ?';
        countParams.push(maxRating);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const ratings = rows.map(row => snakeToCamel(row));
      
      return {
        ratings,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // تحديث حالة التقييم
  static async updateStatus(id, status) {
    try {
      // التحقق من وجود التقييم
      const rating = await this.findById(id);
      if (!rating) {
        throw new Error('Rating not found');
      }
      
      // التحقق من صحة الحالة
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        throw new Error('Invalid status');
      }
      
      // تحديث حالة التقييم
      const query = 'UPDATE vendor_ratings SET status = ?, updated_at = ? WHERE id = ?';
      const values = [status, new Date(), id];
      
      await pool.execute(query, values);
      
      // تحديث متوسط تقييم البائع
      const updatedRating = await this.findById(id);
      await Vendor.updateRating(updatedRating.vendorId);
      
      // استرجاع التقييم المحدث
      return updatedRating;
    } catch (error) {
      throw error;
    }
  }
  
  // تحديث تقييم
  static async update(id, updateData) {
    try {
      // التحقق من وجود التقييم
      const rating = await this.findById(id);
      if (!rating) {
        throw new Error('Rating not found');
      }
      
      // التحقق من صحة البيانات
      if (updateData.rating) {
        if (isNaN(parseFloat(updateData.rating)) || parseFloat(updateData.rating) < 1 || parseFloat(updateData.rating) > 5) {
          throw new Error('Rating must be a number between 1 and 5');
        }
      }
      
      // تحويل البيانات إلى snake_case
      const data = camelToSnake({
        ...updateData,
        updatedAt: new Date()
      });
      
      // إعداد استعلام التحديث
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const query = `UPDATE vendor_ratings SET ${setClause} WHERE id = ?`;
      
      await pool.execute(query, values);
      
      // تحديث متوسط تقييم البائع إذا تم تغيير التقييم أو الحالة
      if (updateData.rating || updateData.status) {
        const updatedRating = await this.findById(id);
        await Vendor.updateRating(updatedRating.vendorId);
      }
      
      // استرجاع التقييم المحدث
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // حذف تقييم
  static async delete(id) {
    try {
      // التحقق من وجود التقييم
      const rating = await this.findById(id);
      if (!rating) {
        throw new Error('Rating not found');
      }
      
      // حذف التقييم
      await pool.execute('DELETE FROM vendor_ratings WHERE id = ?', [id]);
      
      // تحديث متوسط تقييم البائع
      await Vendor.updateRating(rating.vendorId);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // التحقق من صحة بيانات التقييم
  static validateRatingData(data) {
    // التحقق من الحقول المطلوبة
    if (!data.vendorId) {
      throw new Error('Vendor ID is required');
    }
    
    if (!data.userId) {
      throw new Error('User ID is required');
    }
    
    if (!data.rating) {
      throw new Error('Rating is required');
    }
    
    // التحقق من قيمة التقييم
    if (isNaN(parseFloat(data.rating)) || parseFloat(data.rating) < 1 || parseFloat(data.rating) > 5) {
      throw new Error('Rating must be a number between 1 and 5');
    }
    
    return true;
  }
}

module.exports = VendorRating;