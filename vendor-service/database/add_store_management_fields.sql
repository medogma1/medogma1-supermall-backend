-- إضافة حقول إدارة المتاجر إلى جدول vendors
-- vendor-service/database/add_store_management_fields.sql

-- إضافة حقول الموافقة على المتجر
ALTER TABLE `vendors` 
ADD COLUMN `status` VARCHAR(50) DEFAULT 'pending' COMMENT 'حالة المتجر: pending, approved, rejected',
ADD COLUMN `is_approved` BOOLEAN DEFAULT FALSE COMMENT 'هل المتجر معتمد',
ADD COLUMN `approved_at` DATETIME NULL COMMENT 'تاريخ الموافقة على المتجر';

-- إضافة حقول توثيق المتجر
ALTER TABLE `vendors` 
ADD COLUMN `certification_status` VARCHAR(50) DEFAULT 'uncertified' COMMENT 'حالة التوثيق: uncertified, certified',
ADD COLUMN `is_certified` BOOLEAN DEFAULT FALSE COMMENT 'هل المتجر موثق',
ADD COLUMN `certified_at` DATETIME NULL COMMENT 'تاريخ توثيق المتجر';

-- إضافة حقول حظر التاجر
ALTER TABLE `vendors` 
ADD COLUMN `is_banned` BOOLEAN DEFAULT FALSE COMMENT 'هل التاجر محظور',
ADD COLUMN `banned_at` DATETIME NULL COMMENT 'تاريخ حظر التاجر',
ADD COLUMN `ban_reason` TEXT NULL COMMENT 'سبب حظر التاجر';

-- إضافة حقول إضافية مطلوبة
ALTER TABLE `vendors` 
ADD COLUMN `user_id` INT NULL COMMENT 'معرف المستخدم المرتبط',
ADD COLUMN `store_name` VARCHAR(255) NULL COMMENT 'اسم المتجر',
ADD COLUMN `store_slug` VARCHAR(255) NULL COMMENT 'رابط المتجر',
ADD COLUMN `store_description` TEXT NULL COMMENT 'وصف المتجر',
ADD COLUMN `store_logo_url` VARCHAR(500) NULL COMMENT 'رابط شعار المتجر',
ADD COLUMN `contact_email` VARCHAR(255) NULL COMMENT 'بريد التواصل',
ADD COLUMN `contact_phone` VARCHAR(50) NULL COMMENT 'هاتف التواصل',
ADD COLUMN `store_address` TEXT NULL COMMENT 'عنوان المتجر',
ADD COLUMN `workshop_address` TEXT NULL COMMENT 'عنوان الورشة',
ADD COLUMN `logo` VARCHAR(500) NULL COMMENT 'شعار البائع',
ADD COLUMN `banner` VARCHAR(500) NULL COMMENT 'بانر البائع',
ADD COLUMN `short_description` TEXT NULL COMMENT 'وصف مختصر',
ADD COLUMN `website` VARCHAR(255) NULL COMMENT 'موقع البائع',
ADD COLUMN `social_media` JSON NULL COMMENT 'وسائل التواصل الاجتماعي',
ADD COLUMN `business_category` VARCHAR(100) NULL COMMENT 'فئة العمل',
ADD COLUMN `tax_number` VARCHAR(50) NULL COMMENT 'الرقم الضريبي',
ADD COLUMN `commercial_register` VARCHAR(50) NULL COMMENT 'السجل التجاري',
ADD COLUMN `address` JSON NULL COMMENT 'العنوان التفصيلي',
ADD COLUMN `location` JSON NULL COMMENT 'الموقع الجغرافي',
ADD COLUMN `working_hours` JSON NULL COMMENT 'ساعات العمل',
ADD COLUMN `verification_status` VARCHAR(50) DEFAULT 'unverified' COMMENT 'حالة التحقق',
ADD COLUMN `verification_date` DATETIME NULL COMMENT 'تاريخ التحقق',
ADD COLUMN `is_featured` BOOLEAN DEFAULT FALSE COMMENT 'هل البائع مميز',
ADD COLUMN `total_sales` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'إجمالي المبيعات',
ADD COLUMN `total_orders` INT DEFAULT 0 COMMENT 'إجمالي الطلبات',
ADD COLUMN `national_id` VARCHAR(20) NULL COMMENT 'رقم الهوية الوطنية';

-- إضافة مؤشرات للحقول الجديدة
CREATE INDEX `idx_status` ON `vendors` (`status`);
CREATE INDEX `idx_is_approved` ON `vendors` (`is_approved`);
CREATE INDEX `idx_certification_status` ON `vendors` (`certification_status`);
CREATE INDEX `idx_is_certified` ON `vendors` (`is_certified`);
CREATE INDEX `idx_is_banned` ON `vendors` (`is_banned`);
CREATE INDEX `idx_user_id` ON `vendors` (`user_id`);
CREATE INDEX `idx_store_slug` ON `vendors` (`store_slug`);
CREATE INDEX `idx_verification_status` ON `vendors` (`verification_status`);
CREATE INDEX `idx_is_featured` ON `vendors` (`is_featured`);

-- إضافة قيود فريدة
ALTER TABLE `vendors` ADD UNIQUE KEY `unique_user_id` (`user_id`);
ALTER TABLE `vendors` ADD UNIQUE KEY `unique_store_slug` (`store_slug`);

-- تحديث البيانات الموجودة
UPDATE `vendors` SET 
  `status` = 'approved',
  `is_approved` = TRUE,
  `approved_at` = `created_at`,
  `certification_status` = 'uncertified',
  `is_certified` = FALSE,
  `is_banned` = FALSE,
  `verification_status` = CASE WHEN `is_verified` = TRUE THEN 'verified' ELSE 'unverified' END
WHERE `id` > 0;

COMMIT;