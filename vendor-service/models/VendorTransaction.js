// models/VendorTransaction.js
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
    if (camelKey === 'metadata' || camelKey === 'orderDetails') {
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
    if (snakeKey === 'metadata' || snakeKey === 'order_details') {
      acc[snakeKey] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    } else {
      acc[snakeKey] = value !== null && typeof value === 'object' ? camelToSnake(value) : value;
    }
    
    return acc;
  }, {});
}

class VendorTransaction {
  // إنشاء معاملة جديدة
  static async create(transactionData) {
    try {
      // التحقق من وجود البائع
      const vendor = await Vendor.findById(transactionData.vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // التحقق من صحة البيانات
      this.validateTransactionData(transactionData);
      
      // تحويل البيانات إلى snake_case وإعداد الحقول JSON
      const data = camelToSnake({
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // إعداد استعلام الإدراج
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      // تحويل قيم undefined إلى null
      const values = Object.values(data).map(value => value === undefined ? null : value);
      
      const query = `INSERT INTO vendor_transactions (${fields}) VALUES (${placeholders})`;
      
      const [result] = await pool.execute(query, values);
      
      // استرجاع المعاملة المدرجة حديثًا
      return this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن معاملة بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendor_transactions WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن معاملة بواسطة رقم المرجع
  static async findByReferenceNumber(referenceNumber) {
    try {
      const [rows] = await pool.execute('SELECT * FROM vendor_transactions WHERE reference_number = ?', [referenceNumber]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن معاملات بائع معين
  static async findByVendorId(vendorId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        transactionType,
        status,
        startDate,
        endDate
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendor_transactions WHERE vendor_id = ?';
      const params = [vendorId];
      
      // إضافة شروط التصفية
      if (transactionType) {
        query += ' AND transaction_type = ?';
        params.push(transactionType);
      }
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(new Date(startDate));
      }
      
      if (endDate) {
        query += ' AND created_at <= ?';
        params.push(new Date(endDate));
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      // الحصول على إجمالي عدد المعاملات
      let countQuery = 'SELECT COUNT(*) as total FROM vendor_transactions WHERE vendor_id = ?';
      const countParams = [vendorId];
      
      if (transactionType) {
        countQuery += ' AND transaction_type = ?';
        countParams.push(transactionType);
      }
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (startDate) {
        countQuery += ' AND created_at >= ?';
        countParams.push(new Date(startDate));
      }
      
      if (endDate) {
        countQuery += ' AND created_at <= ?';
        countParams.push(new Date(endDate));
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const transactions = rows.map(row => snakeToCamel(row));
      
      return {
        transactions,
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
  
  // الحصول على قائمة المعاملات مع خيارات التصفية والترتيب
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        vendorId,
        transactionType,
        status,
        startDate,
        endDate
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM vendor_transactions WHERE 1=1';
      const params = [];
      
      // إضافة شروط التصفية
      if (vendorId) {
        query += ' AND vendor_id = ?';
        params.push(vendorId);
      }
      
      if (transactionType) {
        query += ' AND transaction_type = ?';
        params.push(transactionType);
      }
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      if (startDate) {
        query += ' AND created_at >= ?';
        params.push(new Date(startDate));
      }
      
      if (endDate) {
        query += ' AND created_at <= ?';
        params.push(new Date(endDate));
      }
      
      // إضافة الترتيب
      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      
      // إضافة الصفحات
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      // تنفيذ الاستعلام
      const [rows] = await pool.execute(query, params);
      
      // الحصول على إجمالي عدد المعاملات
      let countQuery = 'SELECT COUNT(*) as total FROM vendor_transactions WHERE 1=1';
      const countParams = [];
      
      if (vendorId) {
        countQuery += ' AND vendor_id = ?';
        countParams.push(vendorId);
      }
      
      if (transactionType) {
        countQuery += ' AND transaction_type = ?';
        countParams.push(transactionType);
      }
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      if (startDate) {
        countQuery += ' AND created_at >= ?';
        countParams.push(new Date(startDate));
      }
      
      if (endDate) {
        countQuery += ' AND created_at <= ?';
        countParams.push(new Date(endDate));
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const transactions = rows.map(row => snakeToCamel(row));
      
      return {
        transactions,
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
  
  // تحديث حالة المعاملة
  static async updateStatus(id, status, notes = null) {
    try {
      // التحقق من وجود المعاملة
      const transaction = await this.findById(id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // تحديث حالة المعاملة
      const query = 'UPDATE vendor_transactions SET status = ?, notes = ?, updated_at = ? WHERE id = ?';
      const values = [status, notes, new Date(), id];
      
      await pool.execute(query, values);
      
      // استرجاع المعاملة المحدثة
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // حساب إجمالي المعاملات لبائع معين
  static async calculateVendorBalance(vendorId) {
    try {
      // التحقق من وجود البائع
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // حساب إجمالي المبالغ المستحقة (الإيرادات)
      const [earningsResult] = await pool.execute(
        'SELECT SUM(amount) as total FROM vendor_transactions WHERE vendor_id = ? AND transaction_type = "earning" AND status = "completed"',
        [vendorId]
      );
      
      // حساب إجمالي المبالغ المسحوبة (السحوبات)
      const [withdrawalsResult] = await pool.execute(
        'SELECT SUM(amount) as total FROM vendor_transactions WHERE vendor_id = ? AND transaction_type = "withdrawal" AND status = "completed"',
        [vendorId]
      );
      
      const totalEarnings = earningsResult[0].total || 0;
      const totalWithdrawals = withdrawalsResult[0].total || 0;
      
      // حساب الرصيد المتاح
      const availableBalance = totalEarnings - totalWithdrawals;
      
      return {
        totalEarnings,
        totalWithdrawals,
        availableBalance
      };
    } catch (error) {
      throw error;
    }
  }
  
  // التحقق من صحة بيانات المعاملة
  static validateTransactionData(data) {
    // التحقق من الحقول المطلوبة
    if (!data.vendorId) {
      throw new Error('Vendor ID is required');
    }
    
    if (!data.amount) {
      throw new Error('Amount is required');
    }
    
    if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) <= 0) {
      throw new Error('Amount must be a positive number');
    }
    
    if (!data.transactionType) {
      throw new Error('Transaction type is required');
    }
    
    if (!['earning', 'withdrawal', 'refund', 'fee'].includes(data.transactionType)) {
      throw new Error('Invalid transaction type');
    }
    
    if (!data.status) {
      throw new Error('Status is required');
    }
    
    if (!['pending', 'completed', 'failed', 'cancelled'].includes(data.status)) {
      throw new Error('Invalid status');
    }
    
    return true;
  }
}

module.exports = VendorTransaction;