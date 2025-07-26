@echo off
echo ===================================
echo  إصلاح مشكلة ECONNRESET في Super Mall
echo ===================================
echo.

REM التحقق من وجود Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [خطأ] لم يتم العثور على Node.js. يرجى تثبيت Node.js أولاً.
    exit /b 1
)

REM التحقق من وجود مجلد scripts
if not exist "%~dp0scripts" (
    echo [خطأ] لم يتم العثور على مجلد scripts. يرجى التأكد من تشغيل هذا الملف من المجلد الرئيسي للمشروع.
    exit /b 1
)

REM التحقق من وجود ملف apply-fixes.js
if not exist "%~dp0scripts\apply-fixes.js" (
    echo [خطأ] لم يتم العثور على ملف apply-fixes.js. يرجى التأكد من وجود جميع ملفات السكربت.
    exit /b 1
)

echo [معلومات] جاري تثبيت التبعيات المطلوبة...
cd "%~dp0scripts"
npm install --no-fund --no-audit --loglevel=error

echo.
echo [معلومات] جاري تشغيل سكربت إصلاح المشكلة...
node "%~dp0scripts\apply-fixes.js"

echo.
echo [معلومات] اكتمل تنفيذ السكربت.
echo.
echo إذا استمرت المشكلة، يمكنك استعادة الإعدادات الأصلية باستخدام:
echo node scripts\restore-original.js
echo.

pause