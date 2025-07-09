@echo off
echo ===== تشخيص خدمة الرفع =====

echo 1. التحقق من وجود ملف .env...
if exist .env (
    echo [OK] تم العثور على ملف .env
) else (
    echo [ERROR] لم يتم العثور على ملف .env. يرجى إنشاء الملف باستخدام المعلومات الموجودة في README.md
)

echo 2. التحقق من وجود مجلد التحميل...
if exist uploads (
    echo [OK] تم العثور على مجلد uploads
) else (
    echo [WARNING] لم يتم العثور على مجلد uploads. سيتم إنشاؤه تلقائيًا عند تشغيل الخدمة.
    mkdir uploads
    echo تم إنشاء مجلد uploads
)

echo 3. التحقق من تثبيت التبعيات...
if exist node_modules (
    echo [OK] تم العثور على مجلد node_modules
) else (
    echo [ERROR] لم يتم العثور على مجلد node_modules. يرجى تشغيل reinstall-dependencies.bat
)

echo 4. التحقق من إصدار Node.js...
node --version

echo 5. التحقق من إصدار npm...
npm --version

echo ===== انتهى التشخيص =====
pause