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
  // إنشاء طلب جديد
  static async create(orderData) {
    try {
      const {
        userId,
        productId,
        quantity = 1,
        price,
        shippingAddressId,
        notes = null,
        discountApplied = 0,
        couponCode = null,
        taxAmount = 0,
        currency = 'EGP'
      } = orderData;

      // حساب المبلغ الإجمالي
      const totalAmount = (price * quantity) - discountApplied + taxAmount;

      const [result] = await pool.query(
        `INSERT INTO orders 
        (user_id, product_id, quantity, status, price, total_amount, currency, shipping_address_id, 
        payment_id, notes, discount_applied, coupon_code, tax_amount, estimated_delivery_date, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, productId, quantity, STATUS.PENDING, price, totalAmount, currency, shippingAddressId, 
        null, notes, discountApplied, couponCode, taxAmount, null]
      );

      if (result.insertId) {
        return this.findById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error);
      throw error;
    }
  }

  // البحث عن طلب بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      return this.formatOrder(rows[0]);
    } catch (error) {
      console.error('خطأ في البحث عن الطلب بواسطة المعرف:', error);
      throw error;
    }
  }

  // الحصول على طلبات المستخدم
  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM orders WHERE user_id = ?';
      const queryParams = [userId];
      
      if (status) {
        query += ' AND status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const [rows] = await pool.query(query, queryParams);
      
      // تنسيق الطلبات
      const orders = rows.map(row => this.formatOrder(row));
      
      // الحصول على العدد الإجمالي للطلبات
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
      const countParams = [userId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countRows] = await pool.query(countQuery, countParams);
      
      return {
        orders,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في الحصول على طلبات المستخدم:', error);
      throw error;
    }
  }

  // تحديث حالة الطلب
  static async updateStatus(id, status) {
    try {
      if (!Object.values(STATUS).includes(status)) {
        throw new Error('حالة الطلب غير صالحة');
      }
      
      const [result] = await pool.query(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows > 0) {
        return this.findById(id);
      }
      return null;
    } catch (error) {
      console.error('خطأ في تحديث حالة الطلب:', error);
      throw error;
    }
  }

  // تحديث معلومات الشحن
  static async updateShippingInfo(id, shippingInfo) {
    try {
      const { trackingNumber, carrier, estimatedDeliveryDate } = shippingInfo;
      
      const [result] = await pool.query(
        'UPDATE orders SET tracking_number = ?, carrier = ?, estimated_delivery_date = ?, updated_at = NOW() WHERE id = ?',
        [trackingNumber, carrier, estimatedDeliveryDate, id]
      );
      
      if (result.affectedRows > 0) {
        return this.findById(id);
      }
      return null;
    } catch (error) {
      console.error('خطأ في تحديث معلومات الشحن:', error);
      throw error;
    }
  }

  // تحديث معلومات الدفع
  static async updatePaymentInfo(id, paymentId) {
    try {
      const [result] = await pool.query(
        'UPDATE orders SET payment_id = ?, updated_at = NOW() WHERE id = ?',
        [paymentId, id]
      );
      
      if (result.affectedRows > 0) {
        return this.findById(id);
      }
      return null;
    } catch (error) {
      console.error('خطأ في تحديث معلومات الدفع:', error);
      throw error;
    }
  }

  // إلغاء الطلب
  static async cancelOrder(id) {
    try {
      // التحقق من إمكانية إلغاء الطلب
      const order = await this.findById(id);
      if (!order) {
        throw new Error('الطلب غير موجود');
      }
      
      if (order.status !== STATUS.PENDING && order.status !== STATUS.CONFIRMED) {
        throw new Error('لا يمكن إلغاء هذا الطلب في حالته الحالية');
      }
      
      return this.updateStatus(id, STATUS.CANCELLED);
    } catch (error) {
      console.error('خطأ في إلغاء الطلب:', error);
      throw error;
    }
  }

  // إرجاع الطلب
  static async returnOrder(id) {
    try {
      // التحقق من إمكانية إرجاع الطلب
      const order = await this.findById(id);
      if (!order) {
        throw new Error('الطلب غير موجود');
      }
      
      if (order.status !== STATUS.DELIVERED) {
        throw new Error('لا يمكن إرجاع هذا الطلب في حالته الحالية');
      }
      
      return this.updateStatus(id, STATUS.RETURNED);
    } catch (error) {
      console.error('خطأ في إرجاع الطلب:', error);
      throw error;
    }
  }

  // الحصول على جميع الطلبات (للمسؤولين)
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, status, sortBy = 'created_at', sortOrder = 'DESC' } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM orders';
      const queryParams = [];
      
      if (status) {
        query += ' WHERE status = ?';
        queryParams.push(status);
      }
      
      query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
      
      const [rows] = await pool.query(query, queryParams);
      
      // تنسيق الطلبات
      const orders = rows.map(row => this.formatOrder(row));
      
      // الحصول على العدد الإجمالي للطلبات
      let countQuery = 'SELECT COUNT(*) as total FROM orders';
      const countParams = [];
      
      if (status) {
        countQuery += ' WHERE status = ?';
        countParams.push(status);
      }
      
      const [countRows] = await pool.query(countQuery, countParams);
      
      return {
        orders,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في الحصول على جميع الطلبات:', error);
      throw error;
    }
  }

  // تنسيق الطلب (تحويل snake_case إلى camelCase)
  static formatOrder(order) {
    return {
      id: order.id,
      userId: order.user_id,
      productId: order.product_id,
      quantity: order.quantity,
      status: order.status,
      price: order.price,
      totalAmount: order.total_amount,
      currency: order.currency,
      shippingAddressId: order.shipping_address_id,
      paymentId: order.payment_id,
      notes: order.notes,
      discountApplied: order.discount_applied,
      couponCode: order.coupon_code,
      taxAmount: order.tax_amount,
      estimatedDeliveryDate: order.estimated_delivery_date,
      trackingNumber: order.tracking_number,
      carrier: order.carrier,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      // Helper methods
      isPending: () => order.status === STATUS.PENDING,
      isConfirmed: () => order.status === STATUS.CONFIRMED,
      isShipped: () => order.status === STATUS.SHIPPED,
      isDelivered: () => order.status === STATUS.DELIVERED,
      isCancelled: () => order.status === STATUS.CANCELLED,
      isReturned: () => order.status === STATUS.RETURNED,
      getStatusText: () => {
        switch (order.status) {
          case STATUS.PENDING: return 'Pending';
          case STATUS.CONFIRMED: return 'Confirmed';
          case STATUS.SHIPPED: return 'Shipped';
          case STATUS.DELIVERED: return 'Delivered';
          case STATUS.CANCELLED: return 'Cancelled';
          case STATUS.RETURNED: return 'Returned';
          default: return 'Unknown';
        }
      },
      canBeCancelled: () => order.status === STATUS.PENDING || order.status === STATUS.CONFIRMED,
      canBeReturned: () => order.status === STATUS.DELIVERED
    };
  }
}

module.exports = {
  Order,
  STATUS
};