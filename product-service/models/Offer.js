const { pool } = require('../config/database');

class Offer {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.code = data.code;
    this.type = data.type; // 'percentage' or 'fixed'
    this.value = data.value;
    this.minAmount = data.min_amount || data.minAmount;
    this.maxUsage = data.max_usage || data.maxUsage;
    this.usageCount = data.usage_count || data.usageCount || 0;
    this.startDate = data.start_date || data.startDate;
    this.endDate = data.end_date || data.endDate;
    this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // إنشاء عرض جديد
  static async create(offerData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // التحقق من صحة البيانات
      if (!offerData.title || offerData.title.trim().length === 0) {
        throw new Error('Offer title is required');
      }
      if (!offerData.code || offerData.code.trim().length === 0) {
        throw new Error('Offer code is required');
      }
      if (!offerData.value || offerData.value <= 0) {
        throw new Error('Valid offer value is required');
      }
      if (!offerData.type || !['percentage', 'fixed'].includes(offerData.type)) {
        throw new Error('Offer type must be percentage or fixed');
      }

      // التحقق من عدم تكرار الكود
      const [existingOffer] = await connection.execute(
        'SELECT id FROM offers WHERE code = ?',
        [offerData.code.trim()]
      );
      
      if (existingOffer.length > 0) {
        throw new Error('Offer code already exists');
      }

      // إدراج العرض
      const [result] = await connection.execute(
        `INSERT INTO offers 
        (title, description, code, type, value, min_amount, max_usage, 
         start_date, end_date, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          offerData.title.trim(),
          offerData.description || null,
          offerData.code.trim(),
          offerData.type,
          offerData.value,
          offerData.minAmount || null,
          offerData.maxUsage || null,
          offerData.startDate || null,
          offerData.endDate || null,
          offerData.isActive !== undefined ? offerData.isActive : true
        ]
      );

      if (!result.insertId) {
        throw new Error('Failed to create offer');
      }

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // البحث عن عرض بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Offer(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // البحث عن عرض بواسطة الكود
  static async findByCode(code) {
    try {
      const [rows] = await pool.execute('SELECT * FROM offers WHERE code = ? AND is_active = 1', [code]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Offer(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع العروض مع دعم الصفحات والتصفية
  static async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'created_at', 
        sortOrder = 'DESC', 
        filters = {} 
      } = options;
      
      const offset = (page - 1) * limit;
      
      // بناء شروط التصفية
      let whereClause = 'WHERE 1=1';
      const filterValues = [];
      
      if (filters.isActive !== undefined) {
        whereClause += ' AND is_active = ?';
        filterValues.push(filters.isActive);
      }
      
      if (filters.type) {
        whereClause += ' AND type = ?';
        filterValues.push(filters.type);
      }
      
      if (filters.search) {
        whereClause += ' AND (title LIKE ? OR code LIKE ? OR description LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        filterValues.push(searchTerm, searchTerm, searchTerm);
      }
      
      // التحقق من صحة sortBy
      const allowedSortFields = ['id', 'title', 'code', 'type', 'value', 'created_at', 'updated_at'];
      const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      // استعلام العد الإجمالي
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM offers ${whereClause}`,
        filterValues
      );
      const total = countResult[0].total;
      
      // استعلام البيانات
      const [rows] = await pool.execute(
        `SELECT * FROM offers ${whereClause} ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`,
        [...filterValues, limit, offset]
      );
      
      const offers = rows.map(row => new Offer(row));
      
      return {
        offers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw error;
    }
  }

  // تحديث عرض
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // التحقق من وجود العرض
      const existingOffer = await this.findById(id);
      if (!existingOffer) {
        throw new Error('Offer not found');
      }
      
      // تحديد الحقول المسموح بتحديثها
      const allowedFields = {
        'title': 'title',
        'description': 'description',
        'code': 'code',
        'type': 'type',
        'value': 'value',
        'minAmount': 'min_amount',
        'maxUsage': 'max_usage',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'isActive': 'is_active'
      };
      
      const updates = [];
      const values = [];
      
      // إنشاء جزء SET من الاستعلام
      Object.keys(updateData).forEach(key => {
        if (allowedFields[key] && updateData[key] !== undefined) {
          updates.push(`${allowedFields[key]} = ?`);
          values.push(updateData[key]);
        }
      });
      
      // تحديث العرض إذا كان هناك تحديثات
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(id);
        
        await connection.execute(
          `UPDATE offers SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
      
      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // حذف عرض
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM offers WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // تبديل حالة العرض
  static async toggleStatus(id) {
    try {
      const offer = await this.findById(id);
      if (!offer) {
        throw new Error('Offer not found');
      }
      
      const newStatus = !offer.isActive;
      await pool.execute(
        'UPDATE offers SET is_active = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, id]
      );
      
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // زيادة عداد الاستخدام
  static async incrementUsage(id) {
    try {
      await pool.execute(
        'UPDATE offers SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // التحقق من صحة العرض للاستخدام
  static async validateOffer(code, orderAmount = 0) {
    try {
      const offer = await this.findByCode(code);
      
      if (!offer) {
        return { valid: false, message: 'كود العرض غير صحيح' };
      }
      
      if (!offer.isActive) {
        return { valid: false, message: 'هذا العرض غير نشط' };
      }
      
      // التحقق من تاريخ البداية
      if (offer.startDate && new Date() < new Date(offer.startDate)) {
        return { valid: false, message: 'هذا العرض لم يبدأ بعد' };
      }
      
      // التحقق من تاريخ الانتهاء
      if (offer.endDate && new Date() > new Date(offer.endDate)) {
        return { valid: false, message: 'انتهت صلاحية هذا العرض' };
      }
      
      // التحقق من الحد الأدنى للمبلغ
      if (offer.minAmount && orderAmount < offer.minAmount) {
        return { 
          valid: false, 
          message: `الحد الأدنى للطلب هو ${offer.minAmount} جنيه` 
        };
      }
      
      // التحقق من عدد مرات الاستخدام
      if (offer.maxUsage && offer.usageCount >= offer.maxUsage) {
        return { valid: false, message: 'تم استنفاد عدد مرات استخدام هذا العرض' };
      }
      
      return { valid: true, offer };
    } catch (error) {
      throw error;
    }
  }

  // حساب قيمة الخصم
  calculateDiscount(orderAmount) {
    if (this.type === 'percentage') {
      return (orderAmount * this.value) / 100;
    } else if (this.type === 'fixed') {
      return Math.min(this.value, orderAmount);
    }
    return 0;
  }
}

module.exports = Offer;