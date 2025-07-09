// analytics-service/controllers/analyticsController.js
const salesAnalyticsModel = require('../models/mysql-sales-analytics');
const customerAnalyticsModel = require('../models/mysql-customer-analytics');
const inventoryAnalyticsModel = require('../models/mysql-inventory-analytics');
const analyticsModel = require('../models/mysql-analytics');

/**
 * @desc    الحصول على تحليلات المبيعات
 * @route   GET /analytics/sales
 * @access  Private
 */
const getSalesAnalytics = async (req, res) => {
  try {
    const { storeId, period } = req.query;

    if (!storeId || !period) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المتجر والفترة الزمنية'
      });
    }

    // البحث عن تحليلات المبيعات الموجودة
    let salesAnalytics = await salesAnalyticsModel.getSalesAnalytics(storeId, period);

    if (salesAnalytics) {
      return res.status(200).json({
        success: true,
        data: salesAnalytics
      });
    }

    // إذا لم يتم العثور على تحليلات، قم بإنشاء تحليلات جديدة
    const result = await salesAnalyticsModel.createDummySalesAnalytics(storeId, period);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إنشاء تحليلات المبيعات',
        error: result.error
      });
    }
    
    // الحصول على التحليلات بعد إنشائها
    salesAnalytics = await salesAnalyticsModel.getSalesAnalytics(storeId, period);

    res.status(200).json({
      success: true,
      data: salesAnalytics
    });
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المبيعات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على تحليلات المبيعات',
      error: error.message
    });
  }
};

/**
 * @desc    تحديث تحليلات المبيعات
 * @route   PUT /analytics/sales/:id
 * @access  Private
 */
const updateSalesAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'معرف غير صالح'
      });
    }

    const result = await salesAnalyticsModel.updateSalesAnalytics(id, updates);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'لم يتم العثور على تحليلات المبيعات'
      });
    }

    // الحصول على التحليلات المحدثة
    const salesAnalytics = await salesAnalyticsModel.getSalesAnalytics(updates.storeId, updates.period);

    res.status(200).json({
      success: true,
      data: salesAnalytics
    });
  } catch (error) {
    console.error('خطأ في تحديث تحليلات المبيعات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث تحليلات المبيعات',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تحليلات العملاء
 * @route   GET /analytics/customers
 * @access  Private
 */
const getCustomerAnalytics = async (req, res) => {
  try {
    const { storeId, period } = req.query;

    if (!storeId || !period) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المتجر والفترة الزمنية'
      });
    }

    // البحث عن تحليلات العملاء الموجودة
    let customerAnalytics = await customerAnalyticsModel.getCustomerAnalytics(storeId, period);

    if (customerAnalytics) {
      return res.status(200).json({
        success: true,
        data: customerAnalytics
      });
    }

    // إذا لم يتم العثور على تحليلات، قم بإنشاء تحليلات جديدة
    const result = await customerAnalyticsModel.createDummyCustomerAnalytics(storeId, period);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إنشاء تحليلات العملاء',
        error: result.error
      });
    }
    
    // الحصول على التحليلات بعد إنشائها
    customerAnalytics = await customerAnalyticsModel.getCustomerAnalytics(storeId, period);

    res.status(200).json({
      success: true,
      data: customerAnalytics
    });
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات العملاء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على تحليلات العملاء',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على تحليلات المخزون
 * @route   GET /analytics/inventory
 * @access  Private
 */
const getInventoryAnalytics = async (req, res) => {
  try {
    const { storeId, period } = req.query;

    if (!storeId || !period) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المتجر والفترة الزمنية'
      });
    }

    // البحث عن تحليلات المخزون الموجودة
    let inventoryAnalytics = await inventoryAnalyticsModel.getInventoryAnalytics(storeId, period);

    if (inventoryAnalytics) {
      return res.status(200).json({
        success: true,
        data: inventoryAnalytics
      });
    }

    // إذا لم يتم العثور على تحليلات، قم بإنشاء تحليلات جديدة
    const result = await inventoryAnalyticsModel.createDummyInventoryAnalytics(storeId, period);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إنشاء تحليلات المخزون',
        error: result.error
      });
    }
    
    // الحصول على التحليلات بعد إنشائها
    inventoryAnalytics = await inventoryAnalyticsModel.getInventoryAnalytics(storeId, period);

    res.status(200).json({
      success: true,
      data: inventoryAnalytics
    });
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المخزون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على تحليلات المخزون',
      error: error.message
    });
  }
};

module.exports = {
  getSalesAnalytics,
  updateSalesAnalytics,
  getCustomerAnalytics,
  getInventoryAnalytics
};