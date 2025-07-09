// order-service/controllers/analyticsController.js
const Analytics = require('../models/mysql-analytics');
const Order = require('../models/mysql-order');

// الحصول على تحليلات المبيعات
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period, startDate, endDate } = req.query;
    
    if (!storeId || !period || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى توفير معرف المتجر والفترة الزمنية وتاريخ البداية والنهاية' 
      });
    }
    
    // الحصول على تحليلات المبيعات باستخدام نموذج MySQL
    const result = await Analytics.getSalesAnalytics(
      parseInt(storeId), 
      period, 
      new Date(startDate), 
      new Date(endDate)
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المبيعات:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة طلبك',
      error: error.message
    });
  }
};

// الحصول على تحليلات العملاء
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period, startDate, endDate } = req.query;
    
    if (!storeId || !period || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى توفير معرف المتجر والفترة الزمنية وتاريخ البداية والنهاية' 
      });
    }
    
    // الحصول على تحليلات العملاء باستخدام نموذج MySQL
    const result = await Analytics.getCustomerAnalytics(
      parseInt(storeId), 
      period, 
      new Date(startDate), 
      new Date(endDate)
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات العملاء:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة طلبك',
      error: error.message
    });
  }
};

// الحصول على تحليلات المخزون
exports.getInventoryAnalytics = async (req, res) => {
  try {
    const { storeId } = req.params;
    
    if (!storeId) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى توفير معرف المتجر' 
      });
    }
    
    // الحصول على تحليلات المخزون باستخدام نموذج MySQL
    const result = await Analytics.getInventoryAnalytics(parseInt(storeId));
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المخزون:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة طلبك',
      error: error.message
    });
  }
};

/**
 * الحصول على أداء المنتجات
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.getProductPerformance = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    // التحقق من صحة البيانات
    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى توفير معرف المتجر وتاريخ البداية والنهاية' 
      });
    }
    
    // الحصول على أداء المنتجات
    const result = await Analytics.getProductPerformance(
      parseInt(storeId), 
      new Date(startDate), 
      new Date(endDate),
      limit ? parseInt(limit) : 20
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('خطأ في الحصول على أداء المنتجات:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة طلبك',
      error: error.message
    });
  }
};

/**
 * الحصول على لوحة معلومات المتجر
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
exports.getStoreDashboard = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { period, startDate, endDate } = req.query;
    
    // التحقق من صحة البيانات
    if (!storeId || !period || !startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'يرجى توفير معرف المتجر والفترة الزمنية وتاريخ البداية والنهاية' 
      });
    }
    
    // الحصول على جميع التحليلات بالتوازي
    const [salesResult, customerResult, inventoryResult, productResult] = await Promise.all([
      Analytics.getSalesAnalytics(parseInt(storeId), period, new Date(startDate), new Date(endDate)),
      Analytics.getCustomerAnalytics(parseInt(storeId), period, new Date(startDate), new Date(endDate)),
      Analytics.getInventoryAnalytics(parseInt(storeId)),
      Analytics.getProductPerformance(parseInt(storeId), new Date(startDate), new Date(endDate), 5)
    ]);
    
    // التحقق من نجاح جميع العمليات
    if (!salesResult.success || !customerResult.success || !inventoryResult.success || !productResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'حدث خطأ أثناء الحصول على بيانات لوحة المعلومات',
        errors: {
          sales: salesResult.error,
          customer: customerResult.error,
          inventory: inventoryResult.error,
          product: productResult.error
        }
      });
    }
    
    // تجميع البيانات
    const dashboard = {
      storeId: parseInt(storeId),
      period,
      startDate,
      endDate,
      sales: salesResult.salesAnalytics,
      customers: customerResult.customerAnalytics,
      inventory: inventoryResult.inventoryAnalytics,
      topProducts: productResult.productPerformance
    };
    
    return res.status(200).json({ success: true, dashboard });
  } catch (error) {
    console.error('خطأ في الحصول على لوحة معلومات المتجر:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء معالجة طلبك',
      error: error.message
    });
  }
};

module.exports = {
  getSalesAnalytics: exports.getSalesAnalytics,
  getCustomerAnalytics: exports.getCustomerAnalytics,
  getInventoryAnalytics: exports.getInventoryAnalytics,
  getProductPerformance: exports.getProductPerformance,
  getStoreDashboard: exports.getStoreDashboard
};