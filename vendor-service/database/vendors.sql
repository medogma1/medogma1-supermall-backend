-- vendor-service/database/vendors.sql
-- إنشاء جدول البائعين

CREATE TABLE IF NOT EXISTS `vendors` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50),
  `description` TEXT,
  `business_type` VARCHAR(50) DEFAULT 'individual',
  `country` VARCHAR(100),
  `governorate` VARCHAR(100),
  `tax_id` VARCHAR(50),
  `registration_number` VARCHAR(50),
  `is_active` BOOLEAN DEFAULT TRUE,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `verification_documents` JSON DEFAULT NULL,
  `rating` DECIMAL(3, 2) DEFAULT 0.0,
  `review_count` INT DEFAULT 0,
  `service_count` INT DEFAULT 0,
  `store_settings_completed` BOOLEAN DEFAULT FALSE,
  `commission_rate` DECIMAL(5, 2) DEFAULT 10.00,
  `balance` DECIMAL(10, 2) DEFAULT 0.00,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  UNIQUE KEY `unique_email` (`email`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_verified` (`is_verified`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_store_settings_completed` (`store_settings_completed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء مؤشر للبحث بالاسم
CREATE INDEX `idx_name` ON `vendors` (`name`);

-- إنشاء مؤشر للبحث بالهاتف
CREATE INDEX `idx_phone` ON `vendors` (`phone`);

-- إنشاء مؤشر مركب للبحث عن البائعين النشطين والمتحققين
CREATE INDEX `idx_active_verified` ON `vendors` (`is_active`, `is_verified`);

-- إنشاء مؤشر مركب للبحث حسب التقييم والنشاط
CREATE INDEX `idx_rating_active` ON `vendors` (`rating`, `is_active`);