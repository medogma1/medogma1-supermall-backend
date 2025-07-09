@echo off
echo ===== إعادة تثبيت التبعيات لخدمة الرفع =====

echo 1. حذف مجلد node_modules الحالي...
rd /s /q node_modules

echo 2. حذف ملف package-lock.json إن وجد...
del /f /q package-lock.json

echo 3. تثبيت التبعيات من جديد...
npm install

echo ===== تم الانتهاء من إعادة تثبيت التبعيات =====
pause