-- vendor-service/database/vendor_ratings.sql
-- إنشاء جدول تقييمات البائعين

CREATE TABLE IF NOT EXISTS `vendor_ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vendor_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `rating` DECIMAL(3, 2) NOT NULL,
  `review` TEXT,
  `is_verified_purchase` BOOLEAN DEFAULT FALSE,
  `is_approved` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  INDEX `idx_vendor_id` (`vendor_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_is_approved` (`is_approved`),
  UNIQUE KEY `unique_vendor_user` (`vendor_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء قيود المفاتيح الأجنبية
ALTER TABLE `vendor_ratings`
ADD CONSTRAINT `fk_vendor_ratings_vendor`
FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`)
ON DELETE CASCADE;

-- ملاحظة: يجب إضافة قيد المفتاح الأجنبي لـ user_id
-- عندما يتم إنشاء جدول المستخدمين أو عندما يكون متاحًا

-- إنشاء مؤشر مركب للبحث عن التقييمات المعتمدة
CREATE INDEX `idx_vendor_approved` ON `vendor_ratings` (`vendor_id`, `is_approved`);

-- إنشاء مؤشر مركب للبحث عن التقييمات المتحقق منها
CREATE INDEX `idx_vendor_verified` ON `vendor_ratings` (`vendor_id`, `is_verified_purchase`);