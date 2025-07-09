// analytics-service/models/mysql-customer-analytics.js
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
 * إنشاء أو تحديث تحليلات العملاء
 * @param {Object} customerData - بيانات تحليلات العملاء
 */
async function createOrUpdateCustomerAnalytics(customerData) {
  try {
    const { storeId, period, totalCustomers, newCustomers, repeatCustomers, customerRetentionRate, customersByRegion } = customerData;
    
    // التحقق من وجود تحليلات عملاء للمتجر والفترة
    const [existingRows] = await pool.query(
      'SELECT id FROM customer_analytics WHERE store_id = ? AND period = ?',
      [storeId, period]
    );
    
    if (existingRows.length > 0) {
      // تحديث التحليلات الموجودة
      const [result] = await pool.query(
        `UPDATE customer_analytics SET 
         total_customers = ?, 
         new_customers = ?, 
         repeat_customers = ?, 
         customer_retention_rate = ?, 
         customers_by_region = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE store_id = ? AND period = ?`,
        [
          totalCustomers,
          newCustomers,
          repeatCustomers,
          customerRetentionRate,
          JSON.stringify(customersByRegion || {}),
          storeId,
          period
        ]
      );
      
      return { success: true, id: existingRows[0].id, updated: true };
    } else {
      // إنشاء تحليلات جديدة
      const [result] = await pool.query(
        `INSERT INTO customer_analytics 
         (store_id, period, total_customers, new_customers, repeat_customers, customer_retention_rate, customers_by_region) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          storeId,
          period,
          totalCustomers,
          newCustomers,
          repeatCustomers,
          customerRetentionRate,
          JSON.stringify(customersByRegion || {})
        ]
      );
      
      return { success: true, id: result.insertId, updated: false };
    }
  } catch (error) {
    console.error('خطأ في إنشاء أو تحديث تحليلات العملاء:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على تحليلات العملاء
 * @param {string} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية
 */
async function getCustomerAnalytics(storeId, period) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM customer_analytics WHERE store_id = ? AND period = ?',
      [storeId, period]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    // تحويل الحقول من JSON string إلى كائنات JavaScript
    const customerAnalytics = {
      ...rows[0],
      customersByRegion: JSON.parse(rows[0].customers_by_region || '{}')
    };
    
    return customerAnalytics;
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات العملاء:', error);
    return null;
  }
}

/**
 * إنشاء بيانات تحليلات العملاء الوهمية
 * @param {string} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية
 */
async function createDummyCustomerAnalytics(storeId, period) {
  try {
    const totalCustomers = Math.floor(Math.random() * 1000) + 500;
    const newCustomers = Math.floor(totalCustomers * 0.3);
    const repeatCustomers = totalCustomers - newCustomers;
    
    const customerData = {
      storeId,
      period,
      totalCustomers,
      newCustomers,
      repeatCustomers,
      customerRetentionRate: (repeatCustomers / totalCustomers) * 100,
      customersByRegion: {
        'الرياض': Math.floor(totalCustomers * 0.3),
        'جدة': Math.floor(totalCustomers * 0.25),
        'الدمام': Math.floor(totalCustomers * 0.2),
        'مكة': Math.floor(totalCustomers * 0.15),
        'أخرى': Math.floor(totalCustomers * 0.1)
      }
    };
    
    return await createOrUpdateCustomerAnalytics(customerData);
  } catch (error) {
    console.error('خطأ في إنشاء بيانات تحليلات العملاء الوهمية:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على إحصائيات العملاء حسب الفترة
 * @param {string} period - الفترة الزمنية (daily, weekly, monthly, yearly)
 */
async function getCustomerStatsByPeriod(period = 'monthly') {
  try {
    let timeFormat;
    let groupBy;
    
    switch (period) {
      case 'daily':
        timeFormat = '%Y-%m-%d';
        groupBy = 'DATE(created_at)';
        break;
      case 'weekly':
        timeFormat = '%Y-%u';
        groupBy = 'YEARWEEK(created_at)';
        break;
      case 'monthly':
        timeFormat = '%Y-%m';
        groupBy = 'YEAR(created_at), MONTH(created_at)';
        break;
      case 'yearly':
        timeFormat = '%Y';
        groupBy = 'YEAR(created_at)';
        break;
      default:
        timeFormat = '%Y-%m';
        groupBy = 'YEAR(created_at), MONTH(created_at)';
    }
    
    const query = `
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COUNT(*) as new_users,
        SUM(CASE WHEN orders_count > 0 THEN 1 ELSE 0 END) as active_users
      FROM users
      LEFT JOIN (
        SELECT user_id, COUNT(*) as orders_count 
        FROM orders 
        GROUP BY user_id
      ) o ON users.id = o.user_id
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT 12
    `;
    
    const [rows] = await pool.query(query, [timeFormat]);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات العملاء حسب الفترة:', error);
    return [];
  }
}

module.exports = {
  createOrUpdateCustomerAnalytics,
  getCustomerAnalytics,
  createDummyCustomerAnalytics,
  getCustomerStatsByPeriod
};