-- إضافة فئات جديدة باللغة العربية
-- تنفيذ هذا الملف لإضافة فئات شاملة للمتجر

USE supermall;

-- تحديث الفئات الموجودة لتصبح باللغة العربية
UPDATE categories SET 
    name = 'الإلكترونيات',
    description = 'الأجهزة الإلكترونية والإكسسوارات',
    slug = 'electronics'
WHERE id = 1;

UPDATE categories SET 
    name = 'الملابس والأزياء',
    description = 'الأزياء والملابس للرجال والنساء والأطفال',
    slug = 'clothing'
WHERE id = 2;

UPDATE categories SET 
    name = 'المنزل والحديقة',
    description = 'مستلزمات المنزل وأدوات الحديقة',
    slug = 'home-garden'
WHERE id = 3;

UPDATE categories SET 
    name = 'الرياضة واللياقة',
    description = 'المعدات الرياضية وأدوات اللياقة البدنية',
    slug = 'sports'
WHERE id = 4;

UPDATE categories SET 
    name = 'الكتب والتعليم',
    description = 'الكتب والمواد التعليمية',
    slug = 'books'
WHERE id = 5;

-- إضافة فئات جديدة
INSERT IGNORE INTO categories (name, description, slug, is_active, display_order) VALUES
('الصحة والجمال', 'منتجات العناية الشخصية ومستحضرات التجميل والصحة', 'health-beauty', TRUE, 6),
('السيارات والمركبات', 'قطع غيار السيارات وإكسسوارات المركبات', 'automotive', TRUE, 7),
('الطعام والمشروبات', 'المواد الغذائية والمشروبات والحلويات', 'food-beverages', TRUE, 8),
('الألعاب والترفيه', 'ألعاب الأطفال وألعاب الفيديو ووسائل الترفيه', 'toys-entertainment', TRUE, 9),
('المجوهرات والساعات', 'المجوهرات والساعات والإكسسوارات الثمينة', 'jewelry-watches', TRUE, 10),
('الحقائب والأحذية', 'الحقائب والأحذية والإكسسوارات الجلدية', 'bags-shoes', TRUE, 11),
('الأدوات والمعدات', 'الأدوات اليدوية والمعدات الصناعية', 'tools-equipment', TRUE, 12),
('الفنون والحرف', 'المواد الفنية والحرف اليدوية واللوازم الإبداعية', 'arts-crafts', TRUE, 13),
('الحيوانات الأليفة', 'مستلزمات الحيوانات الأليفة والطعام والألعاب', 'pets', TRUE, 14),
('المكتب والقرطاسية', 'اللوازم المكتبية والقرطاسية والمعدات الإدارية', 'office-stationery', TRUE, 15),
('الأطفال والرضع', 'مستلزمات الأطفال والرضع والألعاب التعليمية', 'baby-kids', TRUE, 16),
('الموسيقى والآلات', 'الآلات الموسيقية والمعدات الصوتية', 'music-instruments', TRUE, 17),
('السفر والرحلات', 'مستلزمات السفر والحقائب والإكسسوارات', 'travel', TRUE, 18),
('الهدايا والمناسبات', 'الهدايا ومستلزمات المناسبات والاحتفالات', 'gifts-occasions', TRUE, 19),
('البستنة والزراعة', 'أدوات البستنة والبذور والنباتات', 'gardening', TRUE, 20);

-- إضافة فئات فرعية للإلكترونيات
INSERT IGNORE INTO categories (name, description, slug, parent_id, is_active, display_order) VALUES
('الهواتف الذكية', 'الهواتف المحمولة والإكسسوارات', 'smartphones', 1, TRUE, 1),
('أجهزة الكمبيوتر', 'أجهزة الكمبيوتر المحمولة والمكتبية', 'computers', 1, TRUE, 2),
('التلفزيونات والشاشات', 'أجهزة التلفزيون وشاشات العرض', 'tv-monitors', 1, TRUE, 3),
('الكاميرات والتصوير', 'الكاميرات ومعدات التصوير', 'cameras', 1, TRUE, 4),
('الصوتيات والسماعات', 'السماعات والأنظمة الصوتية', 'audio', 1, TRUE, 5);

-- إضافة فئات فرعية للملابس والأزياء
INSERT IGNORE INTO categories (name, description, slug, parent_id, is_active, display_order) VALUES
('ملابس رجالية', 'الملابس والأزياء للرجال', 'mens-clothing', 2, TRUE, 1),
('ملابس نسائية', 'الملابس والأزياء للنساء', 'womens-clothing', 2, TRUE, 2),
('ملابس أطفال', 'الملابس والأزياء للأطفال', 'kids-clothing', 2, TRUE, 3),
('الملابس الداخلية', 'الملابس الداخلية للرجال والنساء', 'underwear', 2, TRUE, 4),
('الإكسسوارات', 'الإكسسوارات والمجوهرات البسيطة', 'accessories', 2, TRUE, 5);

-- إضافة فئات فرعية للصحة والجمال (سيتم إضافتها لاحقاً بعد إنشاء الفئة الرئيسية)
-- سيتم تنفيذها في خطوة منفصلة

-- الفئات الفرعية ستتم إضافتها في خطوة منفصلة بعد إنشاء الفئات الرئيسية

COMMIT;

SELECT 'تم إضافة الفئات الجديدة بنجاح!' as message;
SELECT COUNT(*) as total_categories FROM categories;
SELECT name, description, slug FROM categories ORDER BY display_order;