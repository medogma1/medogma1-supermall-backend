-- vendor-service/database/featured_stores.sql
-- جدول المتاجر المميزة

CREATE TABLE IF NOT EXISTS `featured_stores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_store_id` (`store_id`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_featured_stores_vendor` FOREIGN KEY (`store_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول المتاجر المميزة';

-- إضافة فهرس مركب للأداء
CREATE INDEX `idx_store_priority` ON `featured_stores` (`store_id`, `priority`);

-- إضافة بعض البيانات التجريبية (اختيارية)
-- INSERT INTO `featured_stores` (`store_id`, `priority`) VALUES
-- (1, 1),
-- (2, 2),
-- (3, 3);