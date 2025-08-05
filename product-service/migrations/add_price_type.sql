-- إضافة حقل نوع السعر إلى جدول المنتجات
-- Migration: Add price_type field to products table

USE supermall;

-- إضافة حقل price_type
ALTER TABLE products 
ADD COLUMN price_type ENUM('fixed', 'contact') DEFAULT 'fixed' AFTER price;

-- تحديث القيود لجعل السعر اختياريًا
ALTER TABLE products 
MODIFY COLUMN price DECIMAL(10, 2) NULL;

-- تحديث المنتجات الموجودة لتعيين نوع السعر كـ 'fixed'
UPDATE products 
SET price_type = 'fixed' 
WHERE price_type IS NULL;

-- إضافة فهرس لحقل price_type
CREATE INDEX idx_price_type ON products(price_type);

SELECT 'Migration completed: Added price_type field to products table' as status;