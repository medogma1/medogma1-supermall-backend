// models/WithdrawalRequest.js
const { pool } = require('../config/database');
const { Vendor } = require('./Vendor');
const VendorTransaction = require('./VendorTransaction');

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
    if (camelKey === 'bankDetails' || camelKey === 'adminNotes' || camelKey === 'vendorNotes') {
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
    if (snakeKey === 'bank_details' || snakeKey === 'admin_notes' || snakeKey === 'vendor_notes') {
      acc[snakeKey] = value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
    } else {
      acc[snakeKey] = value !== null && typeof value === 'object' ? camelToSnake(value) : value;
    }
    
    return acc;
  }, {});
}

class WithdrawalRequest {
  // إنشاء طلب سحب جديد
  static async create(requestData) {
    try {
      // التحقق من وجود البائع
      const vendor = await Vendor.findById(requestData.vendorId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      
      // التحقق من الرصيد المتاح
      const balance = await VendorTransaction.calculateVendorBalance(requestData.vendorId);
      if (balance.availableBalance < requestData.amount) {
        throw new Error('Insufficient balance');
      }
      
      // التحقق من صحة البيانات
      this.validateRequestData(requestData);
      
      // تحويل البيانات إلى snake_case وإعداد الحقول JSON
      const data = camelToSnake({
        ...requestData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // إعداد استعلام الإدراج
      const fields = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const query = `INSERT INTO withdrawal_requests (${fields}) VALUES (${placeholders})`;
      
      const [result] = await pool.execute(query, values);
      
      // استرجاع طلب السحب المدرج حديثًا
      return this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن طلب سحب بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM withdrawal_requests WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      // تحويل البيانات من snake_case إلى camelCase
      return snakeToCamel(rows[0]);
    } catch (error) {
      throw error;
    }
  }
  
  // البحث عن طلبات سحب بائع معين
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
      let query = 'SELECT * FROM withdrawal_requests WHERE vendor_id = ?';
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
      
      // الحصول على إجمالي عدد طلبات السحب
      let countQuery = 'SELECT COUNT(*) as total FROM withdrawal_requests WHERE vendor_id = ?';
      const countParams = [vendorId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countResult] = await pool.execute(countQuery, countParams);
      const total = countResult[0].total;
      
      // تحويل البيانات من snake_case إلى camelCase
      const requests = rows.map(row => snakeToCamel(row));
      
      return {
        requests,
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
  
  // الحصول على قائمة طلبات السحب مع خيارات التصفية والترتيب
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        vendorId,
        status,
        startDate,
        endDate
      } = options;
      
      // بناء استعلام SQL
      let query = 'SELECT * FROM withdrawal_requests WHERE 1=1';
      const params = [];
      
      // إضافة شروط التصفية
      if (vendorId) {
        query += ' AND vendor_id = ?';
        params.push(vendorId);
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
      
      // الحصول على إجمالي عدد طلبات السحب
      let countQuery = 'SELECT COUNT(*) as total FROM withdrawal_requests WHERE 1=1';
      const countParams = [];
      
      if (vendorId) {
        countQuery += ' AND vendor_id = ?';
        countParams.push(vendorId);
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
      const requests = rows.map(row => snakeToCamel(row));
      
      return {
        requests,
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
  
  // تحديث حالة طلب السحب
  static async updateStatus(id, status, adminNotes = null) {
    try {
      // التحقق من وجود طلب السحب
      const request = await this.findById(id);
      if (!request) {
        throw new Error('Withdrawal request not found');
      }
      
      // التحقق من صحة الحالة
      if (!['pending', 'approved', 'rejected', 'processing', 'completed'].includes(status)) {
        throw new Error('Invalid status');
      }
      
      // تحديث حالة طلب السحب
      const query = 'UPDATE withdrawal_requests SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?';
      const values = [status, adminNotes ? JSON.stringify(adminNotes) : null, new Date(), id];
      
      await pool.execute(query, values);
      
      // إذا تمت الموافقة على الطلب، قم بإنشاء معاملة سحب
      if (status === 'approved') {
        const withdrawalRequest = await this.findById(id);
        
        // إنشاء معاملة سحب
        await VendorTransaction.create({
          vendorId: withdrawalRequest.vendorId,
          amount: withdrawalRequest.amount,
          transactionType: 'withdrawal',
          status: 'pending',
          description: `Withdrawal request #${withdrawalRequest.id}`,
          referenceNumber: `WR-${withdrawalRequest.id}`,
          metadata: {
            withdrawalRequestId: withdrawalRequest.id
          }
        });
      }
      
      // إذا اكتملت المعاملة، قم بتحديث حالة معاملة السحب المرتبطة
      if (status === 'completed') {
        const withdrawalRequest = await this.findById(id);
        
        // البحث عن معاملة السحب المرتبطة
        const [transactions] = await pool.execute(
          'SELECT * FROM vendor_transactions WHERE reference_number = ?',
          [`WR-${withdrawalRequest.id}`]
        );
        
        if (transactions.length > 0) {
          // تحديث حالة معاملة السحب
          await VendorTransaction.updateStatus(transactions[0].id, 'completed');
        }
      }
      
      // استرجاع طلب السحب المحدث
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // إضافة ملاحظات البائع إلى طلب السحب
  static async addVendorNotes(id, vendorNotes) {
    try {
      // التحقق من وجود طلب السحب
      const request = await this.findById(id);
      if (!request) {
        throw new Error('Withdrawal request not found');
      }
      
      // تحديث ملاحظات البائع
      const query = 'UPDATE withdrawal_requests SET vendor_notes = ?, updated_at = ? WHERE id = ?';
      const values = [JSON.stringify(vendorNotes), new Date(), id];
      
      await pool.execute(query, values);
      
      // استرجاع طلب السحب المحدث
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }
  
  // التحقق من صحة بيانات طلب السحب
  static validateRequestData(data) {
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
    
    if (!data.bankDetails) {
      throw new Error('Bank details are required');
    }
    
    // التحقق من تفاصيل البنك
    const bankDetails = data.bankDetails;
    if (typeof bankDetails !== 'object') {
      throw new Error('Bank details must be an object');
    }
    
    if (!bankDetails.accountName) {
      throw new Error('Bank account name is required');
    }
    
    if (!bankDetails.accountNumber) {
      throw new Error('Bank account number is required');
    }
    
    if (!bankDetails.bankName) {
      throw new Error('Bank name is required');
    }
    
    return true;
  }
}

module.exports = WithdrawalRequest;