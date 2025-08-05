-- Enhanced Product Service Database Schema
-- This schema separates tags into a dedicated table for better performance

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS supermall_products;
USE supermall_products;

-- Products table (enhanced)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NULL,
    price_type ENUM('fixed', 'contact') DEFAULT 'fixed',
    vendor_id INT NOT NULL,
    category_id INT NOT NULL,
    image_url VARCHAR(500),
    stock_quantity INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_category_id (category_id),
    INDEX idx_price (price),
    INDEX idx_rating (rating),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    INDEX idx_stock_quantity (stock_quantity),
    INDEX idx_name (name),
    
    CONSTRAINT chk_price_positive CHECK (price >= 0),
    CONSTRAINT chk_rating_range CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT chk_stock_non_negative CHECK (stock_quantity >= 0)
);

-- Product tags table (new normalized approach)
CREATE TABLE IF NOT EXISTS product_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_tag_name (tag_name),
    UNIQUE KEY unique_product_tag (product_id, tag_name)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id INT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_parent_id (parent_id),
    INDEX idx_is_active (is_active),
    INDEX idx_sort_order (sort_order)
);

-- Product images table (for multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_sort_order (sort_order)
);

-- Product variants table (for size, color, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_name VARCHAR(100) NOT NULL, -- e.g., 'Size', 'Color'
    variant_value VARCHAR(100) NOT NULL, -- e.g., 'Large', 'Red'
    price_adjustment DECIMAL(10, 2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    sku VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_variant_name (variant_name),
    INDEX idx_is_active (is_active),
    UNIQUE KEY unique_product_variant (product_id, variant_name, variant_value)
);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    rating INT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_is_approved (is_approved),
    INDEX idx_created_at (created_at),
    
    CONSTRAINT chk_rating_valid CHECK (rating >= 1 AND rating <= 5),
    UNIQUE KEY unique_user_product_review (user_id, product_id)
);

-- Product inventory tracking
CREATE TABLE IF NOT EXISTS product_inventory_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_id INT NULL,
    change_type ENUM('IN', 'OUT', 'ADJUSTMENT') NOT NULL,
    quantity_change INT NOT NULL,
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reason VARCHAR(255),
    reference_id VARCHAR(100), -- order_id, adjustment_id, etc.
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_variant_id (variant_id),
    INDEX idx_change_type (change_type),
    INDEX idx_created_at (created_at)
);

-- Views for better data access

-- View for products with tag counts
CREATE OR REPLACE VIEW products_with_tag_count AS
SELECT 
    p.*,
    COUNT(pt.id) as tag_count
FROM products p
LEFT JOIN product_tags pt ON p.id = pt.product_id
GROUP BY p.id;

-- View for products with average ratings
CREATE OR REPLACE VIEW products_with_ratings AS
SELECT 
    p.*,
    COALESCE(AVG(pr.rating), 0) as avg_rating,
    COUNT(pr.id) as total_reviews
FROM products p
LEFT JOIN product_reviews pr ON p.id = pr.product_id AND pr.is_approved = TRUE
GROUP BY p.id;

-- View for popular tags
CREATE OR REPLACE VIEW popular_tags AS
SELECT 
    pt.tag_name,
    COUNT(pt.product_id) as product_count,
    COUNT(DISTINCT pt.product_id) as unique_products
FROM product_tags pt
INNER JOIN products p ON pt.product_id = p.id AND p.is_active = TRUE
GROUP BY pt.tag_name
ORDER BY product_count DESC;

-- Stored procedures for common operations

DELIMITER //

-- Procedure to update product rating
CREATE PROCEDURE UpdateProductRating(IN p_product_id INT)
BEGIN
    DECLARE avg_rating DECIMAL(3,2);
    DECLARE review_count INT;
    
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM product_reviews 
    WHERE product_id = p_product_id AND is_approved = TRUE;
    
    UPDATE products 
    SET 
        rating = avg_rating,
        review_count = review_count,
        updated_at = NOW()
    WHERE id = p_product_id;
END //

