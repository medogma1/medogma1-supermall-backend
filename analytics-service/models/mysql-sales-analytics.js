// analytics-service/models/mysql-sales-analytics.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

/**
 * إنشاء أو تحديث تحليلات المبيعات
 * @param {Object} salesData - بيانات تحليلات المبيعات
 */
async function createOrUpdateSalesAnalytics(salesData) {
  try {
    const { storeId, period, totalRevenue, totalOrders, averageOrderValue, revenueByCategory, ordersByStatus, dailySales } = salesData;
    
    // التحقق من وجود تحليلات مبيعات للمتجر والفترة
    const [existingRows] = await pool.query(
      'SELECT id FROM sales_analytics WHERE store_id = ? AND period = ?',
      [storeId, period]
    );
    
    if (existingRows.length > 0) {
      // تحديث التحليلات الموجودة
      const [result] = await pool.query(
        `UPDATE sales_analytics SET 
         total_revenue = ?, 
         total_orders = ?, 
         average_order_value = ?, 
         revenue_by_category = ?, 
         orders_by_status = ?, 
         daily_sales = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE store_id = ? AND period = ?`,
        [
          totalRevenue,
          totalOrders,
          averageOrderValue,
          JSON.stringify(revenueByCategory || {}),
          JSON.stringify(ordersByStatus || {}),
          JSON.stringify(dailySales || []),
          storeId,
          period
        ]
      );
      
      return { success: true, id: existingRows[0].id, updated: true };
    } else {
      // إنشاء تحليلات جديدة
      const [result] = await pool.query(
        `INSERT INTO sales_analytics 
         (store_id, period, total_revenue, total_orders, average_order_value, revenue_by_category, orders_by_status, daily_sales) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          storeId,
          period,
          totalRevenue,
          totalOrders,
          averageOrderValue,
          JSON.stringify(revenueByCategory || {}),
          JSON.stringify(ordersByStatus || {}),
          JSON.stringify(dailySales || [])
        ]
      );
      
      return { success: true, id: result.insertId, updated: false };
    }
  } catch (error) {
    console.error('خطأ في إنشاء أو تحديث تحليلات المبيعات:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على تحليلات المبيعات
 * @param {string} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية
 */
async function getSalesAnalytics(storeId, period) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sales_analytics WHERE store_id = ? AND period = ?',
      [storeId, period]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    // تحويل الحقول من JSON string إلى كائنات JavaScript
    const salesAnalytics = {
      ...rows[0],
      revenueByCategory: JSON.parse(rows[0].revenue_by_category || '{}'),
      ordersByStatus: JSON.parse(rows[0].orders_by_status || '{}'),
      dailySales: JSON.parse(rows[0].daily_sales || '[]')
    };
    
    return salesAnalytics;
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المبيعات:', error);
    return null;
  }
}

/**
 * تحديث تحليلات المبيعات
 * @param {string} id - معرف تحليلات المبيعات
 * @param {Object} updates - التحديثات المطلوبة
 */
async function updateSalesAnalytics(id, updates) {
  try {
    // تحضير الحقول للتحديث
    const updateFields = [];
    const updateValues = [];
    
    if (updates.totalRevenue !== undefined) {
      updateFields.push('total_revenue = ?');
      updateValues.push(updates.totalRevenue);
    }
    
    if (updates.totalOrders !== undefined) {
      updateFields.push('total_orders = ?');
      updateValues.push(updates.totalOrders);
    }
    
    if (updates.averageOrderValue !== undefined) {
      updateFields.push('average_order_value = ?');
      updateValues.push(updates.averageOrderValue);
    }
    
    if (updates.revenueByCategory !== undefined) {
      updateFields.push('revenue_by_category = ?');
      updateValues.push(JSON.stringify(updates.revenueByCategory));
    }
    
    if (updates.ordersByStatus !== undefined) {
      updateFields.push('orders_by_status = ?');
      updateValues.push(JSON.stringify(updates.ordersByStatus));
    }
    
    if (updates.dailySales !== undefined) {
      updateFields.push('daily_sales = ?');
      updateValues.push(JSON.stringify(updates.dailySales));
    }
    
    // إضافة معرف التحليلات للتحديث
    updateValues.push(id);
    
    if (updateFields.length === 0) {
      return { success: false, message: 'لم يتم تحديد أي حقول للتحديث' };
    }
    
    // تنفيذ استعلام التحديث
    const [result] = await pool.query(
      `UPDATE sales_analytics SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    if (result.affectedRows === 0) {
      return { success: false, message: 'لم يتم العثور على تحليلات المبيعات' };
    }
    
    return { success: true, message: 'تم تحديث تحليلات المبيعات بنجاح' };
  } catch (error) {
    console.error('خطأ في تحديث تحليلات المبيعات:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إنشاء بيانات تحليلات المبيعات الوهمية
 * @param {string} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية
 */
async function createDummySalesAnalytics(storeId, period) {
  try {
    // إنشاء بيانات المبيعات اليومية
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);
    
    const dailySales = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      dailySales.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 10000),
        orders: Math.floor(Math.random() * 100)
      });
    }
    
    // حساب إجمالي الإيرادات والطلبات
    const totalRevenue = dailySales.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = dailySales.reduce((sum, day) => sum + day.orders, 0);
    
    // إنشاء بيانات تحليلات المبيعات
    const salesData = {
      storeId,
      period,
      totalRevenue,
      totalOrders,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      revenueByCategory: {
        'electronics': Math.floor(totalRevenue * 0.3),
        'clothing': Math.floor(totalRevenue * 0.25),
        'home': Math.floor(totalRevenue * 0.2),
        'beauty': Math.floor(totalRevenue * 0.15),
        'other': Math.floor(totalRevenue * 0.1)
      },
      ordersByStatus: {
        'completed': Math.floor(totalOrders * 0.7),
        'processing': Math.floor(totalOrders * 0.2),
        'cancelled': Math.floor(totalOrders * 0.1)
      },
      dailySales
    };
    
    return await createOrUpdateSalesAnalytics(salesData);
  } catch (error) {
    console.error('خطأ في إنشاء بيانات تحليلات المبيعات الوهمية:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createOrUpdateSalesAnalytics,
  getSalesAnalytics,
  updateSalesAnalytics,
  createDummySalesAnalytics
};