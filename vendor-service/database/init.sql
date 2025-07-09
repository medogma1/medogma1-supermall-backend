-- vendor-service/database/init.sql
-- ملف التهيئة الرئيسي لقاعدة بيانات خدمة البائعين

-- إنشاء قاعدة البيانات إذا لم تكن موجودة
CREATE DATABASE IF NOT EXISTS `supermall_vendor_service` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- استخدام قاعدة البيانات
USE `supermall_vendor_service`;

-- تنفيذ ملفات SQL بالترتيب الصحيح

-- 1. إنشاء جدول البائعين
SOURCE vendors.sql;

-- 2. إنشاء جدول إعدادات البائعين
SOURCE vendor_settings.sql;

-- 3. إنشاء جدول تقييمات البائعين
SOURCE vendor_ratings.sql;

-- 4. إنشاء جدول الخدمات
SOURCE services.sql;

-- ملاحظة: يمكن إضافة المزيد من الجداول هنا في المستقبل

-- إنشاء مستخدم قاعدة البيانات وإعطاء الصلاحيات
CREATE USER IF NOT EXISTS 'supermall_vendor'@'localhost' IDENTIFIED BY 'vendor_password_here';
GRANT ALL PRIVILEGES ON `supermall_vendor_service`.* TO 'supermall_vendor'@'localhost';
FLUSH PRIVILEGES;

-- ملاحظة: يجب تغيير كلمة المرور في بيئة الإنتاج