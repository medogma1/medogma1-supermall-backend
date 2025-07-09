-- إنشاء جدول api_performance لتتبع أداء API
CREATE TABLE IF NOT EXISTS `api_performance` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `endpoint` VARCHAR(255) NOT NULL COMMENT 'مسار الـ API',
  `method` VARCHAR(10) NOT NULL COMMENT 'نوع الطلب (GET, POST, PUT, DELETE, etc.)',
  `response_time` FLOAT NOT NULL COMMENT 'زمن الاستجابة بالميلي ثانية',
  `status_code` INT NOT NULL COMMENT 'كود الاستجابة HTTP',
  `request_size` INT DEFAULT NULL COMMENT 'حجم الطلب بالبايت',
  `response_size` INT DEFAULT NULL COMMENT 'حجم الاستجابة بالبايت',
  `user_id` VARCHAR(50) DEFAULT NULL COMMENT 'معرف المستخدم (اختياري)',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'عنوان IP للمستخدم',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'تاريخ ووقت تسجيل البيانات',
  PRIMARY KEY (`id`),
  INDEX `idx_endpoint` (`endpoint`),
  INDEX `idx_method` (`method`),
  INDEX `idx_status_code` (`status_code`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='جدول لتخزين بيانات أداء API';