// analytics-service/routes/performanceRoutes.js
const express = require('express');
const router = express.Router();
const performanceController = require('../controllers/performanceController');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

/**
 * @route   POST /performance/app
 * @desc    تسجيل أداء التطبيق
 * @access  Private
 */
router.post('/app', authenticate, restrictTo('admin', 'vendor'), performanceController.logAppPerformance);

/**
 * @route   GET /performance/app
 * @desc    الحصول على إحصائيات أداء التطبيق
 * @access  Private
 */
router.get('/app', authenticate, restrictTo('admin'), performanceController.getAppPerformanceStats);

/**
 * @route   POST /performance/error
 * @desc    تسجيل خطأ
 * @access  Private
 */
router.post('/error', authenticate, restrictTo('admin', 'vendor'), performanceController.logError);

/**
 * @route   GET /performance/errors
 * @desc    الحصول على إحصائيات الأخطاء
 * @access  Private
 */
router.get('/errors', authenticate, restrictTo('admin'), performanceController.getErrorLogs);

/**
 * @route   POST /performance/user-engagement
 * @desc    تسجيل مشاركة المستخدم
 * @access  Private
 */
router.post('/user-engagement', authenticate, restrictTo('admin', 'vendor'), performanceController.logUserEngagement);

/**
 * @route   GET /performance/user-engagement
 * @desc    الحصول على إحصائيات مشاركة المستخدم
 * @access  Private
 */
router.get('/user-engagement', authenticate, restrictTo('admin'), performanceController.getUserEngagementStats);

/**
 * @route   POST /performance/api
 * @desc    تسجيل أداء API
 * @access  Private
 */
router.post('/api', authenticate, restrictTo('admin', 'vendor'), performanceController.logApiPerformance);

/**
 * @route   GET /performance/api
 * @desc    الحصول على إحصائيات أداء API
 * @access  Private
 */
router.get('/api', authenticate, restrictTo('admin'), performanceController.getApiPerformanceStats);

module.exports = router;