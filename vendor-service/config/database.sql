-- vendor-service/config/database.sql
-- ملف إنشاء قاعدة بيانات MySQL لخدمة البائعين

-- إنشاء جدول البائعين
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  store_name VARCHAR(100) NOT NULL,
  store_slug VARCHAR(100) NOT NULL UNIQUE,
  logo VARCHAR(255),
  banner VARCHAR(255),
  description TEXT,
  short_description VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  social_media JSON,
  business_type ENUM('individual', 'company') NOT NULL,
  business_category VARCHAR(100),
  tax_number VARCHAR(50),
  commercial_register VARCHAR(50),
  address JSON,
  location JSON,
  working_hours JSON,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents JSON,
  verification_date DATETIME,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  commission_rate DECIMAL(5, 2) DEFAULT 10.00,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  total_sales DECIMAL(10, 2) DEFAULT 0.00,
  total_orders INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_store_name (store_name),
  INDEX idx_store_slug (store_slug),
  INDEX idx_business_category (business_category),
  INDEX idx_rating (rating),
  INDEX idx_is_featured (is_featured),
  INDEX idx_is_active (is_active),
  INDEX idx_is_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء جدول فروع البائعين
CREATE TABLE IF NOT EXISTS vendor_branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address JSON NOT NULL,
  location JSON,
  working_hours JSON,
  is_main BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_is_main (is_main),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء جدول المعاملات المالية للبائعين
CREATE TABLE IF NOT EXISTS vendor_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  order_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  type ENUM('order_payment', 'commission', 'withdrawal', 'refund', 'adjustment') NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  description VARCHAR(255),
  reference VARCHAR(100),
  payment_method VARCHAR(50),
  payment_details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_order_id (order_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء جدول طلبات السحب
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  bank_details JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'completed') NOT NULL DEFAULT 'pending',
  notes TEXT,
  processed_by INT,
  processed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء جدول تقييمات البائعين
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_user_id (user_id),
  INDEX idx_rating (rating),
  INDEX idx_status (status),
  UNIQUE INDEX idx_vendor_user (vendor_id, user_id),
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء جدول إعدادات البائعين
CREATE TABLE IF NOT EXISTS vendor_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor_id INT NOT NULL UNIQUE,
  notification_preferences JSON,
  shipping_settings JSON,
  payment_settings JSON,
  tax_settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;