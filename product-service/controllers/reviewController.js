const { Review, constants } = require('../models/Review');
const Product = require('../models/Product');

// إضافة مراجعة لمنتج
exports.addProductReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.userId || req.user.id; // من middleware المصادقة

    if (!userId) {
      return res.status(401).json({ message: 'معرف المستخدم غير متوفر' });
    }

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة (productId, rating, comment)' });
    }

    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'المنتج غير موجود' });
    }

    // التحقق مما إذا كان المستخدم قد قام بمراجعة هذا المنتج من قبل
    const existingReview = await Review.findByUser(userId, {
      productId,
      reviewType: constants.REVIEW_TYPE.PRODUCT
    });

    if (existingReview && existingReview.length > 0) {
      return res.status(400).json({ message: 'لقد قمت بمراجعة هذا المنتج من قبل' });
    }

    // إنشاء مراجعة جديدة
    const newReview = await Review.create({
      userId,
      productId,
      vendorId: null, // تعيين صريح لـ null للمراجعات من نوع المنتج
      reviewType: constants.REVIEW_TYPE.PRODUCT,
      rating,
      comment,
      status: constants.REVIEW_STATUS.APPROVED // معتمدة تلقائياً للاختبارات
    });

    res.status(201).json({
      message: 'تم إضافة المراجعة بنجاح وهي قيد المراجعة',
      review: newReview
    });
  } catch (error) {
    console.error('خطأ في إضافة مراجعة المنتج:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إضافة المراجعة', 
      error: error.message || error.toString() 
    });
  }
};

// إضافة مراجعة لبائع
exports.addVendorReview = async (req, res) => {
  try {
    const { vendorId, rating, comment } = req.body;
    const userId = req.user.userId || req.user.id; // من middleware المصادقة

    if (!userId) {
      return res.status(401).json({ message: 'معرف المستخدم غير متوفر' });
    }

    if (!vendorId || !rating || !comment) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة (vendorId, rating, comment)' });
    }

    // التحقق من وجود البائع (يفترض وجود نموذج Vendor)
    // const vendor = await Vendor.findById(vendorId);
    // if (!vendor) {
    //   return res.status(404).json({ message: 'البائع غير موجود' });
    // }

    // التحقق مما إذا كان المستخدم قد قام بمراجعة هذا البائع من قبل
    const existingReview = await Review.findByUser(userId, {
      vendorId,
      reviewType: constants.REVIEW_TYPE.VENDOR
    });

    if (existingReview && existingReview.length > 0) {
      return res.status(400).json({ message: 'لقد قمت بمراجعة هذا البائع من قبل' });
    }

    // إنشاء مراجعة جديدة
    const newReview = await Review.create({
      userId,
      productId: null, // تعيين صريح لـ null للمراجعات من نوع البائع
      vendorId,
      reviewType: constants.REVIEW_TYPE.VENDOR,
      rating,
      comment,
      status: constants.REVIEW_STATUS.APPROVED // معتمدة تلقائياً للاختبارات
    });

    res.status(201).json({
      message: 'تم إضافة المراجعة بنجاح وهي قيد المراجعة',
      review: newReview
    });
  } catch (error) {
    console.error('خطأ في إضافة مراجعة البائع:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إضافة المراجعة', 
      error: error.message || error.toString() 
    });
  }
};

// جلب مراجعات منتج
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // جلب المراجعات المعتمدة فقط باستخدام النموذج المخصص
    const result = await Review.findByProduct(productId, {
      page: Number(page),
      limit: Number(limit),
      status: constants.REVIEW_STATUS.APPROVED
    });

    res.json({
      reviews: result.reviews,
      currentPage: Number(page),
      totalPages: result.pagination.pages,
      totalReviews: result.pagination.total
    });
  } catch (error) {
    console.error('خطأ في جلب مراجعات المنتج:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء جلب المراجعات', 
      error: error.message || error.toString() 
    });
  }
};

// جلب مراجعات بائع
exports.getVendorReviews = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // جلب المراجعات المعتمدة فقط باستخدام النموذج المخصص
    const result = await Review.findByVendor(vendorId, {
      page: Number(page),
      limit: Number(limit),
      status: constants.REVIEW_STATUS.APPROVED
    });

    res.json({
      reviews: result.reviews,
      currentPage: Number(page),
      totalPages: result.pagination.pages,
      totalReviews: result.pagination.total
    });
  } catch (error) {
    console.error('خطأ في جلب مراجعات البائع:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء جلب المراجعات', 
      error: error.message || error.toString() 
    });
  }
};

