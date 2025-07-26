// vendor-service/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// استيراد الوسائط البرمجية للمصادقة
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const vendorOwnershipMiddleware = require('../middleware/vendorOwnershipMiddleware');

// إنشاء خدمة جديدة (مسموح للبائعين والمشرفين)
router.post('/', authMiddleware.authenticate, roleMiddleware.requireVendorOrAdmin, serviceController.createService);

// الحصول على جميع الخدمات (متاح للجميع)
router.get('/', serviceController.getAllServices);

// البحث عن الخدمات (متاح للجميع) - يجب أن يأتي قبل /:id
router.get('/search', serviceController.searchServices);

// الحصول على الخدمات المميزة (متاح للجميع) - يجب أن يأتي قبل /:id
router.get('/featured', serviceController.getFeaturedServices);

// الحصول على خدمات بائع معين (متاح للجميع) - يجب أن يأتي قبل /:id
router.get('/vendor/:vendorId', serviceController.getVendorServices);

// الحصول على خدمة بواسطة المعرف (متاح للجميع)
router.get('/:id', serviceController.getServiceById);

// تحديث خدمة (مسموح للمشرفين والبائع مالك الخدمة)
router.put('/:id', authMiddleware.authenticate, vendorOwnershipMiddleware, serviceController.updateService);

// حذف خدمة (مسموح للمشرفين والبائع مالك الخدمة)
router.delete('/:id', authMiddleware.authenticate, vendorOwnershipMiddleware, serviceController.deleteService);

// تغيير حالة الخدمة (مسموح للمشرفين والبائع مالك الخدمة)
router.patch('/:id/status', authMiddleware.authenticate, vendorOwnershipMiddleware, serviceController.updateServiceStatus);

// تحديث تقييم الخدمة (مسموح للمشرفين والمستخدمين المسجلين)
router.patch('/:id/rating', authMiddleware.authenticate, serviceController.updateServiceRating);

module.exports = router;