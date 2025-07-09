-- vendor-service/database/vendor_settings.sql
-- إنشاء جدول إعدادات البائعين

CREATE TABLE IF NOT EXISTS `vendor_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` INT NOT NULL,
  `store_name` VARCHAR(255) NOT NULL,
  `store_description` TEXT,
  `logo_url` VARCHAR(255) DEFAULT NULL,
  `banner_url` VARCHAR(255) DEFAULT NULL,
  `theme_color` VARCHAR(20) DEFAULT '#3498db',
  `layout_type` VARCHAR(50) DEFAULT 'standard',
  `contact_email` VARCHAR(255),
  `contact_phone` VARCHAR(50),
  `business_hours` JSON DEFAULT NULL,
  `address` JSON DEFAULT NULL,
  `social_media` JSON DEFAULT NULL,
  `seo_settings` JSON DEFAULT NULL,
  `notification_settings` JSON DEFAULT NULL,
  `payment_settings` JSON DEFAULT NULL,
  `shipping_settings` JSON DEFAULT NULL,
  `policy_settings` JSON DEFAULT NULL,
  `custom_css` TEXT,
  `is_completed` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  UNIQUE KEY `unique_vendor_id` (`vendor_id`),
  INDEX `idx_is_completed` (`is_completed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء قيود المفاتيح الأجنبية
ALTER TABLE `vendor_settings`
ADD CONSTRAINT `fk_vendor_settings_vendor`
FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
ON DELETE CASCADE;

-- إنشاء مؤشر للبحث باسم المتجر
CREATE INDEX `idx_store_name` ON `vendor_settings` (`store_name`);