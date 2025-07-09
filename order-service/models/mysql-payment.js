// order-service/models/mysql-payment.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

// تعريف الثوابت
const MIN_AMOUNT = 0.0;
const MAX_AMOUNT = 1000000.0;
const DEFAULT_CURRENCY = 'EGP';
const EXPIRY_HOURS = 24;
const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP'];

// حالات الدفع
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
};

// طرق الدفع
const PAYMENT_METHODS = {
  CREDIT_CARD: 'creditCard',
  DEBIT_CARD: 'debitCard',
  BANK_TRANSFER: 'bankTransfer',
  CASH_ON_DELIVERY: 'cashOnDelivery',
  WALLET: 'wallet',
  APPLE_PAY: 'applePay',
  GOOGLE_PAY: 'googlePay'
};

/**
 * إنشاء دفعة جديدة
 * @param {Object} paymentData - بيانات الدفع
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function createPayment(paymentData) {
  try {
    const {
      order_id,
      user_id,
      amount,
      currency = DEFAULT_CURRENCY,
      method,
      payment_gateway = null,
      transaction_id = null
    } = paymentData;
    
    // التحقق من صحة البيانات
    if (!order_id || !user_id || amount === undefined || !method) {
      return { 
        success: false, 
        error: 'يرجى توفير معرف الطلب ومعرف المستخدم والمبلغ وطريقة الدفع' 
      };
    }
    
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return { 
        success: false, 
        error: `المبلغ يجب أن يكون بين ${MIN_AMOUNT} و ${MAX_AMOUNT}` 
      };
    }
    
    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return { 
        success: false, 
        error: `العملة غير مدعومة. العملات المدعومة هي: ${SUPPORTED_CURRENCIES.join(', ')}` 
      };
    }
    
    // إنشاء الدفعة
    const [result] = await pool.query(
      `INSERT INTO payments 
       (order_id, user_id, amount, currency, status, method, payment_gateway, transaction_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, user_id, amount, currency, PAYMENT_STATUS.PENDING, method, payment_gateway, transaction_id]
    );
    
    const [newPayment] = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [result.insertId]
    );
    
    return { success: true, payment: newPayment[0] };
  } catch (error) {
    console.error('خطأ في إنشاء الدفعة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على دفعة بواسطة المعرف
 * @param {number} paymentId - معرف الدفعة
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getPaymentById(paymentId) {
  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE id = ?',
      [paymentId]
    );
    
    if (payments.length === 0) {
      return { success: false, error: 'الدفعة غير موجودة' };
    }
    
    // تحويل البيانات المخزنة بتنسيق JSON إلى كائنات JavaScript
    const payment = payments[0];
    if (payment.gateway_response) {
      payment.gateway_response = JSON.parse(payment.gateway_response);
    }
    
    return { success: true, payment };
  } catch (error) {
    console.error('خطأ في الحصول على الدفعة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على دفعة بواسطة معرف الطلب
 * @param {number} orderId - معرف الطلب
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getPaymentByOrderId(orderId) {
  try {
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );
    
    if (payments.length === 0) {
      return { success: false, error: 'لا توجد دفعات مرتبطة بهذا الطلب' };
    }
    
    // تحويل البيانات المخزنة بتنسيق JSON إلى كائنات JavaScript
    const payment = payments[0];
    if (payment.gateway_response) {
      payment.gateway_response = JSON.parse(payment.gateway_response);
    }
    
    return { success: true, payment };
  } catch (error) {
    console.error('خطأ في الحصول على الدفعة بواسطة معرف الطلب:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث حالة الدفع
 * @param {number} paymentId - معرف الدفعة
 * @param {string} status - الحالة الجديدة
 * @param {Object} additionalData - بيانات إضافية
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updatePaymentStatus(paymentId, status, additionalData = {}) {
  try {
    // التحقق من صحة الحالة
    const validStatuses = Object.values(PAYMENT_STATUS);
    if (!validStatuses.includes(status)) {
      return { 
        success: false, 
        error: `الحالة غير صالحة. الحالات الصالحة هي: ${validStatuses.join(', ')}` 
      };
    }
    
    // الحصول على الدفعة الحالية
    const paymentResult = await getPaymentById(paymentId);
    if (!paymentResult.success) {
      return paymentResult;
    }
    
    const payment = paymentResult.payment;
    
    // تحديث الحالة والبيانات الإضافية
    const updateFields = ['status = ?'];
    const updateValues = [status];
    
    if (additionalData.transaction_id) {
      updateFields.push('transaction_id = ?');
      updateValues.push(additionalData.transaction_id);
    }
    
    if (additionalData.error_message) {
      updateFields.push('error_message = ?');
      updateValues.push(additionalData.error_message);
    }
    
    if (additionalData.gateway_response) {
      updateFields.push('gateway_response = ?');
      updateValues.push(JSON.stringify(additionalData.gateway_response));
    }
    
    if (status === PAYMENT_STATUS.REFUNDED) {
      if (additionalData.refund_reason) {
        updateFields.push('refund_reason = ?');
        updateValues.push(additionalData.refund_reason);
      }
      
      if (additionalData.refund_amount) {
        updateFields.push('refund_amount = ?');
        updateValues.push(additionalData.refund_amount);
      }
      
      updateFields.push('refund_date = NOW()');
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(paymentId);
    
    await pool.query(
      `UPDATE payments SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // إعادة الحصول على الدفعة المحدثة
    return await getPaymentById(paymentId);
  } catch (error) {
    console.error('خطأ في تحديث حالة الدفع:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث استجابة بوابة الدفع
 * @param {number} paymentId - معرف الدفعة
 * @param {Object} gatewayResponse - استجابة بوابة الدفع
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updateGatewayResponse(paymentId, gatewayResponse) {
  try {
    await pool.query(
      'UPDATE payments SET gateway_response = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(gatewayResponse), paymentId]
    );
    
    return await getPaymentById(paymentId);
  } catch (error) {
    console.error('خطأ في تحديث استجابة بوابة الدفع:', error);
    return { success: false, error: error.message };
  }
}

/**
 * استرداد الدفعة
 * @param {number} paymentId - معرف الدفعة
 * @param {Object} refundData - بيانات الاسترداد
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function refundPayment(paymentId, refundData) {
  try {
    const { refund_reason, refund_amount } = refundData;
    
    // الحصول على الدفعة
    const paymentResult = await getPaymentById(paymentId);
    if (!paymentResult.success) {
      return paymentResult;
    }
    
    const payment = paymentResult.payment;
    
    // التحقق من إمكانية الاسترداد
    if (payment.status !== PAYMENT_STATUS.COMPLETED) {
      return { 
        success: false, 
        error: 'لا يمكن استرداد الدفعة إلا إذا كانت مكتملة' 
      };
    }
    
    if (payment.status === PAYMENT_STATUS.REFUNDED) {
      return { 
        success: false, 
        error: 'تم استرداد الدفعة بالفعل' 
      };
    }
    
    // التحقق من صحة مبلغ الاسترداد
    if (refund_amount && (refund_amount <= 0 || refund_amount > payment.amount)) {
      return { 
        success: false, 
        error: `مبلغ الاسترداد يجب أن يكون أكبر من 0 وأقل من أو يساوي ${payment.amount}` 
      };
    }
    
    // تحديث الدفعة
    return await updatePaymentStatus(paymentId, PAYMENT_STATUS.REFUNDED, {
      refund_reason,
      refund_amount: refund_amount || payment.amount
    });
  } catch (error) {
    console.error('خطأ في استرداد الدفعة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إلغاء الدفعة
 * @param {number} paymentId - معرف الدفعة
 * @param {string} reason - سبب الإلغاء
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function cancelPayment(paymentId, reason) {
  try {
    // الحصول على الدفعة
    const paymentResult = await getPaymentById(paymentId);
    if (!paymentResult.success) {
      return paymentResult;
    }
    
    const payment = paymentResult.payment;
    
    // التحقق من إمكانية الإلغاء
    if (![PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING].includes(payment.status)) {
      return { 
        success: false, 
        error: 'لا يمكن إلغاء الدفعة إلا إذا كانت قيد الانتظار أو قيد المعالجة' 
      };
    }
    
    // تحديث الدفعة
    return await updatePaymentStatus(paymentId, PAYMENT_STATUS.CANCELLED, {
      error_message: reason || 'تم إلغاء الدفعة بواسطة المستخدم'
    });
  } catch (error) {
    console.error('خطأ في إلغاء الدفعة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على دفعات المستخدم
 * @param {number} userId - معرف المستخدم
 * @param {number} page - رقم الصفحة
 * @param {number} limit - عدد العناصر في الصفحة
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getUserPayments(userId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    
    // الحصول على الدفعات
    const [payments] = await pool.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    
    // الحصول على العدد الإجمالي
    const [countResult] = await pool.query(
      'SELECT COUNT(*) as total FROM payments WHERE user_id = ?',
      [userId]
    );
    
    const total = countResult[0].total;
    
    // تحويل البيانات المخزنة بتنسيق JSON إلى كائنات JavaScript
    const formattedPayments = payments.map(payment => {
      if (payment.gateway_response) {
        payment.gateway_response = JSON.parse(payment.gateway_response);
      }
      return payment;
    });
    
    return { 
      success: true, 
      payments: formattedPayments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('خطأ في الحصول على دفعات المستخدم:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تنسيق بيانات الدفع
 * @param {Object} payment - بيانات الدفع
 * @returns {Object} - البيانات المنسقة
 */
