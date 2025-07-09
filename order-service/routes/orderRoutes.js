// routes/orderRoutes.js
const express = require('express');
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  updateShippingInfo,
  updatePaymentInfo
} = require('../controllers/orderController');

// إنشاء طلب جديد
router.post('/', createOrder);

// جلب كل الطلبات
router.get('/', getAllOrders);

// جلب طلب حسب الـ ID
router.get('/:id', getOrderById);

// جلب طلبات المستخدم
router.get('/customer/:userId', getUserOrders);

// جلب طلبات البائع (نفس المسار مع إضافة فلتر للبائع في الكونترولر)
router.get('/vendor/:vendorId', getAllOrders);

// تحديث حالة الطلب
router.put('/:id/status', updateOrderStatus);

// إلغاء الطلب
router.post('/:id/cancel', cancelOrder);

// إرجاع الطلب
router.post('/:id/return', returnOrder);

// تحديث معلومات الشحن
router.put('/:id/shipping', updateShippingInfo);

// تحديث معلومات الدفع
router.put('/:id/payment', updatePaymentInfo);

module.exports = router;
