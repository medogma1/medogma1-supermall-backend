@echo off
echo ===== تشغيل خدمة الرفع =====

echo 1. التحقق من وجود التبعيات...
if not exist node_modules (
    echo لم يتم العثور على مجلد node_modules. سيتم تثبيت التبعيات الآن...
    call reinstall-dependencies.bat
) else (
    echo تم العثور على مجلد node_modules.
)

echo 2. تشغيل الخدمة...
npm start

pause