/**
 * وحدة معالجة الاستجابات الموحدة
 * توفر هيكل استجابة موحد لجميع الخدمات
 */

/**
 * إنشاء استجابة نجاح موحدة
 * @param {Object} res - كائن الاستجابة من Express
 * @param {Number} statusCode - رمز حالة HTTP
 * @param {String} message - رسالة نجاح
 * @param {Object|Array} data - البيانات المراد إرجاعها
 * @param {Object} meta - بيانات وصفية إضافية (اختياري)
 */
exports.successResponse = (res, statusCode = 200, message = 'تمت العملية بنجاح', data = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
    timestamp: new Date().toISOString()
  });
};

/**
 * إنشاء استجابة خطأ موحدة
 * @param {Object} res - كائن الاستجابة من Express
 * @param {Number} statusCode - رمز حالة HTTP
 * @param {String} message - رسالة الخطأ
 * @param {Object} errors - تفاصيل الأخطاء (اختياري)
 */
exports.errorResponse = (res, statusCode = 500, message = 'حدث خطأ في الخادم', errors = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * إنشاء استجابة للبيانات المصفحة
 * @param {Object} res - كائن الاستجابة من Express
 * @param {Number} statusCode - رمز حالة HTTP
 * @param {String} message - رسالة نجاح
 * @param {Array} data - البيانات المراد إرجاعها
 * @param {Object} pagination - معلومات التصفيح
 * @param {Object} meta - بيانات وصفية إضافية (اختياري)
 */
exports.paginatedResponse = (res, statusCode = 200, message = 'تمت العملية بنجاح', data = [], pagination = {}, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      total: pagination.total || 0,
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      pages: pagination.pages || 1,
      ...pagination
    },
    meta,
    timestamp: new Date().toISOString()
  });
};