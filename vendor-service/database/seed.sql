-- vendor-service/database/seed.sql
-- ملف لإدخال بيانات أولية للاختبار

-- استخدام قاعدة البيانات
USE `supermall_vendor_service`;

-- إدخال بيانات البائعين
INSERT INTO `vendors` (
  `email`, 
  `name`, 
  `phone`, 
  `business_type`, 
  `tax_id`, 
  `registration_number`, 
  `is_verified`, 
  `is_active`, 
  `rating`, 
  `services_count`, 
  `reviews_count`, 
  `store_settings_completed`, 
  `commission_rate`, 
  `balance`, 
  `created_at`, 
  `updated_at`
) VALUES 
(
  'vendor1@example.com', 
  'متجر الإلكترونيات الحديثة', 
  '+9661234567890', 
  'شركة', 
  'TX12345', 
  'RG67890', 
  1, 
  1, 
  4.5, 
  5, 
  10, 
  1, 
  10.0, 
  1000.00, 
  NOW(), 
  NOW()
),
(
  'vendor2@example.com', 
  'متجر الأثاث المنزلي', 
  '+9661234567891', 
  'فردي', 
  'TX12346', 
  'RG67891', 
  1, 
  1, 
  4.2, 
  3, 
  7, 
  1, 
  12.0, 
  750.00, 
  NOW(), 
  NOW()
),
(
  'vendor3@example.com', 
  'متجر الملابس العصرية', 
  '+9661234567892', 
  'شركة', 
  'TX12347', 
  'RG67892', 
  0, 
  1, 
  0.0, 
  0, 
  0, 
  0, 
  15.0, 
  0.00, 
  NOW(), 
  NOW()
);

-- إدخال بيانات إعدادات البائعين
INSERT INTO `vendor_settings` (
  `vendor_id`, 
  `store_name`, 
  `description`, 
  `logo_url`, 
  `contact_email`, 
  `contact_phone`, 
  `address`, 
  `social_media`, 
  `seo_settings`, 
  `notification_settings`, 
  `payment_settings`, 
  `shipping_settings`, 
  `policy_settings`, 
  `custom_css`, 
  `is_completed`, 
  `created_at`, 
  `updated_at`
) VALUES 
(
  1, 
  'متجر الإلكترونيات الحديثة', 
  'متجر متخصص في بيع أحدث الأجهزة الإلكترونية والتقنية', 
  '/uploads/logos/vendor1-logo.png', 
  'contact@electronics-store.com', 
  '+9661234567890', 
  '{"street":"شارع الملك فهد","city":"الرياض","state":"الرياض","country":"المملكة العربية السعودية","zip":"12345"}', 
  '{"facebook":"electronics-store","twitter":"@electronics-store","instagram":"electronics_store"}', 
  '{"meta_title":"متجر الإلكترونيات الحديثة - أحدث الأجهزة الإلكترونية","meta_description":"متجر متخصص في بيع أحدث الأجهزة الإلكترونية والتقنية بأفضل الأسعار","meta_keywords":"إلكترونيات، أجهزة، تقنية، هواتف، حاسبات"}', 
  '{"email_notifications":true,"sms_notifications":false}', 
  '{"accepted_payment_methods":["visa","mastercard","mada","applepay"]}', 
  '{"shipping_methods":[{"name":"توصيل سريع","price":30.00},{"name":"توصيل عادي","price":15.00}]}', 
  '{"return_policy":"يمكن إرجاع المنتجات خلال 14 يوماً من تاريخ الاستلام","privacy_policy":"نحن نحترم خصوصية عملائنا ونلتزم بحماية بياناتهم الشخصية"}', 
  'body { font-family: "Cairo", sans-serif; }', 
  1, 
  NOW(), 
  NOW()
),
(
  2, 
  'متجر الأثاث المنزلي', 
  'متجر متخصص في بيع الأثاث المنزلي العصري والكلاسيكي', 
  '/uploads/logos/vendor2-logo.png', 
  'contact@furniture-store.com', 
  '+9661234567891', 
  '{"street":"شارع العليا","city":"الرياض","state":"الرياض","country":"المملكة العربية السعودية","zip":"12346"}', 
  '{"facebook":"furniture-store","twitter":"@furniture-store","instagram":"furniture_store"}', 
  '{"meta_title":"متجر الأثاث المنزلي - أثاث عصري وكلاسيكي","meta_description":"متجر متخصص في بيع الأثاث المنزلي العصري والكلاسيكي بأفضل الأسعار","meta_keywords":"أثاث، منزل، عصري، كلاسيكي، غرف نوم، صالونات"}', 
  '{"email_notifications":true,"sms_notifications":true}', 
  '{"accepted_payment_methods":["visa","mastercard","mada","stcpay"]}', 
  '{"shipping_methods":[{"name":"توصيل وتركيب","price":100.00},{"name":"توصيل فقط","price":50.00}]}', 
  '{"return_policy":"يمكن إرجاع المنتجات خلال 7 أيام من تاريخ الاستلام","privacy_policy":"نحن نحترم خصوصية عملائنا ونلتزم بحماية بياناتهم الشخصية"}', 
  'body { font-family: "Tajawal", sans-serif; }', 
  1, 
  NOW(), 
  NOW()
);

