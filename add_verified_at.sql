-- Add verified_at column to vendors table
ALTER TABLE vendors ADD COLUMN verified_at DATETIME NULL COMMENT 'تاريخ التحقق من المتجر' AFTER verification_status;