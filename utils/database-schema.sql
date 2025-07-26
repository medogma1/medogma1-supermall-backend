-- database-schema.sql
-- إنشاء قاعدة البيانات الموحدة
CREATE DATABASE IF NOT EXISTS supermall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE supermall;

-- جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'vendor', 'user') NOT NULL,
  vendor_id VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  failed_login_attempts INT DEFAULT 0,
  account_lock_until DATETIME,
  country VARCHAR(100),
  governorate VARCHAR(100),
  phone VARCHAR(20),
  national_id VARCHAR(20),
  workshop_address VARCHAR(255),
  profile_image VARCHAR(255) DEFAULT '',
  is_email_verified BOOLEAN DEFAULT FALSE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role_active (role, is_active),
  INDEX idx_reset_token (reset_password_token, reset_password_expires)
) ENGINE=InnoDB;

-- جدول الفئات
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id INT,
  image_url VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- جدول المتاجر
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  store_name VARCHAR(100) NOT NULL,
  store_description TEXT,
  store_logo_url VARCHAR(255),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  store_address TEXT,
  store_settings_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  vendor_id INT NOT NULL,
  category_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  stock_quantity INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FULLTEXT INDEX idx_product_search (name, description)
) ENGINE=InnoDB;

-- جدول علامات المنتجات
CREATE TABLE IF NOT EXISTS product_tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_tag (product_id, tag)
) ENGINE=InnoDB;

-- جدول المراجعات
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول المفضلات
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول تفاصيل الطلبات
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type VARCHAR(50),
  reference_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول المحادثات
CREATE TABLE IF NOT EXISTS chats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  vendor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_vendor (user_id, vendor_id)
) ENGINE=InnoDB;

-- جدول رسائل المحادثات
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chat_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول التحليلات
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('product', 'category', 'vendor', 'user') NOT NULL,
  entity_id INT NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB;

-- جدول البائعين
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT,
  business_type VARCHAR(50) DEFAULT 'individual',
  tax_id VARCHAR(50),
  registration_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSON DEFAULT NULL,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  service_count INT DEFAULT 0,
  store_settings_completed BOOLEAN DEFAULT FALSE,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_email (email),
  INDEX idx_is_active (is_active),
  INDEX idx_is_verified (is_verified),
  INDEX idx_rating (rating),
  INDEX idx_store_settings_completed (store_settings_completed),
  INDEX idx_name (name),
  INDEX idx_phone (phone),
  INDEX idx_active_verified (is_active, is_verified),
  INDEX idx_rating_active (rating, is_active)
) ENGINE=InnoDB;

-- جدول إعدادات البائعين
CREATE TABLE IF NOT EXISTS vendor_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  store_description TEXT,
  logo_url VARCHAR(255) DEFAULT NULL,
  banner_url VARCHAR(255) DEFAULT NULL,
  theme_color VARCHAR(20) DEFAULT '#3498db',
  layout_type VARCHAR(50) DEFAULT 'standard',
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  business_hours JSON DEFAULT NULL,
  address JSON DEFAULT NULL,
  social_media JSON DEFAULT NULL,
  seo_settings JSON DEFAULT NULL,
  notification_settings JSON DEFAULT NULL,
  payment_settings JSON DEFAULT NULL,
  shipping_settings JSON DEFAULT NULL,
  policy_settings JSON DEFAULT NULL,
  custom_css TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vendor_id (vendor_id),
  INDEX idx_is_completed (is_completed),
  INDEX idx_store_name (store_name),
  FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول تقييمات البائعين
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  user_id INT NOT NULL,
  rating DECIMAL(3, 2) NOT NULL,
  review TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  INDEX idx_is_approved (is_approved),
  UNIQUE KEY unique_vendor_user (vendor_id, user_id),
  INDEX idx_vendor_approved (vendor_id, is_approved),
  INDEX idx_vendor_verified (vendor_id, is_verified_purchase),
  FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- جدول الخدمات
CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EGP',
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  vendor_id INT NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  additional_images JSON DEFAULT NULL,
  tags JSON DEFAULT NULL,
  category_id INT NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  review_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  specifications JSON DEFAULT NULL,
  requirements JSON DEFAULT NULL,
  available_start_time DATETIME DEFAULT NULL,
  available_end_time DATETIME DEFAULT NULL,
  estimated_duration INT DEFAULT 60,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_is_featured (is_featured),
  INDEX idx_is_available (is_available),
  INDEX idx_price (price),
  INDEX idx_featured_active (is_featured, status, is_available),
  FULLTEXT INDEX idx_search (name, description),
  FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB;