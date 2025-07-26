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
    const { storeId = '1', period = 'monthly' } = req.query;

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
    const { storeId = '1', period = 'monthly' } = req.query;

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
    const { storeId = '1', period = 'monthly' } = req.query;

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

/**
 * @desc    الحصول على تحليلات المنتجات
 * @route   GET /analytics/products
 * @access  Private
 */
const getProductAnalytics = async (req, res) => {
  try {
    const { storeId = '1', period = 'monthly' } = req.query;

    // إنشاء بيانات تحليلات وهمية للمنتجات
    const productAnalytics = {
      storeId,
      period,
      totalProducts: 150,
      activeProducts: 142,
      outOfStockProducts: 8,
      topSellingProducts: [
        {
          id: 1,
          name: 'منتج رقم 1',
          sales: 85,
          revenue: 4250
        },
        {
          id: 2,
          name: 'منتج رقم 2',
          sales: 72,
          revenue: 3600
        },
        {
          id: 3,
          name: 'منتج رقم 3',
          sales: 68,
          revenue: 3400
        }
      ],
      categoryBreakdown: {
        'إلكترونيات': 45,
        'ملابس': 38,
        'منزل وحديقة': 32,
        'رياضة': 25,
        'أخرى': 10
      },
      averageRating: 4.2,
      totalReviews: 1247,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: productAnalytics
    });
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المنتجات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على تحليلات المنتجات',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على التحليلات العامة
 * @route   GET /analytics
 * @access  Private
 */
const getGeneralAnalytics = async (req, res) => {
  try {
    const { storeId = '1', period = 'monthly' } = req.query;

    // إنشاء بيانات تحليلات عامة شاملة
    const generalAnalytics = {
      storeId,
      period,
      overview: {
        totalRevenue: 125000,
        totalOrders: 1250,
        totalCustomers: 850,
        totalProducts: 150,
        averageOrderValue: 100
      },
      salesTrend: {
        thisMonth: 125000,
        lastMonth: 118000,
        growth: 5.9
      },
      topMetrics: {
        bestSellingProduct: 'منتج رقم 1',
        topCustomer: 'عميل مميز',
        peakSalesDay: 'الجمعة',
        conversionRate: 3.2
      },
      recentActivity: {
        newOrders: 45,
        newCustomers: 12,
        productViews: 2340,
        cartAbandonment: 15.8
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: generalAnalytics
    });
  } catch (error) {
    console.error('خطأ في الحصول على التحليلات العامة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على التحليلات العامة',
      error: error.message
    });
  }
};

module.exports = {
  getSalesAnalytics,
  updateSalesAnalytics,
  getCustomerAnalytics,
  getInventoryAnalytics,
  getProductAnalytics,
  getGeneralAnalytics
};