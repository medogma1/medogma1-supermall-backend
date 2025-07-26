// product-service/models/Review.js
const { pool } = require('../config/database');

// Constants
const MIN_RATING = 1;
const MAX_RATING = 5;
const MAX_COMMENT_LENGTH = 500;

// Review Status Enum
const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Review Type Enum
const REVIEW_TYPE = {
  PRODUCT: 'product',
  VENDOR: 'vendor'
};

class Review {
  // إنشاء مراجعة جديدة
  static async create(reviewData) {
    try {
      const { userId, reviewType, productId, vendorId, rating, comment } = reviewData;
      
      // التحقق من صحة البيانات
      if (rating < MIN_RATING || rating > MAX_RATING) {
        throw new Error(`التقييم يجب أن يكون بين ${MIN_RATING} و ${MAX_RATING}`);
      }
      
      if (comment.length > MAX_COMMENT_LENGTH) {
        throw new Error(`التعليق لا يمكن أن يتجاوز ${MAX_COMMENT_LENGTH} حرف`);
      }
      
      if (reviewType === REVIEW_TYPE.PRODUCT && !productId) {
        throw new Error('معرف المنتج مطلوب للمراجعات من نوع المنتج');
      }
      
      if (reviewType === REVIEW_TYPE.VENDOR && !vendorId) {
        throw new Error('معرف البائع مطلوب للمراجعات من نوع البائع');
      }
      
      // التحقق من عدم وجود مراجعة سابقة لنفس المستخدم والمنتج/البائع
      let existingReview;
      if (reviewType === REVIEW_TYPE.PRODUCT) {
        existingReview = await this.findByUserAndProduct(userId, productId);
      } else {
        existingReview = await this.findByUserAndVendor(userId, vendorId);
      }
      
      if (existingReview) {
        throw new Error('لديك مراجعة سابقة بالفعل');
      }
      
      // إنشاء المراجعة
      const status = reviewData.status || REVIEW_STATUS.PENDING;
      const [result] = await pool.execute(
        `INSERT INTO reviews 
        (user_id, review_type, product_id, vendor_id, rating, comment, status, reports, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [userId, reviewType, productId || null, vendorId || null, rating, comment, status, '[]']
      );
      
      if (result.insertId) {
        // تحديث متوسط التقييم للمنتج أو البائع
        if (reviewType === REVIEW_TYPE.PRODUCT && productId) {
          await this.updateProductRating(productId);
        }
        
        return this.findById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء المراجعة:', error);
      throw error;
    }
  }

  // البحث عن مراجعة بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM reviews WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      const review = rows[0];
      
      // تحويل التقارير من JSON إلى كائن
      try {
        const parsed = JSON.parse(review.reports || '[]');
        review.reports = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse reports JSON for review', review.id, ':', e.message);
        review.reports = [];
      }
      
      return this.formatReview(review);
    } catch (error) {
      console.error('خطأ في البحث عن المراجعة بواسطة المعرف:', error);
      throw error;
    }
  }

  // البحث عن مراجعة بواسطة المستخدم والمنتج
  static async findByUserAndProduct(userId, productId) {
    try {
      // التحقق من أن المعاملات ليست undefined
      if (userId === undefined || productId === undefined) {
        console.error('خطأ: معاملات البحث تحتوي على قيم undefined', { userId, productId });
        return null;
      }
      
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE user_id = ? AND product_id = ?',
        [userId, productId]
      );
      
      if (rows.length === 0) return null;
      
      const review = rows[0];
      try {
        const parsed = JSON.parse(review.reports || '[]');
        review.reports = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse reports JSON for review', review.id, ':', e.message);
        review.reports = [];
      }
      
      return this.formatReview(review);
    } catch (error) {
      console.error('خطأ في البحث عن المراجعة بواسطة المستخدم والمنتج:', error);
      throw error;
    }
  }

  // البحث عن مراجعة بواسطة المستخدم والبائع
  static async findByUserAndVendor(userId, vendorId) {
    try {
      // التحقق من أن المعاملات ليست undefined
      if (userId === undefined || vendorId === undefined) {
        console.error('خطأ: معاملات البحث تحتوي على قيم undefined', { userId, vendorId });
        return null;
      }
      
      const [rows] = await pool.execute(
        'SELECT * FROM reviews WHERE user_id = ? AND vendor_id = ?',
        [userId, vendorId]
      );
      
      if (rows.length === 0) return null;
      
      const review = rows[0];
      
      // تحويل التقارير من JSON إلى كائن مع معالجة آمنة للأخطاء
      try {
        const parsed = JSON.parse(review.reports || '[]');
        review.reports = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.warn('Failed to parse reports JSON for review', review.id, ':', e.message);
        review.reports = [];
      }
      
      return this.formatReview(review);
    } catch (error) {
      console.error('خطأ في البحث عن المراجعة بواسطة المستخدم والبائع:', error);
      throw error;
    }
  }

  // الحصول على مراجعات المنتج
  static async findByProduct(productId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM reviews WHERE product_id = ?';
      const queryParams = [productId];
      
      if (status) {
        query += ' AND status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const [rows] = await pool.execute(query, queryParams);
      
      // تحويل التقارير من JSON إلى كائج لكل مراجعة
      const reviews = rows.map(review => {
        try {
          const parsed = JSON.parse(review.reports || '[]');
          // التأكد من أن النتيجة مصفوفة
          review.reports = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('Failed to parse reports JSON for review', review.id, ':', e.message);
          review.reports = [];
        }
        return this.formatReview(review);
      });
      
      // الحصول على العدد الإجمالي للمراجعات
      let countQuery = 'SELECT COUNT(*) as total FROM reviews WHERE product_id = ?';
      const countParams = [productId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countRows] = await pool.execute(countQuery, countParams);
      
      return {
        reviews,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في الحصول على مراجعات المنتج:', error);
      throw error;
    }
  }

  // الحصول على مراجعات البائع
  static async findByVendor(vendorId, options = {}) {
    try {
      const { page = 1, limit = 10, status } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM reviews WHERE vendor_id = ?';
      const queryParams = [vendorId];
      
      if (status) {
        query += ' AND status = ?';
        queryParams.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const [rows] = await pool.execute(query, queryParams);
      
      // تحويل التقارير من JSON إلى كائن لكل مراجعة
      const reviews = rows.map(review => {
        try {
          const parsed = JSON.parse(review.reports || '[]');
          // التأكد من أن النتيجة مصفوفة
          review.reports = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('Failed to parse reports JSON for review', review.id, ':', e.message);
          review.reports = [];
        }
        return this.formatReview(review);
      });
      
      // الحصول على العدد الإجمالي للمراجعات
      let countQuery = 'SELECT COUNT(*) as total FROM reviews WHERE vendor_id = ?';
      const countParams = [vendorId];
      
      if (status) {
        countQuery += ' AND status = ?';
        countParams.push(status);
      }
      
      const [countRows] = await pool.execute(countQuery, countParams);
      
      return {
        reviews,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في الحصول على مراجعات البائع:', error);
      throw error;
    }
  }

  // تحديث حالة المراجعة
  static async updateStatus(id, status) {
    try {
      if (!Object.values(REVIEW_STATUS).includes(status)) {
        throw new Error('حالة المراجعة غير صالحة');
      }
      
      const [result] = await pool.execute(
        'UPDATE reviews SET status = ?, updated_at = NOW() WHERE id = ?',
        [status, id]
      );
      
      if (result.affectedRows > 0) {
        const review = await this.findById(id);
        
        // إذا تم تغيير الحالة، قم بتحديث متوسط التقييم للمنتج أو البائع
        if (review) {
          if (review.reviewType === REVIEW_TYPE.PRODUCT && review.productId) {
            await this.updateProductRating(review.productId);
          }
        }
        
        return review;
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في تحديث حالة المراجعة:', error);
      throw error;
    }
  }

  // إضافة تقرير عن مراجعة
  static async addReport(id, reportData) {
    try {
      const { userId, reason } = reportData;
      
      // الحصول على المراجعة الحالية
      const review = await this.findById(id);
      if (!review) {
        throw new Error('المراجعة غير موجودة');
      }
      
      // التحقق مما إذا كان المستخدم قد أبلغ بالفعل عن هذه المراجعة
      const existingReport = review.reports.find(report => report.userId === userId);
      if (existingReport) {
        throw new Error('لقد قمت بالإبلاغ عن هذه المراجعة بالفعل');
      }
      
      // إضافة التقرير الجديد
      const newReport = {
        userId,
        reason,
        createdAt: new Date()
      };
      
      const reports = [...review.reports, newReport];
      
      // تحديث المراجعة بالتقرير الجديد
      const [result] = await pool.execute(
        'UPDATE reviews SET reports = ?, updated_at = NOW() WHERE id = ?',
        [JSON.stringify(reports), id]
      );
      
      if (result.affectedRows > 0) {
        return this.findById(id);
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في إضافة تقرير عن مراجعة:', error);
      throw error;
    }
  }

  // تحديث متوسط تقييم المنتج
  static async updateProductRating(productId) {
    try {
      // حساب متوسط التقييم من المراجعات المعتمدة فقط
      const [rows] = await pool.execute(
        'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ? AND status = ?',
        [productId, REVIEW_STATUS.APPROVED]
      );
      
      const avgRating = rows[0].avg_rating || 0;
      const reviewCount = rows[0].count || 0;
      
      // تحديث المنتج بمتوسط التقييم وعدد المراجعات
      await pool.execute(
        'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
        [avgRating, reviewCount, productId]
      );
      
      return { avgRating, reviewCount };
    } catch (error) {
      console.error('خطأ في تحديث متوسط تقييم المنتج:', error);
      throw error;
    }
  }

  // البحث عن مراجعات بواسطة المستخدم
  static async findByUser(userId, conditions = {}) {
    try {
      let query = 'SELECT * FROM reviews WHERE user_id = ?';
      const queryParams = [userId];
      
      // إضافة الشروط الإضافية
      if (conditions.productId !== undefined && conditions.productId !== null) {
        query += ' AND product_id = ?';
        queryParams.push(conditions.productId);
      }
      
      if (conditions.vendorId !== undefined && conditions.vendorId !== null) {
        query += ' AND vendor_id = ?';
        queryParams.push(conditions.vendorId);
      }
      
      if (conditions.reviewType) {
        query += ' AND review_type = ?';
        queryParams.push(conditions.reviewType);
      }
      
      if (conditions.status) {
        query += ' AND status = ?';
        queryParams.push(conditions.status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const [rows] = await pool.execute(query, queryParams);
      
      // تحويل التقارير من JSON إلى كائن لكل مراجعة
      const reviews = rows.map(review => {
        review.reports = JSON.parse(review.reports || '[]');
        return this.formatReview(review);
      });
      
      return reviews;
    } catch (error) {
      console.error('خطأ في البحث عن مراجعات المستخدم:', error);
      throw error;
    }
  }

  // دالة find عامة للبحث في المراجعات
  static async find(conditions = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = 'created_at DESC' } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM reviews WHERE 1=1';
      const queryParams = [];
      
      // إضافة الشروط
      if (conditions.userId) {
        query += ' AND user_id = ?';
        queryParams.push(conditions.userId);
      }
      
      if (conditions.productId) {
        query += ' AND product_id = ?';
        queryParams.push(conditions.productId);
      }
      
      if (conditions.vendorId) {
        query += ' AND vendor_id = ?';
        queryParams.push(conditions.vendorId);
      }
      
      if (conditions.reviewType) {
        query += ' AND review_type = ?';
        queryParams.push(conditions.reviewType);
      }
      
      if (conditions.status) {
        query += ' AND status = ?';
        queryParams.push(conditions.status);
      }
      
      // إضافة الترتيب والحد
      query += ` ORDER BY ${sort} LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
      
      const [rows] = await pool.execute(query, queryParams);
      
      // تحويل التقارير من JSON إلى كائن لكل مراجعة
      const reviews = rows.map(review => {
        review.reports = JSON.parse(review.reports || '[]');
        return this.formatReview(review);
      });
      
      return reviews;
    } catch (error) {
      console.error('خطأ في البحث العام في المراجعات:', error);
      throw error;
    }
  }

  // تنسيق المراجعة (تحويل snake_case إلى camelCase)
  static formatReview(review) {
    return {
      id: review.id,
      userId: review.user_id,
      reviewType: review.review_type,
      productId: review.product_id,
      vendorId: review.vendor_id,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      reports: review.reports,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      // دوال مساعدة
      isApproved: () => review.status === REVIEW_STATUS.APPROVED,
      isPending: () => review.status === REVIEW_STATUS.PENDING,
      isRejected: () => review.status === REVIEW_STATUS.REJECTED,
      isReported: () => review.reports.length > 0,
      getStatusText: () => {
        switch(review.status) {
          case REVIEW_STATUS.PENDING: return 'قيد المراجعة';
          case REVIEW_STATUS.APPROVED: return 'تمت الموافقة';
          case REVIEW_STATUS.REJECTED: return 'مرفوض';
          default: return 'غير معروف';
        }
      }
    };
  }
}

module.exports = {
  Review,
  constants: {
    MIN_RATING,
    MAX_RATING,
    MAX_COMMENT_LENGTH,
    REVIEW_STATUS,
    REVIEW_TYPE
  }
};