const VendorRating = require('../models/VendorRating');
const Vendor = require('../models/Vendor');

// إضافة تقييم جديد للبائع
const addVendorReview = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'معرف المستخدم غير متوفر'
      });
    }

    // التحقق من وجود البائع
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // التحقق من عدم وجود تقييم سابق من نفس المستخدم
    const existingReview = await VendorRating.findByUserAndVendor(userId, vendorId);
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this vendor'
      });
    }

    // إنشاء التقييم الجديد
    const reviewData = {
      vendorId,
      userId,
      rating: parseFloat(rating),
      comment: comment || null,
      status: 'pending'
    };

    const newReview = await VendorRating.create(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: newReview
    });
  } catch (error) {
    console.error('Error adding vendor review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// الحصول على تقييمات البائع
const getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, status = 'approved' } = req.query;

    // التحقق من وجود البائع
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // الحصول على التقييمات
    const result = await VendorRating.findAll({
      vendorId,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });

    res.json({
      success: true,
      data: result.ratings,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting vendor reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// تحديث تقييم البائع
const updateVendorReview = async (req, res) => {
  try {
    const { vendorId, reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'معرف المستخدم غير متوفر'
      });
    }

    // الحصول على التقييم
    const review = await VendorRating.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // التحقق من الصلاحية (صاحب التقييم أو المدير)
    if (review.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // تحديث التقييم
    const updateData = {};
    if (rating !== undefined) updateData.rating = parseFloat(rating);
    if (comment !== undefined) updateData.comment = comment;

    const updatedReview = await VendorRating.update(reviewId, updateData);

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Error updating vendor review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// حذف تقييم البائع
const deleteVendorReview = async (req, res) => {
  try {
    const { vendorId, reviewId } = req.params;
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'معرف المستخدم غير متوفر'
      });
    }

    // الحصول على التقييم
    const review = await VendorRating.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // التحقق من الصلاحية (صاحب التقييم أو المدير)
    if (review.userId !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // حذف التقييم
    await VendorRating.delete(reviewId);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vendor review:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// تحديث حالة التقييم (للمديرين فقط)
const updateReviewStatus = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    // التحقق من صلاحية المدير
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update review status'
      });
    }

    // تحديث حالة التقييم
    const updatedReview = await VendorRating.updateStatus(reviewId, status);

    res.json({
      success: true,
      message: 'Review status updated successfully',
      data: updatedReview
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// الحصول على جميع التقييمات (للمديرين)
const getAllReviews = async (req, res) => {
  try {
    const userRole = req.user.role;

    // التحقق من صلاحية المدير
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access all reviews'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      status, 
      vendorId, 
      userId,
      minRating,
      maxRating,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    if (status) options.status = status;
    if (vendorId) options.vendorId = vendorId;
    if (userId) options.userId = userId;
    if (minRating) options.minRating = parseFloat(minRating);
    if (maxRating) options.maxRating = parseFloat(maxRating);

    const result = await VendorRating.findAll(options);

    res.json({
      success: true,
      data: result.ratings,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error getting all reviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  addVendorReview,
  getVendorReviews,
  updateVendorReview,
  deleteVendorReview,
  updateReviewStatus,
  getAllReviews
};