function formatPayment(payment) {
  // تحويل حالة الدفع إلى نص مقروء
  const statusText = {
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'completed': 'مكتمل',
    'failed': 'فشل',
    'refunded': 'مسترد',
    'cancelled': 'ملغي'
  }[payment.status] || payment.status;
  
  // تحويل طريقة الدفع إلى نص مقروء
  const methodText = {
    'creditCard': 'بطاقة ائتمان',
    'debitCard': 'بطاقة خصم',
    'bankTransfer': 'تحويل بنكي',
    'cashOnDelivery': 'الدفع عند الاستلام',
    'wallet': 'المحفظة',
    'applePay': 'Apple Pay',
    'googlePay': 'Google Pay'
  }[payment.method] || payment.method;
  
  // حساب نسبة الاسترداد
  const refundPercentage = payment.refund_amount ? (payment.refund_amount / payment.amount) * 100 : 0;
  
  // التحقق من انتهاء الصلاحية
  const now = new Date();
  const createdAt = new Date(payment.created_at);
  const diffHours = Math.abs(now - createdAt) / 36e5; // 36e5 is the number of milliseconds in an hour
  const isExpired = diffHours >= EXPIRY_HOURS;
  
  // التحقق من إمكانية الاسترداد
  const canBeRefunded = payment.status === PAYMENT_STATUS.COMPLETED && 
                        payment.status !== PAYMENT_STATUS.REFUNDED && 
                        payment.status !== PAYMENT_STATUS.CANCELLED;
  
  // التحقق من وجود خطأ
  const hasError = payment.error_message !== null && payment.error_message !== '';
  
  // التحقق من نوع الدفع
  const isOnlinePayment = ['creditCard', 'debitCard', 'bankTransfer', 'applePay', 'googlePay'].includes(payment.method);
  const isCashPayment = payment.method === 'cashOnDelivery';
  const isWalletPayment = payment.method === 'wallet';
  const isDigitalWalletPayment = ['applePay', 'googlePay'].includes(payment.method);
  
  return {
    ...payment,
    statusText,
    methodText,
    refundPercentage,
    isExpired,
    canBeRefunded,
    hasError,
    isOnlinePayment,
    isCashPayment,
    isWalletPayment,
    isDigitalWalletPayment
  };
}

module.exports = {
  pool,
  createPayment,
  getPaymentById,
  getPaymentByOrderId,
  updatePaymentStatus,
  updateGatewayResponse,
  refundPayment,
  cancelPayment,
  getUserPayments,
  formatPayment,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  SUPPORTED_CURRENCIES
};