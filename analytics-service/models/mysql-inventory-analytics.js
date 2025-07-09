// analytics-service/models/mysql-inventory-analytics.js
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
 * إنشاء أو تحديث تحليلات المخزون
 * @param {Object} inventoryData - بيانات تحليلات المخزون
 */
async function createOrUpdateInventoryAnalytics(inventoryData) {
  try {
    const { storeId, period, outOfStockProducts, stockByCategory, topPerformingProducts, lowPerformingProducts } = inventoryData;
    
    // التحقق من وجود تحليلات مخزون للمتجر والفترة
    const [existingRows] = await pool.query(
      'SELECT id FROM inventory_analytics WHERE store_id = ? AND period = ?',
      [storeId, period]
    );
    
    if (existingRows.length > 0) {
      // تحديث التحليلات الموجودة
      const [result] = await pool.query(
        `UPDATE inventory_analytics SET 
         out_of_stock_products = ?, 
         stock_by_category = ?, 
         top_performing_products = ?, 
         low_performing_products = ?, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE store_id = ? AND period = ?`,
        [
          outOfStockProducts,
          JSON.stringify(stockByCategory || {}),
          JSON.stringify(topPerformingProducts || []),
          JSON.stringify(lowPerformingProducts || []),
          storeId,
          period
        ]
      );
      
      return { success: true, id: existingRows[0].id, updated: true };
    } else {
      // إنشاء تحليلات جديدة
      const [result] = await pool.query(
        `INSERT INTO inventory_analytics 
         (store_id, period, out_of_stock_products, stock_by_category, top_performing_products, low_performing_products) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          storeId,
          period,
          outOfStockProducts,
          JSON.stringify(stockByCategory || {}),
          JSON.stringify(topPerformingProducts || []),
          JSON.stringify(lowPerformingProducts || [])
        ]
      );
      
      return { success: true, id: result.insertId, updated: false };
    }
  } catch (error) {
    console.error('خطأ في إنشاء أو تحديث تحليلات المخزون:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على تحليلات المخزون
 * @param {string} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية
 */
async function getInventoryAnalytics(storeId, period) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM inventory_analytics WHERE store_id = ? AND period = ?',
      [storeId, period]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    // تحويل الحقول من JSON string إلى كائنات JavaScript
    const inventoryAnalytics = {
      ...rows[0],
      stockByCategory: JSON.parse(rows[0].stock_by_category || '{}'),
      topPerformingProducts: JSON.parse(rows[0].top_performing_products || '[]'),
      lowPerformingProducts: JSON.parse(rows[0].low_performing_products || '[]')
    };
    
    return inventoryAnalytics;
  } catch (error) {
    console.error('خطأ في الحصول على تحليلات المخزون:', error);
    return null;
  }
}

/**
 * الحصول على المنتجات التي نفدت من المخزون
 */
async function getOutOfStockProducts() {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.image_url,
        p.price,
        c.name as category_name,
        v.name as vendor_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE p.stock_quantity = 0 AND p.status = 'active'
      ORDER BY p.updated_at DESC
    `;
    
    const [rows] = await pool.query(query);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على المنتجات التي نفدت من المخزون:', error);
    return [];
  }
}

/**
 * الحصول على المنتجات ذات المخزون المنخفض
 * @param {number} threshold - الحد الأدنى للمخزون
 */
async function getLowStockProducts(threshold = 10) {
  try {
    const query = `
      SELECT 
        p.id,
        p.name,
        p.image_url,
        p.price,
        p.stock_quantity,
        c.name as category_name,
        v.name as vendor_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN vendors v ON p.vendor_id = v.id
      WHERE p.stock_quantity > 0 AND p.stock_quantity <= ? AND p.status = 'active'
      ORDER BY p.stock_quantity ASC
    `;
    
    const [rows] = await pool.query(query, [threshold]);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على المنتجات ذات المخزون المنخفض:', error);
    return [];
  }
}

/**
 * إنشاء بيانات تحليلات المخزون الوهمية
 * @param {string} storeId - معرف المتجر
 * @param {string} period - الفترة الزمنية
 */
async function createDummyInventoryAnalytics(storeId, period) {
  try {
    const outOfStockProducts = Math.floor(Math.random() * 50);
    
    // إنشاء المنتجات الأكثر مبيعًا
    const topPerformingProducts = [];
    for (let i = 1; i <= 5; i++) {
      topPerformingProducts.push({
        productId: `product-${i}`,
        name: `منتج رائج ${i}`,
        sales: Math.floor(Math.random() * 100) + 50,
        revenue: Math.floor(Math.random() * 10000) + 5000
      });
    }
    
    // إنشاء المنتجات الأقل مبيعًا
    const lowPerformingProducts = [];
    for (let i = 1; i <= 5; i++) {
      lowPerformingProducts.push({
        productId: `product-low-${i}`,
        name: `منتج بطيء ${i}`,
        sales: Math.floor(Math.random() * 10) + 1,
        revenue: Math.floor(Math.random() * 1000) + 100
      });
    }
    
    const inventoryData = {
      storeId,
      period,
      outOfStockProducts,
      stockByCategory: {
        'electronics': Math.floor(Math.random() * 200) + 100,
        'clothing': Math.floor(Math.random() * 300) + 200,
        'home': Math.floor(Math.random() * 150) + 100,
        'beauty': Math.floor(Math.random() * 100) + 50,
        'other': Math.floor(Math.random() * 50) + 20
      },
      topPerformingProducts,
      lowPerformingProducts
    };
    
    return await createOrUpdateInventoryAnalytics(inventoryData);
  } catch (error) {
    console.error('خطأ في إنشاء بيانات تحليلات المخزون الوهمية:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createOrUpdateInventoryAnalytics,
  getInventoryAnalytics,
  getOutOfStockProducts,
  getLowStockProducts,
  createDummyInventoryAnalytics
};