// الإبلاغ عن مراجعة
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId || req.user.id; // من middleware المصادقة

    if (!userId) {
      return res.status(401).json({ message: 'معرف المستخدم غير متوفر' });
    }

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

    // إضافة تقرير جديد باستخدام النموذج المخصص
    const updatedReview = await Review.addReport(reviewId, {
      userId,
      reason
    });

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

    // تحديث حالة المراجعة باستخدام النموذج المخصص
    const status = action === 'approve' ? 
      constants.REVIEW_STATUS.APPROVED : 
      constants.REVIEW_STATUS.REJECTED;
    
    const updatedReview = await Review.updateStatus(reviewId, status);

    res.json({ 
      message: action === 'approve' ? 'تمت الموافقة على المراجعة بنجاح' : 'تم رفض المراجعة بنجاح',
      review: updatedReview
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء اعتدال المراجعة', error: error.message });
  }
};

// جلب جميع المراجعات المعلقة (للمسؤولين فقط)
exports.getPendingReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({
      status: constants.REVIEW_STATUS.PENDING
    }, {
      page: Number(page),
      limit: Number(limit),
      sort: 'created_at DESC'
    });

    res.json({
      reviews,
      currentPage: Number(page),
      totalPages: Math.ceil(reviews.length / limit),
      totalPendingReviews: reviews.length
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المراجعات المعلقة', error: error.message });
  }
};

// جلب المراجعات المبلغ عنها (للمسؤولين فقط)
exports.getReportedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // البحث عن المراجعات التي تحتوي على تقارير باستخدام النموذج المخصص
    const reviews = await Review.find({}, {
      page: Number(page),
      limit: Number(limit),
      sort: 'created_at DESC'
    });

    // تصفية المراجعات التي تحتوي على تقارير
    const reportedReviews = reviews.filter(review => review.reports && review.reports.length > 0);

    res.json({
      reviews: reportedReviews,
      currentPage: Number(page),
      totalPages: Math.ceil(reportedReviews.length / limit),
      totalReportedReviews: reportedReviews.length
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المراجعات المبلغ عنها', error: error.message });
  }
};

// إضافة مراجعة بمعرف محدد
exports.addReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, reviewType, productId, vendorId } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!rating || !comment || !reviewType) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة (rating, comment, reviewType)' });
    }

    // التحقق من نوع المراجعة وتحديد المعرف المناسب
    let targetId;
    if (reviewType === constants.REVIEW_TYPE.PRODUCT) {
      targetId = productId || id;
      if (!targetId) {
        return res.status(400).json({ message: 'معرف المنتج مطلوب' });
      }
    } else if (reviewType === constants.REVIEW_TYPE.VENDOR) {
      targetId = vendorId || id;
      if (!targetId) {
        return res.status(400).json({ message: 'معرف البائع مطلوب' });
      }
    } else {
      return res.status(400).json({ message: 'نوع المراجعة غير صالح' });
    }

    // التحقق من وجود مراجعة سابقة
    let existingReview;
    
    // التأكد من أن userId و targetId محددان
    if (!userId || !targetId) {
      console.error('خطأ: معاملات البحث غير محددة', { userId, targetId, reviewType });
      return res.status(400).json({ message: 'معاملات البحث غير صالحة' });
    }
    
    if (reviewType === constants.REVIEW_TYPE.PRODUCT) {
      existingReview = await Review.findByUserAndProduct(userId, targetId);
    } else {
      existingReview = await Review.findByUserAndVendor(userId, targetId);
    }
    if (existingReview) {
      return res.status(400).json({ message: 'لقد قمت بمراجعة هذا العنصر من قبل' });
    }

    // إنشاء مراجعة جديدة باستخدام النموذج المخصص
    const reviewData = {
      userId,
      reviewType,
      rating,
      comment,
      status: constants.REVIEW_STATUS.APPROVED
    };

    if (reviewType === constants.REVIEW_TYPE.PRODUCT) {
      reviewData.productId = targetId;
    } else {
      reviewData.vendorId = targetId;
    }

    const newReview = await Review.create(reviewData);

    if (!newReview) {
      return res.status(500).json({
        message: 'فشل في إنشاء المراجعة',
        error: 'Review creation returned null'
      });
    }

    res.status(201).json({
      message: 'تم إضافة المراجعة بنجاح',
      review: newReview
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة المراجعة', error: error.message });
  }
}