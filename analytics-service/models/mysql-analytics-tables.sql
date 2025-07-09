-- analytics-service/models/mysql-analytics-tables.sql
-- جداول التحليلات في قاعدة البيانات الموحدة

-- جدول أحداث التحليلات
CREATE TABLE IF NOT EXISTS analytics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول تقارير التحليلات
CREATE TABLE IF NOT EXISTS analytics_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  report_data JSON NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- جدول تحليلات المبيعات
CREATE TABLE IF NOT EXISTS sales_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id VARCHAR(50) NOT NULL,
  period VARCHAR(20) NOT NULL,
  total_revenue DECIMAL(10, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,
  revenue_by_category JSON,
  orders_by_status JSON,
  daily_sales JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY store_period (store_id, period)
);

-- جدول تحليلات العملاء
CREATE TABLE IF NOT EXISTS customer_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id VARCHAR(50) NOT NULL,
  period VARCHAR(20) NOT NULL,
  total_customers INT DEFAULT 0,
  new_customers INT DEFAULT 0,
  repeat_customers INT DEFAULT 0,
  customer_retention_rate DECIMAL(5, 2) DEFAULT 0,
  customers_by_region JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY store_period (store_id, period)
);

-- جدول تحليلات المخزون
CREATE TABLE IF NOT EXISTS inventory_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id VARCHAR(50) NOT NULL,
  period VARCHAR(20) NOT NULL,
  out_of_stock_products INT DEFAULT 0,
  stock_by_category JSON,
  top_performing_products JSON,
  low_performing_products JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY store_period (store_id, period)
);