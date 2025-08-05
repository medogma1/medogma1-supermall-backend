-- Migration: Add is_featured column to products table
-- This migration adds the missing is_featured column that is referenced in the code

USE supermall;

-- Add is_featured column to products table
ALTER TABLE products 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE COMMENT 'Whether the product is featured';

-- Add index for better performance on featured products queries
CREATE INDEX idx_is_featured ON products (is_featured);

-- Add composite index for featured and active products
CREATE INDEX idx_featured_active ON products (is_featured, is_active);

SELECT 'Migration completed: Added is_featured column to products table' as status;