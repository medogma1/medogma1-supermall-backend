// analytics-service/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

/**
 * @route   GET /analytics
 * @desc    الحصول على تحليلات عامة
 * @access  Private
 */
router.get('/', authenticate, restrictTo('admin', 'vendor'), analyticsController.getGeneralAnalytics || analyticsController.getSalesAnalytics);

/**
 * @route   GET /analytics/sales
 * @desc    الحصول على تحليلات المبيعات
 * @access  Private
 */
router.get('/sales', authenticate, restrictTo('admin', 'vendor'), analyticsController.getSalesAnalytics);

/**
 * @route   PUT /analytics/sales/:id
 * @desc    تحديث تحليلات المبيعات
 * @access  Private
 */
router.put('/sales/:id', authenticate, restrictTo('admin'), analyticsController.updateSalesAnalytics);

/**
 * @route   GET /analytics/customers
 * @desc    الحصول على تحليلات العملاء
 * @access  Private
 */
router.get('/customers', authenticate, restrictTo('admin'), analyticsController.getCustomerAnalytics);

/**
 * @route   GET /analytics/inventory
 * @desc    الحصول على تحليلات المخزون
 * @access  Private
 */
router.get('/inventory', authenticate, restrictTo('admin', 'vendor'), analyticsController.getInventoryAnalytics);

/**
 * @route   GET /analytics/products
 * @desc    الحصول على تحليلات المنتجات
 * @access  Private
 */
router.get('/products', authenticate, restrictTo('admin', 'vendor'), analyticsController.getProductAnalytics);

module.exports = router;