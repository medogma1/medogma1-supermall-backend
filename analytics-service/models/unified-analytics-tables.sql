-- analytics-service/models/unified-analytics-tables.sql
-- جداول التحليلات الموحدة في قاعدة البيانات

-- ===== جداول تحليلات الأعمال =====

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

-- ===== جداول أداء التطبيق =====

-- جدول أداء التطبيق
CREATE TABLE IF NOT EXISTS app_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  load_time INT NOT NULL COMMENT 'وقت التحميل بالمللي ثانية',
  memory_usage FLOAT NOT NULL COMMENT 'استخدام الذاكرة بالميجابايت',
  cpu_usage FLOAT NOT NULL COMMENT 'استخدام المعالج بالنسبة المئوية',
  endpoint VARCHAR(255) NOT NULL COMMENT 'نقطة النهاية',
  response_time INT NOT NULL COMMENT 'وقت الاستجابة بالمللي ثانية',
  status_code INT NOT NULL COMMENT 'رمز الحالة',
  user_agent VARCHAR(255) COMMENT 'وكيل المستخدم',
  ip_address VARCHAR(45) COMMENT 'عنوان IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول سجلات الأخطاء
CREATE TABLE IF NOT EXISTS error_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  error_type VARCHAR(100) NOT NULL COMMENT 'نوع الخطأ',
  error_message TEXT NOT NULL COMMENT 'رسالة الخطأ',
  stack_trace TEXT COMMENT 'تتبع المكدس',
  endpoint VARCHAR(255) COMMENT 'نقطة النهاية',
  user_agent VARCHAR(255) COMMENT 'وكيل المستخدم',
  ip_address VARCHAR(45) COMMENT 'عنوان IP',
  user_id VARCHAR(36) COMMENT 'معرف المستخدم',
  is_fatal BOOLEAN DEFAULT FALSE COMMENT 'هل الخطأ قاتل',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_error_type (error_type),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول مشاركة المستخدم
CREATE TABLE IF NOT EXISTS user_engagement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL COMMENT 'معرف المستخدم',
  session_id VARCHAR(100) NOT NULL COMMENT 'معرف الجلسة',
  start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'وقت البدء',
  end_time TIMESTAMP NULL COMMENT 'وقت الانتهاء',
  duration INT COMMENT 'المدة بالثواني',
  device VARCHAR(100) COMMENT 'الجهاز',
  platform VARCHAR(100) COMMENT 'المنصة',
  browser VARCHAR(100) COMMENT 'المتصفح',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول صفحات مشاركة المستخدم
CREATE TABLE IF NOT EXISTS user_engagement_pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  engagement_id INT NOT NULL COMMENT 'معرف المشاركة',
  page VARCHAR(255) NOT NULL COMMENT 'الصفحة',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'الطابع الزمني',
  duration INT COMMENT 'المدة بالثواني',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES user_engagement(id) ON DELETE CASCADE,
  INDEX idx_engagement_id (engagement_id),
  INDEX idx_page (page)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول أحداث مشاركة المستخدم
CREATE TABLE IF NOT EXISTS user_engagement_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  engagement_id INT NOT NULL COMMENT 'معرف المشاركة',
  event_name VARCHAR(100) NOT NULL COMMENT 'اسم الحدث',
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'الطابع الزمني',
  properties JSON COMMENT 'خصائص الحدث',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (engagement_id) REFERENCES user_engagement(id) ON DELETE CASCADE,
  INDEX idx_engagement_id (engagement_id),
  INDEX idx_event_name (event_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- جدول أداء API
CREATE TABLE IF NOT EXISTS api_performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL COMMENT 'نقطة النهاية',
  method VARCHAR(10) NOT NULL COMMENT 'طريقة الطلب',
  response_time INT NOT NULL COMMENT 'وقت الاستجابة بالمللي ثانية',
  status_code INT NOT NULL COMMENT 'رمز الحالة',
  request_size INT COMMENT 'حجم الطلب بالبايت',
  response_size INT COMMENT 'حجم الاستجابة بالبايت',
  user_id VARCHAR(36) COMMENT 'معرف المستخدم',
  ip_address VARCHAR(45) COMMENT 'عنوان IP',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_endpoint (endpoint),
  INDEX idx_method (method),
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;