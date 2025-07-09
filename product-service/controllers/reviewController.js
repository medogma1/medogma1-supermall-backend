const { Review, constants } = require('../models/Review');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// إضافة مراجعة لمنتج
exports.addProductReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id; // من middleware المصادقة

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة (productId, rating, comment)' });
    }

    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    // التحقق مما إذا كان المستخدم قد قام بمراجعة هذا المنتج من قبل
    const existingReview = await Review.findOne({
      userId,
      productId,
      reviewType: constants.REVIEW_TYPE.PRODUCT
    });

    if (existingReview) {
      return res.status(400).json({ message: 'لقد قمت بمراجعة هذا المنتج من قبل' });
    }

    // إنشاء مراجعة جديدة
    const newReview = new Review({
      userId,
      productId,
      reviewType: constants.REVIEW_TYPE.PRODUCT,
      rating,
      comment,
      status: constants.REVIEW_STATUS.PENDING // المراجعات تحتاج إلى موافقة
    });

    await newReview.save();

    res.status(201).json({
      message: 'تم إضافة المراجعة بنجاح وهي قيد المراجعة',
      review: newReview
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المراجعة', error: error.message });
  }
};

// إضافة مراجعة لبائع
exports.addVendorReview = async (req, res) => {
  try {
    const { vendorId, rating, comment } = req.body;
    const userId = req.user.id; // من middleware المصادقة

    if (!vendorId || !rating || !comment) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة (vendorId, rating, comment)' });
    }

    // التحقق من وجود البائع (يفترض وجود نموذج Vendor)
    // const vendor = await Vendor.findById(vendorId);
    // if (!vendor) {
    //   return res.status(404).json({ message: 'البائع غير موجود' });
    // }

    // التحقق مما إذا كان المستخدم قد قام بمراجعة هذا البائع من قبل
    const existingReview = await Review.findOne({
      userId,
      vendorId,
      reviewType: constants.REVIEW_TYPE.VENDOR
    });

    if (existingReview) {
      return res.status(400).json({ message: 'لقد قمت بمراجعة هذا البائع من قبل' });
    }

    // إنشاء مراجعة جديدة
    const newReview = new Review({
      userId,
      vendorId,
      reviewType: constants.REVIEW_TYPE.VENDOR,
      rating,
      comment,
      status: constants.REVIEW_STATUS.PENDING // المراجعات تحتاج إلى موافقة
    });

    await newReview.save();

    res.status(201).json({
      message: 'تم إضافة المراجعة بنجاح وهي قيد المراجعة',
      review: newReview
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المراجعة', error: error.message });
  }
};

// جلب مراجعات منتج
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // جلب المراجعات المعتمدة فقط
    const [reviews, total] = await Promise.all([
      Review.find({
        productId,
        reviewType: constants.REVIEW_TYPE.PRODUCT,
        status: constants.REVIEW_STATUS.APPROVED
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'username avatar'),
      Review.countDocuments({
        productId,
        reviewType: constants.REVIEW_TYPE.PRODUCT,
        status: constants.REVIEW_STATUS.APPROVED
      })
    ]);

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المراجعات', error: error.message });
  }
};

// جلب مراجعات بائع
exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // جلب المراجعات المعتمدة فقط
    const [reviews, total] = await Promise.all([
      Review.find({
        vendorId,
        reviewType: constants.REVIEW_TYPE.VENDOR,
        status: constants.REVIEW_STATUS.APPROVED
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'username avatar'),
      Review.countDocuments({
        vendorId,
        reviewType: constants.REVIEW_TYPE.VENDOR,
        status: constants.REVIEW_STATUS.APPROVED
      })
    ]);

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReviews: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المراجعات', error: error.message });
  }
};

// الإبلاغ عن مراجعة
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id; // من middleware المصادقة

    if (!reason) {
      return res.status(400).json({ message: 'يرجى تقديم سبب للإبلاغ' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'المراجعة غير موجودة' });
    }

    // التحقق مما إذا كان المستخدم قد أبلغ عن هذه المراجعة من قبل
    const alreadyReported = review.reports.some(report => report.userId.toString() === userId);
    if (alreadyReported) {
      return res.status(400).json({ message: 'لقد قمت بالإبلاغ عن هذه المراجعة من قبل' });
    }

    // إضافة تقرير جديد
    review.reports.push({
      userId,
      reason,
      createdAt: new Date()
    });

    await review.save();

    res.json({ message: 'تم الإبلاغ عن المراجعة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء الإبلاغ عن المراجعة', error: error.message });
  }
};

// اعتدال المراجعة (للمسؤولين فقط)
exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action } = req.body; // 'approve' أو 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'الإجراء غير صالح. يجب أن يكون "approve" أو "reject"' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'المراجعة غير موجودة' });
    }

    // تحديث حالة المراجعة
    review.status = action === 'approve' ? 
      constants.REVIEW_STATUS.APPROVED : 
      constants.REVIEW_STATUS.REJECTED;

    await review.save();

    // إذا تمت الموافقة على المراجعة، قم بتحديث تقييم المنتج أو البائع
    if (action === 'approve' && review.reviewType === constants.REVIEW_TYPE.PRODUCT) {
      // تحديث متوسط تقييم المنتج وعدد المراجعات
      const product = await Product.findById(review.productId);
      if (product) {
        // حساب متوسط التقييم الجديد
        const approvedReviews = await Review.find({
          productId: review.productId,
          reviewType: constants.REVIEW_TYPE.PRODUCT,
          status: constants.REVIEW_STATUS.APPROVED
        });
        
        const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = approvedReviews.length > 0 ? totalRating / approvedReviews.length : 0;
        
        // تحديث المنتج
        product.rating = averageRating;
        product.reviewCount = approvedReviews.length;
        await product.save();
      }
    }
    // يمكن إضافة منطق مماثل لتحديث تقييم البائع إذا لزم الأمر

    res.json({ 
      message: action === 'approve' ? 'تمت الموافقة على المراجعة بنجاح' : 'تم رفض المراجعة بنجاح',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء اعتدال المراجعة', error: error.message });
  }
};

// جلب جميع المراجعات المعلقة (للمسؤولين فقط)
exports.getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ status: constants.REVIEW_STATUS.PENDING })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'username avatar')
        .populate('productId', 'name imageUrl')
        .populate('vendorId', 'storeName'),
      Review.countDocuments({ status: constants.REVIEW_STATUS.PENDING })
    ]);

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPendingReviews: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المراجعات المعلقة', error: error.message });
  }
};

// جلب المراجعات المبلغ عنها (للمسؤولين فقط)
exports.getReportedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    // البحث عن المراجعات التي تحتوي على تقارير
    const [reviews, total] = await Promise.all([
      Review.find({ 'reports.0': { $exists: true } })
        .sort({ 'reports.length': -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'username avatar')
        .populate('productId', 'name imageUrl')
        .populate('vendorId', 'storeName'),
      Review.countDocuments({ 'reports.0': { $exists: true } })
    ]);

    res.json({
      reviews,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReportedReviews: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المراجعات المبلغ عنها', error: error.message });
  }
};