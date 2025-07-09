// analytics-service/models/mysql-analytics.js
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

// إضافة حدث تحليلي جديد
async function addAnalyticsEvent(eventData) {
  try {
    const { event_type, entity_type, entity_id, user_id, metadata } = eventData;
    
    const [result] = await pool.query(
      'INSERT INTO analytics_events (event_type, entity_type, entity_id, user_id, metadata) VALUES (?, ?, ?, ?, ?)',
      [event_type, entity_type, entity_id, user_id, JSON.stringify(metadata || {})]
    );
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('خطأ في إضافة حدث تحليلي:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على أحداث تحليلية حسب النوع
async function getAnalyticsByEventType(eventType, startDate, endDate) {
  try {
    let query = 'SELECT * FROM analytics_events WHERE event_type = ?';
    const params = [eventType];
    
    if (startDate && endDate) {
      query += ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    // تحويل حقل metadata من JSON string إلى كائن JavaScript
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata)
    }));
  } catch (error) {
    console.error('خطأ في الحصول على بيانات التحليلات:', error);
    return [];
  }
}

// الحصول على أحداث تحليلية حسب الكيان
async function getAnalyticsByEntity(entityType, entityId, startDate, endDate) {
  try {
    let query = 'SELECT * FROM analytics_events WHERE entity_type = ? AND entity_id = ?';
    const params = [entityType, entityId];
    
    if (startDate && endDate) {
      query += ' AND created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    // تحويل حقل metadata من JSON string إلى كائن JavaScript
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata)
    }));
  } catch (error) {
    console.error('خطأ في الحصول على بيانات التحليلات للكيان:', error);
    return [];
  }
}

// إنشاء تقرير تحليلي
async function createAnalyticsReport(reportData) {
  try {
    const { report_type, report_data, start_date, end_date } = reportData;
    
    const [result] = await pool.query(
      'INSERT INTO analytics_reports (report_type, report_data, start_date, end_date) VALUES (?, ?, ?, ?)',
      [report_type, JSON.stringify(report_data), start_date, end_date]
    );
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('خطأ في إنشاء تقرير تحليلي:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على تقرير تحليلي حسب النوع
async function getAnalyticsReports(reportType, startDate, endDate) {
  try {
    let query = 'SELECT * FROM analytics_reports WHERE report_type = ?';
    const params = [reportType];
    
    if (startDate && endDate) {
      query += ' AND start_date >= ? AND end_date <= ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(query, params);
    
    // تحويل حقل report_data من JSON string إلى كائن JavaScript
    return rows.map(row => ({
      ...row,
      report_data: JSON.parse(row.report_data)
    }));
  } catch (error) {
    console.error('خطأ في الحصول على تقارير التحليلات:', error);
    return [];
  }
}

// الحصول على إحصائيات المبيعات
async function getSalesStatistics(startDate, endDate) {
  try {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as total_sales
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    const [rows] = await pool.query(query, [startDate, endDate]);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات المبيعات:', error);
    return [];
  }
}

// الحصول على إحصائيات المنتجات الأكثر مبيعًا
async function getTopSellingProducts(limit = 10) {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.image_url,
        SUM(oi.quantity) as total_quantity,
        COUNT(DISTINCT o.id) as order_count
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT ?
    `;
    
    const [rows] = await pool.query(query, [limit]);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على المنتجات الأكثر مبيعًا:', error);
    return [];
  }
}

// الحصول على إحصائيات المستخدمين
async function getUserStatistics() {
  try {
    const query = `
      SELECT 
        role,
        COUNT(*) as user_count,
        DATE_FORMAT(MIN(created_at), '%Y-%m-%d') as earliest_signup,
        DATE_FORMAT(MAX(created_at), '%Y-%m-%d') as latest_signup
      FROM users
      GROUP BY role
    `;
    
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات المستخدمين:', error);
    return [];
  }
}

module.exports = {
  addAnalyticsEvent,
  getAnalyticsByEventType,
  getAnalyticsByEntity,
  createAnalyticsReport,
  getAnalyticsReports,
  getSalesStatistics,
  getTopSellingProducts,
  getUserStatistics
};