-- Procedure to update inventory
CREATE PROCEDURE UpdateProductInventory(
    IN p_product_id INT,
    IN p_variant_id INT,
    IN p_change_type VARCHAR(20),
    IN p_quantity_change INT,
    IN p_reason VARCHAR(255),
    IN p_reference_id VARCHAR(100),
    IN p_created_by INT
)
BEGIN
    DECLARE current_qty INT DEFAULT 0;
    DECLARE new_qty INT;
    
    -- Get current quantity
    IF p_variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO current_qty 
        FROM product_variants 
        WHERE id = p_variant_id;
        
        SET new_qty = current_qty + p_quantity_change;
        
        UPDATE product_variants 
        SET stock_quantity = new_qty, updated_at = NOW() 
        WHERE id = p_variant_id;
    ELSE
        SELECT stock_quantity INTO current_qty 
        FROM products 
        WHERE id = p_product_id;
        
        SET new_qty = current_qty + p_quantity_change;
        
        UPDATE products 
        SET stock_quantity = new_qty, updated_at = NOW() 
        WHERE id = p_product_id;
    END IF;
    
    -- Log the change
    INSERT INTO product_inventory_log (
        product_id, variant_id, change_type, quantity_change, 
        previous_quantity, new_quantity, reason, reference_id, created_by
    ) VALUES (
        p_product_id, p_variant_id, p_change_type, p_quantity_change,
        current_qty, new_qty, p_reason, p_reference_id, p_created_by
    );
END //

DELIMITER ;

-- Sample data for testing

-- Insert sample categories
INSERT IGNORE INTO categories (id, name, description, is_active) VALUES
(1, 'Electronics', 'Electronic devices and accessories', TRUE),
(2, 'Clothing', 'Fashion and apparel', TRUE),
(3, 'Home & Garden', 'Home improvement and garden supplies', TRUE),
(4, 'Books', 'Books and educational materials', TRUE),
(5, 'Sports', 'Sports equipment and accessories', TRUE);

-- Insert sample products
INSERT IGNORE INTO products (id, name, description, price, vendor_id, category_id, image_url, stock_quantity, is_active) VALUES
(1, 'iPhone 15 Pro', 'Latest iPhone with advanced features', 999.99, 1, 1, '/images/iphone15pro.jpg', 50, TRUE),
(2, 'Samsung Galaxy S24', 'Premium Android smartphone', 899.99, 2, 1, '/images/galaxys24.jpg', 30, TRUE),
(3, 'Nike Air Max', 'Comfortable running shoes', 129.99, 3, 2, '/images/nikeairmax.jpg', 100, TRUE),
(4, 'MacBook Pro M3', 'Professional laptop for creators', 1999.99, 1, 1, '/images/macbookpro.jpg', 25, TRUE),
(5, 'Adidas T-Shirt', 'Cotton sports t-shirt', 29.99, 4, 2, '/images/adidas-tshirt.jpg', 200, TRUE);

-- Insert sample tags
INSERT IGNORE INTO product_tags (product_id, tag_name) VALUES
(1, 'smartphone'),
(1, 'apple'),
(1, 'ios'),
(1, 'premium'),
(2, 'smartphone'),
(2, 'samsung'),
(2, 'android'),
(2, 'premium'),
(3, 'shoes'),
(3, 'nike'),
(3, 'running'),
(3, 'sports'),
(4, 'laptop'),
(4, 'apple'),
(4, 'macbook'),
(4, 'professional'),
(5, 'clothing'),
(5, 'adidas'),
(5, 'sports'),
(5, 'casual');

-- Insert sample reviews
INSERT IGNORE INTO product_reviews (product_id, user_id, rating, title, comment, is_verified_purchase) VALUES
(1, 1, 5, 'Excellent phone!', 'Best iPhone yet, camera quality is amazing', TRUE),
(1, 2, 4, 'Great but expensive', 'Love the features but price is high', TRUE),
(2, 3, 4, 'Good Android phone', 'Solid performance and good battery life', TRUE),
(3, 4, 5, 'Perfect running shoes', 'Very comfortable for long runs', TRUE),
(4, 5, 5, 'Best laptop for work', 'Fast performance and great display', TRUE);

-- Update product ratings based on reviews
CALL UpdateProductRating(1);
CALL UpdateProductRating(2);
CALL UpdateProductRating(3);
CALL UpdateProductRating(4);
CALL UpdateProductRating(5);

-- Create indexes for better performance
CREATE INDEX idx_products_search ON products(name, description);
CREATE INDEX idx_products_price_range ON products(price, is_active);
CREATE INDEX idx_products_vendor_category ON products(vendor_id, category_id, is_active);
CREATE INDEX idx_tags_search ON product_tags(tag_name, product_id);
CREATE INDEX idx_reviews_product_rating ON product_reviews(product_id, rating, is_approved);

-- Full-text search indexes
ALTER TABLE products ADD FULLTEXT(name, description);
ALTER TABLE product_tags ADD FULLTEXT(tag_name);