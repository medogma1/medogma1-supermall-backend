// product-service/config/database.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

// إعداد اتصال قاعدة البيانات الموحدة
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  typeCast: function (field, next) {
    if (field.type === 'VAR_STRING' || field.type === 'STRING') {
      return field.string();
    }
    return next();
  }
});

// اختبار الاتصال
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Product Service: MySQL database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Product Service: Database connection failed:', error.message);
    throw error;
  }
}

// تهيئة قاعدة البيانات
async function initializeDatabase() {
  try {
    console.log('🔄 Product Service: Initializing database...');
    
    // Create a connection to the unified database
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'xx100100',
      charset: 'utf8mb4'
    });
    
    const tempConnection = await tempPool.getConnection();
    
    try {
      // Use the unified database
      await tempConnection.query(`USE \`${process.env.DB_NAME || 'supermall'}\``);
      console.log('✅ Product Service: Connected to unified database successfully');
      
      // Create basic products table if it doesn't exist
      await tempConnection.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          vendor_id INT,
          category_id INT,
          image_url VARCHAR(500),
          stock_quantity INT DEFAULT 0,
          rating DECIMAL(3,2) DEFAULT 0.00,
          rating_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_vendor (vendor_id),
          INDEX idx_category (category_id),
          INDEX idx_price (price),
          INDEX idx_rating (rating)
        )
      `);
      
      // Create product_tags table
      await tempConnection.query(`
        CREATE TABLE IF NOT EXISTS product_tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          tag VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_product_tag (product_id, tag),
          INDEX idx_tag (tag),
          INDEX idx_product (product_id)
        )
      `);
      
      // Create reviews table
      await tempConnection.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          review_type ENUM('product', 'vendor') NOT NULL,
          product_id INT,
          vendor_id INT,
          rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT NOT NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          reports JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_product (product_id),
          INDEX idx_vendor (vendor_id),
          INDEX idx_user (user_id),
          INDEX idx_status (status),
          INDEX idx_rating (rating),
          CONSTRAINT chk_review_target CHECK (
            (review_type = 'product' AND product_id IS NOT NULL AND vendor_id IS NULL) OR
            (review_type = 'vendor' AND vendor_id IS NOT NULL AND product_id IS NULL)
          )
        )
      `);
      
      // Add unique constraints for reviews
      await tempConnection.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_product_review 
        ON reviews (user_id, product_id) 
        WHERE product_id IS NOT NULL
      `).catch(() => {
        // Ignore error if index already exists or syntax not supported
        console.log('Note: Conditional unique index not supported, using alternative approach');
      });
      
      await tempConnection.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_vendor_review 
        ON reviews (user_id, vendor_id) 
        WHERE vendor_id IS NOT NULL
      `).catch(() => {
        // Ignore error if index already exists or syntax not supported
        console.log('Note: Conditional unique index not supported, using alternative approach');
      });
      
      console.log('✅ Product Service: Basic database schema initialized successfully');
    } finally {
      tempConnection.release();
      await tempPool.end();
    }
  } catch (error) {
    console.error('❌ Product Service: Database initialization failed:', error.message);
    throw error;
  }
}

// إغلاق الاتصال
async function closeConnection() {
  try {
    await pool.end();
    console.log('✅ Product Service: Database connection closed');
  } catch (error) {
    console.error('❌ Product Service: Error closing database connection:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  closeConnection
};