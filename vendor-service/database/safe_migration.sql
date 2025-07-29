-- Safe migration script that checks for existing columns
-- vendor-service/database/safe_migration.sql

-- Add status column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'status';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `status` VARCHAR(50) DEFAULT "pending" COMMENT "حالة المتجر: pending, approved, rejected"', 
  'SELECT "Column status already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_approved column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'is_approved';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `is_approved` BOOLEAN DEFAULT FALSE COMMENT "هل المتجر معتمد"', 
  'SELECT "Column is_approved already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add approved_at column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'approved_at';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `approved_at` DATETIME NULL COMMENT "تاريخ الموافقة على المتجر"', 
  'SELECT "Column approved_at already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add certification_status column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'certification_status';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `certification_status` VARCHAR(50) DEFAULT "uncertified" COMMENT "حالة التوثيق: uncertified, certified"', 
  'SELECT "Column certification_status already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_certified column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'is_certified';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `is_certified` BOOLEAN DEFAULT FALSE COMMENT "هل المتجر موثق"', 
  'SELECT "Column is_certified already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add certified_at column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'certified_at';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `certified_at` DATETIME NULL COMMENT "تاريخ توثيق المتجر"', 
  'SELECT "Column certified_at already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add is_banned column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'is_banned';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `is_banned` BOOLEAN DEFAULT FALSE COMMENT "هل التاجر محظور"', 
  'SELECT "Column is_banned already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add banned_at column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'banned_at';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `banned_at` DATETIME NULL COMMENT "تاريخ حظر التاجر"', 
  'SELECT "Column banned_at already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add ban_reason column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'supermall' AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'ban_reason';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE `vendors` ADD COLUMN `ban_reason` TEXT NULL COMMENT "سبب حظر التاجر"', 
  'SELECT "Column ban_reason already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;