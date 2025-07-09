-- vendor-service/database/services.sql
-- إنشاء جدول الخدمات

CREATE TABLE IF NOT EXISTS `services` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `price` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'EGP',
  `type` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `vendor_id` INT NOT NULL,
  `vendor_name` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(255) DEFAULT NULL,
  `additional_images` JSON DEFAULT NULL,
  `tags` JSON DEFAULT NULL,
  `category_id` INT NOT NULL,
  `category_name` VARCHAR(255) NOT NULL,
  `rating` DECIMAL(3, 2) DEFAULT 0.0,
  `review_count` INT DEFAULT 0,
  `is_available` BOOLEAN DEFAULT TRUE,
  `is_featured` BOOLEAN DEFAULT FALSE,
  `specifications` JSON DEFAULT NULL,
  `requirements` JSON DEFAULT NULL,
  `available_start_time` DATETIME DEFAULT NULL,
  `available_end_time` DATETIME DEFAULT NULL,
  `estimated_duration` INT DEFAULT 60,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  INDEX `idx_vendor_id` (`vendor_id`),
  INDEX `idx_category_id` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_is_featured` (`is_featured`),
  INDEX `idx_is_available` (`is_available`),
  FULLTEXT INDEX `idx_search` (`name`, `description`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء قيود المفاتيح الأجنبية
ALTER TABLE `services`
ADD CONSTRAINT `fk_services_vendor`
FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
ON DELETE CASCADE;

-- ملاحظة: يجب إنشاء جدول الفئات وإضافة قيد المفتاح الأجنبي لـ category_id
-- عندما يتم إنشاء جدول الفئات

-- إنشاء مؤشر للبحث بالسعر
CREATE INDEX `idx_price` ON `services` (`price`);

-- إنشاء مؤشر مركب للبحث عن الخدمات المميزة النشطة
CREATE INDEX `idx_featured_active` ON `services` (`is_featured`, `status`, `is_available`);