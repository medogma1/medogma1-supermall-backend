-- استخدام قاعدة البيانات الموحدة
USE supermall;

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'pending',
    price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    shipping_address_id INT,
    payment_id VARCHAR(255),
    notes TEXT,
    discount_applied DECIMAL(10, 2) DEFAULT 0.00,
    coupon_code VARCHAR(50),
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    estimated_delivery_date DATE,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_orders_created_status (created_at, status)
);

-- جدول عناصر الطلب (للطلبات متعددة المنتجات)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- جدول عناوين الشحن
CREATE TABLE IF NOT EXISTS shipping_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line_1 VARCHAR(255) NOT NULL,
    address_line_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'Egypt',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id)
);

-- جدول تتبع الطلبات
CREATE TABLE IF NOT EXISTS order_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned') NOT NULL,
    description TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    order_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP',
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'cash_on_delivery', 'bank_transfer') NOT NULL,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    transaction_id VARCHAR(255),
    gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payments_status_created (payment_status, created_at)
);

-- جدول الكوبونات
CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount') NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    minimum_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    maximum_discount_amount DECIMAL(10, 2),
    usage_limit INT,
    used_count INT DEFAULT 0,
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code),
    INDEX idx_valid_dates (valid_from, valid_until),
    INDEX idx_is_active (is_active),
    INDEX idx_coupons_active_dates (is_active, valid_from, valid_until)
);

-- جدول استخدام الكوبونات
CREATE TABLE IF NOT EXISTS coupon_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_coupon_id (coupon_id),
    INDEX idx_user_id (user_id),
    INDEX idx_order_id (order_id)
);

-- إدراج بيانات تجريبية للكوبونات
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, valid_from, valid_until) VALUES
('WELCOME10', 'خصم 10% للعملاء الجدد', 'percentage', 10.00, 100.00, 50.00, 100, '2024-01-01', '2024-12-31'),
('SAVE20', 'خصم 20 جنيه على الطلبات فوق 200 جنيه', 'fixed_amount', 20.00, 200.00, NULL, 500, '2024-01-01', '2024-12-31'),
('SUMMER25', 'خصم 25% لفصل الصيف', 'percentage', 25.00, 150.00, 100.00, 200, '2024-06-01', '2024-08-31');

-- إدراج بيانات تجريبية للعناوين
INSERT INTO shipping_addresses (user_id, name, phone, address_line_1, city, country, is_default) VALUES
(1, 'أحمد محمد', '01234567890', 'شارع النيل، المعادي', 'القاهرة', 'Egypt', TRUE),
(2, 'فاطمة علي', '01098765432', 'شارع الجامعة، الجيزة', 'الجيزة', 'Egypt', TRUE),
(3, 'محمد حسن', '01156789012', 'كورنيش النيل، أسوان', 'أسوان', 'Egypt', TRUE);

-- إدراج بيانات تجريبية للطلبات
INSERT INTO orders (user_id, product_id, quantity, status, price, total_amount, currency, shipping_address_id, notes) VALUES
(1, 1, 2, 'pending', 150.00, 300.00, 'EGP', 1, 'يرجى التعامل بحذر'),
(2, 2, 1, 'confirmed', 250.00, 250.00, 'EGP', 2, NULL),
(3, 3, 3, 'shipped', 80.00, 240.00, 'EGP', 3, 'تسليم سريع'),
(1, 4, 1, 'delivered', 500.00, 500.00, 'EGP', 1, NULL),
(2, 5, 2, 'cancelled', 120.00, 240.00, 'EGP', 2, 'ألغي بناءً على طلب العميل');

-- إدراج بيانات تتبع الطلبات
INSERT INTO order_tracking (order_id, status, description, location) VALUES
(1, 'pending', 'تم استلام الطلب وجاري المراجعة', 'مركز التوزيع - القاهرة'),
(2, 'confirmed', 'تم تأكيد الطلب وجاري التحضير', 'مستودع المنتجات'),
(3, 'shipped', 'تم شحن الطلب', 'شركة الشحن - القاهرة'),
(4, 'delivered', 'تم تسليم الطلب بنجاح', 'عنوان العميل'),
(5, 'cancelled', 'تم إلغاء الطلب', 'مركز خدمة العملاء');

-- إنشاء فهارس إضافية لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- إنشاء views مفيدة
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.user_id,
    o.status,
    o.total_amount,
    o.currency,
    o.created_at,
    sa.name as shipping_name,
    sa.city as shipping_city,
    p.payment_status,
    p.payment_method
FROM orders o
LEFT JOIN shipping_addresses sa ON o.shipping_address_id = sa.id
LEFT JOIN payments p ON o.id = p.order_id;

CREATE VIEW daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value
FROM orders 
WHERE status IN ('delivered', 'shipped')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;