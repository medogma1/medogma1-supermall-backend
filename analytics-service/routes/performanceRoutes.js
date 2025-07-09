// analytics-service/routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');

/**
 * @route   POST /performance/app
 * @desc    تسجيل أداء التطبيق
 * @access  Private
 */
router.post('/app', performanceController.logAppPerformance);

/**
 * @route   GET /performance/app
 * @desc    الحصول على إحصائيات أداء التطبيق
 * @access  Private
 */
router.get('/app', performanceController.getAppPerformanceStats);

/**
 * @route   POST /performance/error
 * @desc    تسجيل خطأ
 * @access  Private
 */
router.post('/error', performanceController.logError);

/**
 * @route   GET /performance/errors
 * @desc    الحصول على إحصائيات الأخطاء
 * @access  Private
 */
router.get('/errors', performanceController.getErrorLogs);

/**
 * @route   POST /performance/engagement
 * @desc    تسجيل مشاركة المستخدم
 * @access  Private
 */
router.post('/engagement', performanceController.logUserEngagement);

/**
 * @route   GET /performance/engagement
 * @desc    الحصول على إحصائيات مشاركة المستخدم
 * @access  Private
 */
router.get('/engagement', performanceController.getUserEngagementStats);

/**
 * @route   POST /performance/api
 * @desc    تسجيل أداء API
 * @access  Private
 */
router.post('/api', performanceController.logApiPerformance);

/**
 * @route   GET /performance/api
 * @desc    الحصول على إحصائيات أداء API
 * @access  Private
 */
router.get('/api', performanceController.getApiPerformanceStats);

module.exports = router;