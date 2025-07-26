const express = require('express');
const router = express.Router();
const { authenticate: authMiddleware } = require('../middleware/authMiddleware');
const {
  addVendorReview,
  getVendorReviews,
  updateVendorReview,
  deleteVendorReview,
  updateReviewStatus,
  getAllReviews
} = require('../controllers/reviewController');

// الحصول على جميع التقييمات (للمديرين)
router.get('/reviews/all', authMiddleware, getAllReviews);

// تحديث حالة التقييم (للمديرين فقط)
router.put('/reviews/:reviewId/status', authMiddleware, updateReviewStatus);

// الحصول على تقييمات البائع
router.get('/:vendorId/reviews', getVendorReviews);

// إضافة تقييم جديد للبائع
router.post('/:vendorId/reviews', authMiddleware, addVendorReview);

// تحديث تقييم البائع
router.put('/:vendorId/reviews/:reviewId', authMiddleware, updateVendorReview);

// حذف تقييم البائع
router.delete('/:vendorId/reviews/:reviewId', authMiddleware, deleteVendorReview);

module.exports = router;