const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// استيراد middleware للمصادقة
// ملاحظة: يجب تكييف هذا المسار حسب هيكل المشروع الخاص بك
// قد تحتاج إلى إنشاء نسخة محلية من middleware المصادقة أو استخدام مكتبة مشتركة
const { authenticate: authMiddleware } = require('../middleware/authMiddleware');

// افتراض وجود middleware للتحقق من صلاحيات المسؤول
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'غير مصرح لك بالوصول إلى هذا المورد' });
  }
};

// مسارات المراجعات العامة

// إضافة مراجعة لمنتج
router.post('/product', authMiddleware, reviewController.addProductReview);

// إضافة مراجعة بمعرف محدد
router.post('/:id', authMiddleware, reviewController.addReviewById);

// إضافة مراجعة لبائع
router.post('/vendor', authMiddleware, reviewController.addVendorReview);

// جلب مراجعات منتج
router.get('/product/:productId', reviewController.getProductReviews);

// جلب مراجعات بائع
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

// إضافة مراجعة لبائع بمعرف محدد (مسار بديل للاختبارات)
router.post('/vendor/:vendorId', authMiddleware, (req, res) => {
  // نسخ vendorId من المسار إلى body
  req.body.vendorId = req.params.vendorId;
  reviewController.addVendorReview(req, res);
});

// الإبلاغ عن مراجعة
router.post('/report/:reviewId', authMiddleware, reviewController.reportReview);

// مسارات المراجعات للمسؤولين

// اعتدال المراجعة (الموافقة أو الرفض)
router.put('/moderate/:reviewId', authMiddleware, isAdmin, reviewController.moderateReview);

// جلب المراجعات المعلقة
router.get('/pending', authMiddleware, isAdmin, reviewController.getPendingReviews);

// جلب المراجعات المبلغ عنها
router.get('/reported', authMiddleware, isAdmin, reviewController.getReportedReviews);

module.exports = router;