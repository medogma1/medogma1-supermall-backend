#!/bin/bash

echo "==================================="
echo " إصلاح مشكلة ECONNRESET في Super Mall"
echo "==================================="
echo 

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo "[خطأ] لم يتم العثور على Node.js. يرجى تثبيت Node.js أولاً."
    exit 1
fi

# التحقق من وجود مجلد scripts
if [ ! -d "$(dirname "$0")/scripts" ]; then
    echo "[خطأ] لم يتم العثور على مجلد scripts. يرجى التأكد من تشغيل هذا الملف من المجلد الرئيسي للمشروع."
    exit 1
fi

# التحقق من وجود ملف apply-fixes.js
if [ ! -f "$(dirname "$0")/scripts/apply-fixes.js" ]; then
    echo "[خطأ] لم يتم العثور على ملف apply-fixes.js. يرجى التأكد من وجود جميع ملفات السكربت."
    exit 1
fi

echo "[معلومات] جاري تثبيت التبعيات المطلوبة..."
cd "$(dirname "$0")/scripts"
npm install --no-fund --no-audit --loglevel=error

echo 
echo "[معلومات] جاري تشغيل سكربت إصلاح المشكلة..."
node "$(dirname "$0")/scripts/apply-fixes.js"

echo 
echo "[معلومات] اكتمل تنفيذ السكربت."
echo 
echo "إذا استمرت المشكلة، يمكنك استعادة الإعدادات الأصلية باستخدام:"
echo "node scripts/restore-original.js"
echo 

read -p "اضغط Enter للخروج..."