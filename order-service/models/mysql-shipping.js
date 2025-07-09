// order-service/models/mysql-shipping.js
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

// حالات الشحن
const SHIPPING_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  IN_TRANSIT: 'inTransit',
  OUT_FOR_DELIVERY: 'outForDelivery',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETURNED: 'returned',
  CANCELLED: 'cancelled'
};

/**
 * إنشاء شحنة جديدة
 * @param {Object} shippingData - بيانات الشحن
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function createShipping(shippingData) {
  try {
    const {
      order_id,
      address_id,
      shipping_cost,
      carrier = null,
      tracking_number = null,
      estimated_delivery_time = null,
      delivery_notes = null
    } = shippingData;
    
    // التحقق من البيانات المطلوبة
    if (!order_id || !address_id || shipping_cost === undefined) {
      return { 
        success: false, 
        error: 'يرجى توفير معرف الطلب ومعرف العنوان وتكلفة الشحن' 
      };
    }
    
    // إنشاء الشحنة
    const [result] = await pool.query(
      `INSERT INTO shipping 
       (order_id, address_id, status, shipping_cost, carrier, tracking_number, estimated_delivery_time, delivery_notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_id, address_id, SHIPPING_STATUS.PENDING, shipping_cost, carrier, tracking_number, estimated_delivery_time, delivery_notes]
    );
    
    // الحصول على الشحنة مع بيانات العنوان
    return await getShippingById(result.insertId);
  } catch (error) {
    console.error('خطأ في إنشاء الشحنة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على شحنة بواسطة المعرف
 * @param {number} shippingId - معرف الشحنة
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getShippingById(shippingId) {
  try {
    // الحصول على الشحنة
    const [shippings] = await pool.query(
      'SELECT * FROM shipping WHERE id = ?',
      [shippingId]
    );
    
    if (shippings.length === 0) {
      return { success: false, error: 'الشحنة غير موجودة' };
    }
    
    const shipping = shippings[0];
    
    // الحصول على بيانات العنوان
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE id = ?',
      [shipping.address_id]
    );
    
    if (addresses.length === 0) {
      return { success: true, shipping, address: null };
    }
    
    const address = addresses[0];
    
    // تنسيق البيانات
    const formattedShipping = formatShipping(shipping, address);
    
    return { success: true, shipping: formattedShipping };
  } catch (error) {
    console.error('خطأ في الحصول على الشحنة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على شحنة بواسطة معرف الطلب
 * @param {number} orderId - معرف الطلب
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getShippingByOrderId(orderId) {
  try {
    // الحصول على الشحنة
    const [shippings] = await pool.query(
      'SELECT * FROM shipping WHERE order_id = ?',
      [orderId]
    );
    
    if (shippings.length === 0) {
      return { success: false, error: 'لا توجد شحنة مرتبطة بهذا الطلب' };
    }
    
    const shipping = shippings[0];
    
    // الحصول على بيانات العنوان
    const [addresses] = await pool.query(
      'SELECT * FROM addresses WHERE id = ?',
      [shipping.address_id]
    );
    
    if (addresses.length === 0) {
      return { success: true, shipping, address: null };
    }
    
    const address = addresses[0];
    
    // تنسيق البيانات
    const formattedShipping = formatShipping(shipping, address);
    
    return { success: true, shipping: formattedShipping };
  } catch (error) {
    console.error('خطأ في الحصول على الشحنة بواسطة معرف الطلب:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث حالة الشحن
 * @param {number} shippingId - معرف الشحنة
 * @param {string} status - الحالة الجديدة
 * @param {Object} additionalData - بيانات إضافية
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updateShippingStatus(shippingId, status, additionalData = {}) {
  try {
    // التحقق من صحة الحالة
    const validStatuses = Object.values(SHIPPING_STATUS);
    if (!validStatuses.includes(status)) {
      return { 
        success: false, 
        error: `الحالة غير صالحة. الحالات الصالحة هي: ${validStatuses.join(', ')}` 
      };
    }
    
    // الحصول على الشحنة الحالية
    const shippingResult = await getShippingById(shippingId);
    if (!shippingResult.success) {
      return shippingResult;
    }
    
    // تحديث الحالة والبيانات الإضافية
    const updateFields = ['status = ?'];
    const updateValues = [status];
    
    if (additionalData.tracking_number) {
      updateFields.push('tracking_number = ?');
      updateValues.push(additionalData.tracking_number);
    }
    
    if (additionalData.carrier) {
      updateFields.push('carrier = ?');
      updateValues.push(additionalData.carrier);
    }
    
    if (additionalData.estimated_delivery_time) {
      updateFields.push('estimated_delivery_time = ?');
      updateValues.push(additionalData.estimated_delivery_time);
    }
    
    if (additionalData.delivery_notes) {
      updateFields.push('delivery_notes = ?');
      updateValues.push(additionalData.delivery_notes);
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(shippingId);
    
    await pool.query(
      `UPDATE shipping SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // إعادة الحصول على الشحنة المحدثة
    return await getShippingById(shippingId);
  } catch (error) {
    console.error('خطأ في تحديث حالة الشحن:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث معلومات التتبع
 * @param {number} shippingId - معرف الشحنة
 * @param {string} trackingNumber - رقم التتبع
 * @param {string} carrier - شركة الشحن
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updateTrackingInfo(shippingId, trackingNumber, carrier) {
  try {
    await pool.query(
      'UPDATE shipping SET tracking_number = ?, carrier = ?, updated_at = NOW() WHERE id = ?',
      [trackingNumber, carrier, shippingId]
    );
    
    return await getShippingById(shippingId);
  } catch (error) {
    console.error('خطأ في تحديث معلومات التتبع:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث وقت التسليم المقدر
 * @param {number} shippingId - معرف الشحنة
 * @param {number} estimatedDeliveryTime - وقت التسليم المقدر (بالساعات)
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updateEstimatedDeliveryTime(shippingId, estimatedDeliveryTime) {
  try {
    await pool.query(
      'UPDATE shipping SET estimated_delivery_time = ?, updated_at = NOW() WHERE id = ?',
      [estimatedDeliveryTime, shippingId]
    );
    
    return await getShippingById(shippingId);
  } catch (error) {
    console.error('خطأ في تحديث وقت التسليم المقدر:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث ملاحظات التسليم
 * @param {number} shippingId - معرف الشحنة
 * @param {string} deliveryNotes - ملاحظات التسليم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updateDeliveryNotes(shippingId, deliveryNotes) {
  try {
    await pool.query(
      'UPDATE shipping SET delivery_notes = ?, updated_at = NOW() WHERE id = ?',
      [deliveryNotes, shippingId]
    );
    
    return await getShippingById(shippingId);
  } catch (error) {
    console.error('خطأ في تحديث ملاحظات التسليم:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تنسيق بيانات الشحن
 * @param {Object} shipping - بيانات الشحن
 * @param {Object} address - بيانات العنوان
 * @returns {Object} - البيانات المنسقة
 */
