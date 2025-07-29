const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate, restrictTo } = require('../../utils/auth/authMiddleware');

// مسارات البنرات العامة (للعرض)
router.get('/public', bannerController.getActiveBanners);

// مسارات إدارة البنرات (تتطلب صلاحيات المشرف)
// Note: Authentication is handled by API Gateway, these routes are for /admin/banners

// جلب جميع البنرات
router.get('/', bannerController.getAllBanners);

// جلب بنر بواسطة المعرف
router.get('/:id', bannerController.getBannerById);

// إنشاء بنر جديد
router.post('/', bannerController.createBanner);

// تحديث بنر
router.patch('/:id', bannerController.updateBanner);
router.put('/:id', bannerController.updateBanner);

// تبديل حالة البنر
router.patch('/:id/toggle', bannerController.toggleBannerStatus);

// حذف بنر
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;