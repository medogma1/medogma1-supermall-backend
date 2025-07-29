-- إنشاء جدول البنرات
CREATE TABLE IF NOT EXISTS `banners` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL COMMENT 'عنوان البنر',
  `description` TEXT NULL COMMENT 'وصف البنر',
  `image_url` VARCHAR(500) NULL COMMENT 'رابط صورة البنر',
  `link` VARCHAR(500) NULL COMMENT 'رابط البنر عند النقر',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'هل البنر نشط',
  `position` INT DEFAULT 0 COMMENT 'ترتيب البنر',
  `start_date` DATETIME NULL COMMENT 'تاريخ بداية عرض البنر',
  `end_date` DATETIME NULL COMMENT 'تاريخ انتهاء عرض البنر',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ الإنشاء',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'تاريخ التحديث',
  PRIMARY KEY (`id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_position` (`position`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_end_date` (`end_date`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول البنرات الإعلانية';

-- إدراج بيانات تجريبية
INSERT INTO `banners` (`title`, `description`, `image_url`, `link`, `is_active`, `position`) VALUES
('عرض خاص - خصم 50%', 'احصل على خصم 50% على جميع المنتجات', '/images/banners/special-offer.jpg', '/offers/special-50', TRUE, 1),
('منتجات جديدة', 'اكتشف أحدث المنتجات في متجرنا', '/images/banners/new-products.jpg', '/products/new', TRUE, 2),
('توصيل مجاني', 'توصيل مجاني لجميع الطلبات فوق 100 ريال', '/images/banners/free-delivery.jpg', '/shipping/free', TRUE, 3);

COMMIT;