function formatShipping(shipping, address) {
  // تحويل حالة الشحن إلى نص مقروء
  const statusText = {
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'inTransit': 'في الطريق',
    'outForDelivery': 'خارج للتوصيل',
    'delivered': 'تم التوصيل',
    'failed': 'فشل التوصيل',
    'returned': 'تم الإرجاع',
    'cancelled': 'تم الإلغاء'
  }[shipping.status] || shipping.status;
  
  // إنشاء العنوان الكامل
  let fullAddress = '';
  if (address) {
    fullAddress = `${address.street}`;
    
    if (address.building_number) {
      fullAddress += `, مبنى ${address.building_number}`;
    }
    
    if (address.apartment_number) {
      fullAddress += `, شقة ${address.apartment_number}`;
    }
    
    fullAddress += `, ${address.city}, ${address.state}, ${address.country}, ${address.postal_code}`;
    
    if (address.landmark) {
      fullAddress += ` (بالقرب من ${address.landmark})`;
    }
  }
  
  // التحقق من حالة الشحن
  const isDelivered = shipping.status === SHIPPING_STATUS.DELIVERED;
  const isInTransit = [SHIPPING_STATUS.IN_TRANSIT, SHIPPING_STATUS.OUT_FOR_DELIVERY].includes(shipping.status);
  const isFailed = shipping.status === SHIPPING_STATUS.FAILED;
  const isReturned = shipping.status === SHIPPING_STATUS.RETURNED;
  const isCancelled = shipping.status === SHIPPING_STATUS.CANCELLED;
  
  // التحقق من وجود معلومات التتبع
  const hasTrackingInfo = shipping.tracking_number !== null && shipping.tracking_number !== '';
  
  return {
    ...shipping,
    statusText,
    address,
    fullAddress,
    isDelivered,
    isInTransit,
    isFailed,
    isReturned,
    isCancelled,
    hasTrackingInfo
  };
}

module.exports = {
  pool,
  createShipping,
  getShippingById,
  getShippingByOrderId,
  updateShippingStatus,
  updateTrackingInfo,
  updateEstimatedDeliveryTime,
  updateDeliveryNotes,
  formatShipping,
  SHIPPING_STATUS
};