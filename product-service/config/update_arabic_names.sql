USE supermall;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE categories SET name = 'الإلكترونيات' WHERE id = 1;
UPDATE categories SET name = 'الملابس والأزياء' WHERE id = 2;
UPDATE categories SET name = 'المنزل والحديقة' WHERE id = 3;
UPDATE categories SET name = 'الرياضة واللياقة' WHERE id = 4;
UPDATE categories SET name = 'الكتب والمجلات' WHERE id = 5;
UPDATE categories SET name = 'الصحة والجمال' WHERE slug = 'health-beauty';
UPDATE categories SET name = 'الأطعمة والمشروبات' WHERE slug = 'food-beverages';
UPDATE categories SET name = 'الألعاب والترفيه' WHERE slug = 'games-entertainment';
UPDATE categories SET name = 'السيارات والدراجات' WHERE slug = 'automotive';
UPDATE categories SET name = 'المجوهرات والساعات' WHERE slug = 'jewelry-watches';