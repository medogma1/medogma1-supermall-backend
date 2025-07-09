// models/VendorBranch.js
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
    if (camelKey === 'address' || camelKey === 'location' || camelKey === 'workingHours' || camelKey === 'contactInfo') {
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
    if (snakeKey === 'address' || snakeKey === 'location' || snakeKey === 'working_hours' || snakeKey === 'contact_info') {
      acc[snakeKey] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    } else {
      acc[snakeKey] = value !== null && typeof value === 'object' ? camelToSnake(value) : value;
    }
    
    return acc;
  }, {});
}

class VendorBranch {
  // إنشاء فرع جديد
  static async create(branchData) {
    try {
      // التحقق من وجود البائع
      const vendor = await Vendor.findById(branchData.vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // التحقق من صحة البيانات
      this.validateBranchData(branchData);
      
      // تحويل البيانات إلى snake_case وإعداد الحقول JSON
      const data = camelToSnake({
        ...branchData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // إعداد استعلام الإدراج
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const query = `INSERT INTO vendor_branches (${fields}) VALUES (${placeholders})`;
      
      const [result] = await pool.execute(query, values);
      
      // استرجاع الفرع المدرج حديثًا
      return this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن فرع بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendor_branches WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن فروع بائع معين
  static async findByVendorId(vendorId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        isActive
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendor_branches WHERE vendor_id = ?';
      const params = [vendorId];
      
      // إضافة شروط التصفية
      if (isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive);
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      // الحصول على إجمالي عدد الفروع
      let countQuery = 'SELECT COUNT(*) as total FROM vendor_branches WHERE vendor_id = ?';
      const countParams = [vendorId];
      
      if (isActive !== undefined) {
        countQuery += ' AND is_active = ?';
        countParams.push(isActive);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const branches = rows.map(row => snakeToCamel(row));
      
      return {
        branches,
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
  
  // الحصول على قائمة الفروع مع خيارات التصفية والترتيب
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        isActive,
        vendorId,
        city,
        governorate
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendor_branches WHERE 1=1';
      const params = [];
      
      // إضافة شروط التصفية
      if (isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive);
      }
      
      if (vendorId) {
        query += ' AND vendor_id = ?';
        params.push(vendorId);
      }
      
      if (city) {
        query += ' AND city = ?';
        params.push(city);
      }
      
      if (governorate) {
        query += ' AND governorate = ?';
        params.push(governorate);
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      // الحصول على إجمالي عدد الفروع
      let countQuery = 'SELECT COUNT(*) as total FROM vendor_branches WHERE 1=1';
      const countParams = [];
      
      if (isActive !== undefined) {
        countQuery += ' AND is_active = ?';
        countParams.push(isActive);
      }
      
      if (vendorId) {
        countQuery += ' AND vendor_id = ?';
        countParams.push(vendorId);
      }
      
      if (city) {
        countQuery += ' AND city = ?';
        countParams.push(city);
      }
      
      if (governorate) {
        countQuery += ' AND governorate = ?';
        countParams.push(governorate);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const branches = rows.map(row => snakeToCamel(row));
      
      return {
        branches,
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
  
  // تحديث بيانات الفرع
  static async update(id, updateData) {
    try {
      // التحقق من وجود الفرع
      const branch = await this.findById(id);
      if (!branch) {
        throw new Error('Branch not found');
      }
      
      // تحويل البيانات إلى snake_case
      const data = camelToSnake({
        ...updateData,
        updatedAt: new Date()
      });
      
      // إعداد استعلام التحديث
      const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const query = `UPDATE vendor_branches SET ${setClause} WHERE id = ?`;
      
      await pool.execute(query, values);
      
      // استرجاع الفرع المحدث
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // حذف فرع
  static async delete(id) {
    try {
      // التحقق من وجود الفرع
      const branch = await this.findById(id);
      if (!branch) {
        throw new Error('Branch not found');
      }
      
      // حذف الفرع
      await pool.execute('DELETE FROM vendor_branches WHERE id = ?', [id]);
      
      return true;
    } catch (error) {
      throw error;
    }
  }
  
  // التحقق من صحة بيانات الفرع
  static validateBranchData(data) {
    // التحقق من الحقول المطلوبة
    if (!data.vendorId) {
      throw new Error('Vendor ID is required');
    }
    
    if (!data.name) {
      throw new Error('Branch name is required');
    }
    
    if (!data.address) {
      throw new Error('Branch address is required');
    }
    
    // التحقق من طول الحقول
    if (data.name && (data.name.length < 2 || data.name.length > 100)) {
      throw new Error('Branch name must be between 2 and 100 characters');
    }
    
    // التحقق من تنسيق الموقع الجغرافي
    if (data.location) {
      if (typeof data.location !== 'object') {
        throw new Error('Location must be an object');
      }
      
      if (data.location.latitude === undefined || data.location.longitude === undefined) {
        throw new Error('Location must have latitude and longitude');
      }
      
      if (isNaN(parseFloat(data.location.latitude)) || isNaN(parseFloat(data.location.longitude))) {
        throw new Error('Latitude and longitude must be valid numbers');
      }
    }
    
    return true;
  }
}

module.exports = VendorBranch;