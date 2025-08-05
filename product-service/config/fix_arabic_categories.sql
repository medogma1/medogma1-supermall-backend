-- إصلاح الفئات العربية
USE supermall;

-- تحديث الفئات الموجودة بأسماء عربية صحيحة
UPDATE categories SET name = 'الإلكترونيات' WHERE id = 1;
UPDATE categories SET name = 'الملابس والأزياء' WHERE id = 2;
UPDATE categories SET name = 'المنزل والحديقة' WHERE id = 3;
UPDATE categories SET name = 'الرياضة واللياقة' WHERE id = 4;
UPDATE categories SET name = 'الكتب والمجلات' WHERE id = 5;

-- تحديث الأوصاف
UPDATE categories SET description = 'جميع الأجهزة الإلكترونية والتقنية' WHERE id = 1;
UPDATE categories SET description = 'ملابس رجالية ونسائية وأطفال' WHERE id = 2;
UPDATE categories SET description = 'أدوات منزلية ومستلزمات الحديقة' WHERE id = 3;
UPDATE categories SET description = 'معدات رياضية ومكملات اللياقة' WHERE id = 4;
UPDATE categories SET description = 'كتب ومجلات متنوعة' WHERE id = 5;

-- تحديث الفئات الموجودة بأسماء عربية
UPDATE categories SET name = 'الصحة والجمال', description = 'منتجات العناية الشخصية ومستحضرات التجميل' WHERE slug = 'health-beauty';
UPDATE categories SET name = 'الأطعمة والمشروبات', description = 'مواد غذائية ومشروبات متنوعة' WHERE slug = 'food-beverages';
UPDATE categories SET name = 'الألعاب والترفيه', description = 'ألعاب أطفال وألعاب إلكترونية' WHERE slug = 'games-entertainment';
UPDATE categories SET name = 'السيارات والدراجات', description = 'قطع غيار ومستلزمات السيارات' WHERE slug = 'automotive';
UPDATE categories SET name = 'المجوهرات والساعات', description = 'مجوهرات وساعات فاخرة' WHERE slug = 'jewelry-watches';
UPDATE categories SET name = 'الحقائب والأحذية', description = 'حقائب وأحذية للجميع' WHERE slug = 'bags-shoes';
UPDATE categories SET name = 'الأدوات والمعدات', description = 'أدوات يدوية ومعدات صناعية' WHERE slug = 'tools-equipment';
UPDATE categories SET name = 'الفنون والحرف', description = 'مستلزمات الفنون والحرف اليدوية' WHERE slug = 'arts-crafts';
UPDATE categories SET name = 'الموسيقى والآلات', description = 'آلات موسيقية ومعدات صوتية' WHERE slug = 'music-instruments';
UPDATE categories SET name = 'السفر والرحلات', description = 'مستلزمات السفر والرحلات' WHERE slug = 'travel';
UPDATE categories SET name = 'التعليم والتدريب', description = 'كورسات ومواد تعليمية' WHERE slug = 'education';
UPDATE categories SET name = 'الخدمات المنزلية', description = 'خدمات التنظيف والصيانة' WHERE slug = 'home-services';
UPDATE categories SET name = 'الحيوانات الأليفة', description = 'مستلزمات الحيوانات الأليفة' WHERE slug = 'pets';
UPDATE categories SET name = 'الهدايا والمناسبات', description = 'هدايا للمناسبات المختلفة' WHERE slug = 'gifts-occasions';
UPDATE categories SET name = 'البستنة والزراعة', description = 'أدوات البستنة والنباتات' WHERE slug = 'gardening';