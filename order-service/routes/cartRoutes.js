// order-service/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// الحصول على عربة المستخدم
router.get('/user/:userId', cartController.getCart);

// إضافة عنصر إلى العربة
router.post('/user/:userId/items', cartController.addItemToCart);

// تحديث كمية عنصر في العربة
router.patch('/user/:userId/items/:itemId', cartController.updateCartItemQuantity);

// إزالة عنصر من العربة
router.delete('/user/:userId/items/:itemId', cartController.removeItemFromCart);

// تفريغ العربة
router.delete('/user/:userId', cartController.clearCart);

// تطبيق كوبون خصم على العربة
router.post('/user/:userId/coupon', cartController.applyCoupon);

// إزالة كوبون الخصم من العربة
router.delete('/user/:userId/coupon', cartController.removeCoupon);

// التحقق من صلاحية العناصر في العربة
router.get('/user/:userId/validate', cartController.validateCartItems);

module.exports = router;