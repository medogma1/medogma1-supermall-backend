/**
 * Vendor Routes - Updated with proper authorization
 * SuperMall Backend
 */

const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Routes عامة (بدون مصادقة)
router.get('/public', vendorController.getPublicVendors);
router.get('/email/:email', vendorController.getVendorByEmail); // جلب بائع بالبريد الإلكتروني

// Routes تتطلب مصادقة فقط
router.use(authenticate); // تطبيق المصادقة على جميع الـ routes التالية

// Routes خاصة بالمدير فقط
router.get('/', roleMiddleware.requireAdmin, vendorController.getAllVendors); // قائمة جميع البائعين
router.post('/', vendorController.createVendor); // إنشاء بائع جديد (متاح للتسجيل الجديد)
router.delete('/:id', roleMiddleware.requireAdmin, vendorController.deleteVendor); // حذف بائع
router.put('/:id/status', roleMiddleware.requireAdmin, vendorController.updateVendorStatus); // تحديث حالة البائع
router.patch('/:id/toggle-status', roleMiddleware.requireAdmin, vendorController.toggleVendorStatus); // تبديل حالة البائع
router.post('/verify', roleMiddleware.requireAdmin, vendorController.verifyVendorGeneral); // التحقق العام من البائعين
router.post('/:id/verify', roleMiddleware.requireAdmin, vendorController.verifyVendor); // التحقق من البائع
router.get('/analytics', roleMiddleware.requireAdmin, vendorController.getVendorsAnalytics); // إحصائيات البائعين

// Routes إدارة المتاجر (خاصة بالمدير فقط)
router.patch('/:id/ban', roleMiddleware.requireAdmin, vendorController.toggleVendorBan); // حظر/إلغاء حظر تاجر
router.patch('/:id/approve', roleMiddleware.requireAdmin, vendorController.approveStore); // اعتماد متجر
router.patch('/:id/verify', roleMiddleware.requireAdmin, vendorController.verifyStore); // التحقق من متجر
router.patch('/:id/certify', roleMiddleware.requireAdmin, vendorController.certifyStore); // توثيق متجر
router.delete('/:id', roleMiddleware.requireAdmin, vendorController.deleteStore); // حذف متجر

// Routes خاصة بالبائع أو المدير
router.get('/:id', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.getVendorById); // بيانات بائع محدد
router.put('/:id', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.updateVendor); // تحديث بيانات البائع
router.get('/:id/settings', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.getVendorSettings); // إعدادات البائع
router.put('/:id/settings', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.updateVendorSettings); // تحديث إعدادات البائع
router.post('/:id/upload-logo', roleMiddleware.requireVendorOwnershipOrAdmin, upload.single('logo'), vendorController.uploadLogo); // رفع شعار
router.get('/:id/orders', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.getVendorOrders); // طلبات البائع
router.get('/:id/products', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.getVendorProducts); // منتجات البائع
router.get('/:id/reviews', roleMiddleware.requireVendorOwnershipOrAdmin, vendorController.getVendorReviews); // تقييمات البائع

// Routes خاصة بالبائع فقط (لا يمكن للمدير الوصول إليها)
router.get('/my/dashboard', roleMiddleware.requireVendorOrAdmin, vendorController.getVendorDashboard); // لوحة تحكم البائع
router.get('/my/profile', roleMiddleware.requireVendorOrAdmin, vendorController.getMyProfile); // ملف البائع الشخصي
router.put('/my/profile', roleMiddleware.requireVendorOrAdmin, vendorController.updateMyProfile); // تحديث الملف الشخصي

module.exports = router;