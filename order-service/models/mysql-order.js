// models/mysql-order.js
const { pool } = require('../config/database');

// Constants
const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
};

class Order {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id || data.userId;
    this.productId = data.product_id || data.productId;
    this.quantity = data.quantity;
    this.status = data.status;
    this.price = data.price;
    this.totalAmount = data.total_amount || data.totalAmount;
    this.currency = data.currency || 'EGP';
    this.shippingAddressId = data.shipping_address_id || data.shippingAddressId;
    this.paymentId = data.payment_id || data.paymentId;
    this.notes = data.notes;
    this.discountApplied = data.discount_applied || data.discountApplied || 0;
    this.couponCode = data.coupon_code || data.couponCode;
    this.taxAmount = data.tax_amount || data.taxAmount || 0;
    this.estimatedDeliveryDate = data.estimated_delivery_date || data.estimatedDeliveryDate;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  // إنشاء طلب جديد
  static async create(orderData) {
    try {
      // التحقق من صحة البيانات
      if (!orderData.userId) {
        throw new Error('User ID is required');
      }
      if (!orderData.productId) {
        throw new Error('Product ID is required');
      }
      if (!orderData.quantity || orderData.quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      if (!orderData.price || orderData.price < 0) {
        throw new Error('Price cannot be negative');
      }
      if (!orderData.shippingAddressId) {
        throw new Error('Shipping address ID is required');
      }

      // حساب المبلغ الإجمالي إذا لم يتم توفيره
      const totalAmount = orderData.totalAmount || 
        (orderData.price * orderData.quantity) - (orderData.discountApplied || 0) + (orderData.taxAmount || 0);

      const query = `
        INSERT INTO orders (
          user_id, product_id, quantity, status, price, total_amount, currency,
          shipping_address_id, payment_id, notes, discount_applied, coupon_code,
          tax_amount, estimated_delivery_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const values = [
        orderData.userId,
        orderData.productId,
        orderData.quantity,
        orderData.status || STATUS.PENDING,
        orderData.price,
        totalAmount,
        orderData.currency || 'EGP',
        orderData.shippingAddressId,
        orderData.paymentId || null,
        orderData.notes || null,
        orderData.discountApplied || 0,
        orderData.couponCode || null,
        orderData.taxAmount || 0,
        orderData.estimatedDeliveryDate || null
      ];

      const [result] = await pool.execute(query, values);
      
      if (!result.insertId) {
        throw new Error('Failed to create order');
      }

      return this.findById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // البحث عن طلب بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Order(rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع الطلبات
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM orders';
      const params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [rows] = await pool.execute(query, params);
      
      return rows.map(row => new Order(row));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على طلبات العميل
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM orders WHERE user_id = ?';
      const params = [userId];
      
      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [rows] = await pool.execute(query, params);
      
      return rows.map(row => new Order(row));
    } catch (error) {
      throw error;
    }
  }

  // الحصول على طلبات البائع
  static async findByVendorId(vendorId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT o.* FROM orders o
        JOIN products p ON o.product_id = p.id
        WHERE p.vendor_id = ?
      `;
      const params = [vendorId];
      
      if (status) {
        query += ' AND o.status = ?';
        params.push(status);
      }
      
      query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), offset);
      
      const [rows] = await pool.execute(query, params);
      
      return rows.map(row => new Order(row));
    } catch (error) {
      throw error;
    }
  }

  // تحديث حالة الطلب
  static async updateStatus(id, status) {
    try {
      if (!Object.values(STATUS).includes(status)) {
        throw new Error('Invalid status');
      }
      
      const query = 'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?';
      await pool.execute(query, [status, id]);
      
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // تحديث بيانات الطلب
  static async update(id, updateData) {
    try {
      const order = await this.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }
      
      const allowedFields = [
        'status', 'payment_id', 'notes', 'estimated_delivery_date'
      ];
      
      const setClause = [];
      const values = [];
      
      Object.keys(updateData).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        if (allowedFields.includes(snakeKey)) {
          setClause.push(`${snakeKey} = ?`);
          // تحويل قيم undefined إلى null
          values.push(updateData[key] === undefined ? null : updateData[key]);
        }
      });
      
      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      setClause.push('updated_at = NOW()');
      values.push(id);
      
      const query = `UPDATE orders SET ${setClause.join(', ')} WHERE id = ?`;
      await pool.execute(query, values);
      
      return this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // حذف طلب
  static async delete(id) {
    try {
      const order = await this.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }
      
      await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Helper methods
  isPending() {
    return this.status === STATUS.PENDING;
  }

  isConfirmed() {
    return this.status === STATUS.CONFIRMED;
  }

  isShipped() {
    return this.status === STATUS.SHIPPED;
  }

  isDelivered() {
    return this.status === STATUS.DELIVERED;
  }

  isCancelled() {
    return this.status === STATUS.CANCELLED;
  }

  isReturned() {
    return this.status === STATUS.RETURNED;
  }

  getStatusText() {
    switch (this.status) {
      case STATUS.PENDING: return 'Pending';
      case STATUS.CONFIRMED: return 'Confirmed';
      case STATUS.SHIPPED: return 'Shipped';
      case STATUS.DELIVERED: return 'Delivered';
      case STATUS.CANCELLED: return 'Cancelled';
      case STATUS.RETURNED: return 'Returned';
      default: return 'Unknown';
    }
  }

  calculateTotalAmount() {
    return (this.price * this.quantity) - this.discountApplied + this.taxAmount;
  }

  canBeCancelled() {
    return this.status === STATUS.PENDING || this.status === STATUS.CONFIRMED;
  }

  canBeReturned() {
    return this.status === STATUS.DELIVERED;
  }

  // تحويل إلى JSON
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      productId: this.productId,
      quantity: this.quantity,
      status: this.status,
      price: this.price,
      totalAmount: this.totalAmount,
      currency: this.currency,
      shippingAddressId: this.shippingAddressId,
      paymentId: this.paymentId,
      notes: this.notes,
      discountApplied: this.discountApplied,
      couponCode: this.couponCode,
      taxAmount: this.taxAmount,
      estimatedDeliveryDate: this.estimatedDeliveryDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = {
  Order,
  STATUS
};