-- إدخال بيانات الخدمات
INSERT INTO `services` (
  `name`, 
  `description`, 
  `price`, 
  `currency`, 
  `type`, 
  `status`, 
  `vendor_id`, 
  `image_urls`, 
  `tags`, 
  `category`, 
  `rating`, 
  `availability`, 
  `specifications`, 
  `created_at`, 
  `updated_at`
) VALUES 
(
  'صيانة أجهزة الحاسب', 
  'خدمة صيانة شاملة لجميع أنواع أجهزة الحاسب المكتبية والمحمولة', 
  150.00, 
  'SAR', 
  1, -- خدمة
  1, -- نشط
  1, -- معرف البائع
  '["uploads/services/computer-repair-1.jpg", "uploads/services/computer-repair-2.jpg"]', 
  '["صيانة", "حاسب", "تقنية"]', 
  'تقنية المعلومات', 
  4.7, 
  '{"days":[1,2,3,4,5],"hours":{"start":"09:00","end":"18:00"}}', 
  '{"duration":"60 دقيقة","location":"في المتجر أو المنزل","warranty":"ضمان 30 يوم على قطع الغيار"}', 
  NOW(), 
  NOW()
),
(
  'تركيب وصيانة شبكات الحاسب', 
  'خدمة تركيب وصيانة شبكات الحاسب للمنازل والشركات', 
  300.00, 
  'SAR', 
  1, -- خدمة
  1, -- نشط
  1, -- معرف البائع
  '["uploads/services/network-setup-1.jpg", "uploads/services/network-setup-2.jpg"]', 
  '["شبكات", "حاسب", "تقنية"]', 
  'تقنية المعلومات', 
  4.5, 
  '{"days":[1,2,3,4,5],"hours":{"start":"09:00","end":"18:00"}}', 
  '{"duration":"120 دقيقة","location":"في المنزل أو الشركة","warranty":"ضمان 60 يوم على التركيب"}', 
  NOW(), 
  NOW()
),
(
  'تصميم وتنفيذ ديكور منزلي', 
  'خدمة تصميم وتنفيذ ديكورات منزلية عصرية وكلاسيكية', 
  500.00, 
  'SAR', 
  1, -- خدمة
  1, -- نشط
  2, -- معرف البائع
  '["uploads/services/home-decor-1.jpg", "uploads/services/home-decor-2.jpg"]', 
  '["ديكور", "تصميم", "منزل"]', 
  'ديكور وتصميم', 
  4.8, 
  '{"days":[0,1,2,3,4],"hours":{"start":"10:00","end":"19:00"}}', 
  '{"duration":"يعتمد على حجم المشروع","location":"في المنزل","warranty":"ضمان سنة على التنفيذ"}', 
  NOW(), 
  NOW()
),
(
  'تركيب أثاث منزلي', 
  'خدمة تركيب جميع أنواع الأثاث المنزلي', 
  200.00, 
  'SAR', 
  1, -- خدمة
  1, -- نشط
  2, -- معرف البائع
  '["uploads/services/furniture-assembly-1.jpg", "uploads/services/furniture-assembly-2.jpg"]', 
  '["أثاث", "تركيب", "منزل"]', 
  'أثاث وتجهيزات', 
  4.6, 
  '{"days":[0,1,2,3,4,5],"hours":{"start":"09:00","end":"20:00"}}', 
  '{"duration":"يعتمد على كمية الأثاث","location":"في المنزل","warranty":"ضمان 30 يوم على التركيب"}', 
  NOW(), 
  NOW()
);

-- إدخال بيانات تقييمات البائعين
INSERT INTO `vendor_ratings` (
  `vendor_id`, 
  `user_id`, 
  `rating`, 
  `comment`, 
  `created_at`, 
  `updated_at`
) VALUES 
(
  1, 
  'user1', 
  5, 
  'خدمة ممتازة وسريعة، أنصح بالتعامل معهم', 
  NOW(), 
  NOW()
),
(
  1, 
  'user2', 
  4, 
  'خدمة جيدة ولكن التوصيل تأخر قليلاً', 
  NOW(), 
  NOW()
),
(
  2, 
  'user1', 
  5, 
  'أثاث رائع وخدمة توصيل وتركيب ممتازة', 
  NOW(), 
  NOW()
),
(
  2, 
  'user3', 
  4, 
  'جودة الأثاث ممتازة ولكن التوصيل استغرق وقتاً طويلاً', 
  NOW(), 
  NOW()
);