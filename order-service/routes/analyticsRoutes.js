// order-service/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// استخدام وظائف من خدمة المستخدم بدلاً من middleware/auth
const authMiddleware = require('../../user-service/middleware/authMiddleware');
const { authenticate, restrictTo } = authMiddleware;

// طرق التحليلات
// يجب أن يكون المستخدم مصادقًا ومصرحًا له كمسؤول أو بائع
router.get('/sales/:storeId', authenticate, restrictTo('admin', 'vendor'), analyticsController.getSalesAnalytics);
router.get('/customers/:storeId', authenticate, restrictTo('admin', 'vendor'), analyticsController.getCustomerAnalytics);
router.get('/inventory/:storeId', authenticate, restrictTo('admin', 'vendor'), analyticsController.getInventoryAnalytics);
router.get('/products/:storeId', authenticate, restrictTo('admin', 'vendor'), analyticsController.getProductPerformance);
router.get('/dashboard/:storeId', authenticate, restrictTo('admin', 'vendor'), analyticsController.getStoreDashboard);

module.exports = router;