// order-service/models/mysql-analytics.js
const { pool } = require('../config/database');
require('dotenv').config();

/**
 * الحصول على تحليلات المبيعات
 * @param {number} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية (daily, weekly, monthly, yearly, custom)
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getSalesAnalytics(storeId, period, startDate, endDate) {
  try {
    // التحقق من صحة البيانات
    if (!storeId || !period || !startDate || !endDate) {
      return { 
        success: false, 
        error: 'يرجى توفير معرف المتجر والفترة الزمنية وتاريخ البداية والنهاية' 
      };
    }
    
    // تحويل التواريخ إلى تنسيق SQL
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // الحصول على إجمالي الإيرادات وعدد الطلبات
    const [revenueResult] = await pool.execute(
      `SELECT 
        SUM(total_amount) as totalRevenue, 
        COUNT(*) as totalOrders,
        AVG(total_amount) as averageOrderValue
       FROM orders 
       WHERE store_id = ? AND created_at BETWEEN ? AND ?`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const totalRevenue = revenueResult[0].totalRevenue || 0;
    const totalOrders = revenueResult[0].totalOrders || 0;
    const averageOrderValue = revenueResult[0].averageOrderValue || 0;
    
    // الحصول على الإيرادات حسب الفئة
    const [categoryResult] = await pool.execute(
      `SELECT 
        c.name as category, 
        SUM(oi.price * oi.quantity) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       WHERE o.store_id = ? AND o.created_at BETWEEN ? AND ?
       GROUP BY c.id`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const revenueByCategory = {};
    categoryResult.forEach(item => {
      revenueByCategory[item.category] = item.revenue;
    });
    
    // الحصول على الطلبات حسب الحالة
    const [statusResult] = await pool.execute(
      `SELECT 
        status, 
        COUNT(*) as count
       FROM orders 
       WHERE store_id = ? AND created_at BETWEEN ? AND ?
       GROUP BY status`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const ordersByStatus = {};
    statusResult.forEach(item => {
      ordersByStatus[item.status] = item.count;
    });
    
    // الحصول على المبيعات اليومية
    const [dailySalesResult] = await pool.execute(
      `SELECT 
        DATE(created_at) as date, 
        SUM(total_amount) as revenue, 
        COUNT(*) as orders
       FROM orders 
       WHERE store_id = ? AND created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    // تنسيق البيانات
    const salesAnalytics = {
      storeId,
      period,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByCategory,
      ordersByStatus,
      dailySales: dailySalesResult
    };
    
    return { success: true, salesAnalytics };
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المبيعات:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على تحليلات العملاء
 * @param {number} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية (daily, weekly, monthly, yearly, custom)
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getCustomerAnalytics(storeId, period, startDate, endDate) {
  try {
    // التحقق من صحة البيانات
    if (!storeId || !period || !startDate || !endDate) {
      return { 
        success: false, 
        error: 'يرجى توفير معرف المتجر والفترة الزمنية وتاريخ البداية والنهاية' 
      };
    }
    
    // تحويل التواريخ إلى تنسيق SQL
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // الحصول على إجمالي العملاء
    const [totalCustomersResult] = await pool.execute(
      `SELECT COUNT(DISTINCT user_id) as totalCustomers
       FROM orders 
       WHERE store_id = ? AND created_at BETWEEN ? AND ?`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const totalCustomers = totalCustomersResult[0].totalCustomers || 0;
    
    // الحصول على العملاء الجدد (الذين قاموا بطلبهم الأول خلال الفترة)
    const [newCustomersResult] = await pool.execute(
      `SELECT COUNT(*) as newCustomers
       FROM (
         SELECT user_id, MIN(created_at) as first_order_date
         FROM orders
         GROUP BY user_id
         HAVING first_order_date BETWEEN ? AND ?
       ) as first_orders
       WHERE first_orders.first_order_date BETWEEN ? AND ?`,
      [formattedStartDate, formattedEndDate, formattedStartDate, formattedEndDate]
    );
    
    const newCustomers = newCustomersResult[0].newCustomers || 0;
    
    // الحصول على العملاء المتكررين (الذين قاموا بأكثر من طلب)
    const [repeatCustomersResult] = await pool.execute(
      `SELECT COUNT(*) as repeatCustomers
       FROM (
         SELECT user_id, COUNT(*) as order_count
         FROM orders
         WHERE store_id = ? AND created_at BETWEEN ? AND ?
         GROUP BY user_id
         HAVING order_count > 1
       ) as repeat_customers`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const repeatCustomers = repeatCustomersResult[0].repeatCustomers || 0;
    
    // حساب معدل الاحتفاظ بالعملاء
    const customerRetentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
    
    // الحصول على العملاء حسب المنطقة
    const [regionResult] = await pool.execute(
      `SELECT 
        a.state as region, 
        COUNT(DISTINCT o.user_id) as count
       FROM orders o
       JOIN addresses a ON o.shipping_address_id = a.id
       WHERE o.store_id = ? AND o.created_at BETWEEN ? AND ?
       GROUP BY a.state`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const customersByRegion = {};
    regionResult.forEach(item => {
      customersByRegion[item.region] = item.count;
    });
    
    // الحصول على شرائح العملاء (مثال: حسب قيمة الطلب)
    const [segmentsResult] = await pool.execute(
      `SELECT 
        CASE 
          WHEN avg_order_value < 100 THEN 'منخفض القيمة'
          WHEN avg_order_value BETWEEN 100 AND 500 THEN 'متوسط القيمة'
          ELSE 'عالي القيمة'
        END as segment_name,
        COUNT(*) as count,
        AVG(avg_order_value) as average_order_value
       FROM (
         SELECT 
           user_id, 
           AVG(total_amount) as avg_order_value
         FROM orders
         WHERE store_id = ? AND created_at BETWEEN ? AND ?
         GROUP BY user_id
       ) as customer_avg
       GROUP BY segment_name`,
      [storeId, formattedStartDate, formattedEndDate]
    );
    
    const segments = segmentsResult.map(segment => ({
      name: segment.segment_name,
      count: segment.count,
      percentage: totalCustomers > 0 ? (segment.count / totalCustomers) * 100 : 0,
      averageOrderValue: segment.average_order_value,
      description: getSegmentDescription(segment.segment_name)
    }));
    
    // تنسيق البيانات
    const customerAnalytics = {
      storeId,
      period,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      totalCustomers,
      newCustomers,
      repeatCustomers,
      customerRetentionRate,
      customersByRegion,
      segments
    };
    
    return { success: true, customerAnalytics };
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات العملاء:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على تحليلات المخزون
 * @param {number} storeId - معرف المتجر
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getInventoryAnalytics(storeId) {
  try {
    // التحقق من صحة البيانات
    if (!storeId) {
      return { 
        success: false, 
        error: 'يرجى توفير معرف المتجر' 
      };
    }
    
    // الحصول على إجمالي المنتجات
    const [totalProductsResult] = await pool.execute(
      `SELECT COUNT(*) as totalProducts
       FROM products 
       WHERE store_id = ?`,
      [storeId]
    );
    
    const totalProducts = totalProductsResult[0].totalProducts || 0;
    
    // الحصول على إجمالي قيمة المخزون
    const [stockValueResult] = await pool.execute(
      `SELECT SUM(price * stock_quantity) as totalStockValue
       FROM products 
       WHERE store_id = ?`,
      [storeId]
    );
    
    const totalStockValue = stockValueResult[0].totalStockValue || 0;
    
    // الحصول على المنتجات منخفضة المخزون
    const [lowStockResult] = await pool.execute(
      `SELECT COUNT(*) as lowStockProducts
       FROM products 
       WHERE store_id = ? AND stock_quantity <= low_stock_threshold`,
      [storeId]
    );
    
    const lowStockProducts = lowStockResult[0].lowStockProducts || 0;
    
    // الحصول على المنتجات نافدة المخزون
    const [outOfStockResult] = await pool.execute(
      `SELECT COUNT(*) as outOfStockProducts
       FROM products 
       WHERE store_id = ? AND stock_quantity = 0`,
      [storeId]
    );
    
    const outOfStockProducts = outOfStockResult[0].outOfStockProducts || 0;
    
    // الحصول على المنتجات الأكثر مبيعًا
    const [topSellingResult] = await pool.execute(
      `SELECT 
        p.id, 
        p.name, 
        SUM(oi.quantity) as total_sold
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE p.store_id = ?
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 10`,
      [storeId]
    );
    
    // تنسيق البيانات
    const inventoryAnalytics = {
      storeId,
      date: new Date().toISOString().split('T')[0],
      totalProducts,
      totalStockValue,
      lowStockProducts,
      outOfStockProducts,
      topSellingProducts: topSellingResult
    };
    
    return { success: true, inventoryAnalytics };
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المخزون:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على أداء المنتجات
 * @param {number} storeId - معرف المتجر
 * @param {Date} startDate - تاريخ البداية
 * @param {Date} endDate - تاريخ النهاية
 * @param {number} limit - عدد المنتجات المراد عرضها
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getProductPerformance(storeId, startDate, endDate, limit = 20) {
  try {
    // التحقق من صحة البيانات
    if (!storeId || !startDate || !endDate) {
      return { 
        success: false, 
        error: 'يرجى توفير معرف المتجر وتاريخ البداية والنهاية' 
      };
    }
    
    // تحويل التواريخ إلى تنسيق SQL
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // الحصول على أداء المنتجات
    const [productPerformanceResult] = await pool.execute(
      `SELECT 
        p.id as productId, 
        p.name as productName, 
        SUM(oi.quantity) as totalUnits, 
        SUM(oi.price * oi.quantity) as totalRevenue,
        COUNT(DISTINCT o.id) as totalSales,
        AVG(IFNULL(r.rating, 0)) as averageRating
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN reviews r ON p.id = r.product_id
       WHERE p.store_id = ? AND o.created_at BETWEEN ? AND ?
       GROUP BY p.id
       ORDER BY totalRevenue DESC
       LIMIT ?`,
      [storeId, formattedStartDate, formattedEndDate, limit]
    );
    
    return { success: true, productPerformance: productPerformanceResult };
  } catch (error) {
    console.error('خطأ في الحصول على أداء المنتجات:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على وصف شريحة العملاء
 * @param {string} segmentName - اسم الشريحة
 * @returns {string} - وصف الشريحة
 */
function getSegmentDescription(segmentName) {
  const descriptions = {
    'منخفض القيمة': 'عملاء يقومون بطلبات ذات قيمة منخفضة (أقل من 100)',
    'متوسط القيمة': 'عملاء يقومون بطلبات ذات قيمة متوسطة (بين 100 و 500)',
    'عالي القيمة': 'عملاء يقومون بطلبات ذات قيمة عالية (أكثر من 500)'
  };
  
  return descriptions[segmentName] || '';
}

module.exports = {
  pool,
  getSalesAnalytics,
  getCustomerAnalytics,
  getInventoryAnalytics,
  getProductPerformance
};