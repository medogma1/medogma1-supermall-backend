@echo off
echo ===== اختبار خدمة الرفع =====

echo 1. التحقق من تشغيل الخدمة...
ping -n 1 localhost:5009 > nul
if %errorlevel% equ 0 (
    echo [OK] خدمة الرفع تعمل على المنفذ 5009
) else (
    echo [WARNING] يبدو أن خدمة الرفع غير متاحة على المنفذ 5009
    echo هل ترغب في تشغيل الخدمة الآن؟ (Y/N)
    set /p choice="الاختيار: "
    if /i "%choice%"=="Y" (
        start cmd /k "start-service.bat"
        echo انتظار بدء تشغيل الخدمة...
        timeout /t 5 /nobreak > nul
    ) else (
        echo تم إلغاء الاختبار.
        goto :end
    )
)

echo 2. اختبار نقطة نهاية /health...
curl -s http://localhost:5009/health
echo.

echo 3. اختبار نقطة نهاية /info...
curl -s http://localhost:5009/info
echo.

echo 4. اختبار رفع ملف...
node test-upload.js

:end
echo ===== انتهى الاختبار =====
pause