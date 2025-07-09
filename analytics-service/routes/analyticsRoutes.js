// analytics-service/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * @route   GET /analytics/sales
 * @desc    الحصول على تحليلات المبيعات
 * @access  Private
 */
router.get('/sales', analyticsController.getSalesAnalytics);

/**
 * @route   PUT /analytics/sales/:id
 * @desc    تحديث تحليلات المبيعات
 * @access  Private
 */
router.put('/sales/:id', analyticsController.updateSalesAnalytics);

/**
 * @route   GET /analytics/customers
 * @desc    الحصول على تحليلات العملاء
 * @access  Private
 */
router.get('/customers', analyticsController.getCustomerAnalytics);

/**
 * @route   GET /analytics/inventory
 * @desc    الحصول على تحليلات المخزون
 * @access  Private
 */
router.get('/inventory', analyticsController.getInventoryAnalytics);

module.exports = router;