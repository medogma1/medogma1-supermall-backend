// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const {
  createOrder,
  getAllOrders,
  getOrderById,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  returnOrder,
  updateShippingInfo,
  updatePaymentInfo,
  getVendorOrders,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');

// إنشاء طلب جديد
router.post('/', authMiddleware.authenticate, createOrder);

// جلب كل الطلبات
router.get('/', authMiddleware.authenticate, getAllOrders);

// Admin routes
router.get('/admin/orders', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), getAllOrders);
router.patch('/admin/orders/:id/status', authMiddleware.authenticate, authMiddleware.restrictTo('admin'), updateOrderStatus);

// جلب طلب حسب الـ ID
router.get('/:id', authMiddleware.authenticate, getOrderById);

// جلب طلبات المستخدم
router.get('/customer/:userId', authMiddleware.authenticate, getUserOrders);

// جلب طلبات البائع
router.get('/vendor/:vendorId', authMiddleware.authenticate, getVendorOrders);

// تحديث حالة الطلب
router.put('/:id/status', authMiddleware.authenticate, updateOrderStatus);

// إلغاء الطلب
router.post('/:id/cancel', authMiddleware.authenticate, cancelOrder);

// إرجاع الطلب
router.post('/:id/return', authMiddleware.authenticate, returnOrder);

// تحديث معلومات الشحن
router.put('/:id/shipping', authMiddleware.authenticate, updateShippingInfo);

// تحديث معلومات الدفع
router.put('/:id/payment', authMiddleware.authenticate, updatePaymentInfo);

// تحديث طلب
router.put('/:id', authMiddleware.authenticate, updateOrder);

// حذف طلب
router.delete('/:id', authMiddleware.authenticate, deleteOrder);

// Admin routes
router.get('/', authMiddleware.authenticate, getAllOrders);
router.put('/:id/status', authMiddleware.authenticate, updateOrderStatus);

module.exports = router;
