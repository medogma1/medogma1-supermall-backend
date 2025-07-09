const axios = require('axios');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// تكوين الاتصال بقاعدة البيانات
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'xx100100',
  database: 'supermall'
};

// إنشاء توكن JWT للمستخدم المسؤول
function generateAdminToken() {
  // استخدام المفتاح السري من ملف .env
  const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key';
  
  console.log('المفتاح السري المستخدم:', secretKey);
  
  const payload = {
    userId: 1, // معرف المستخدم المسؤول
    role: 'admin', // دور المستخدم
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // صالح لمدة ساعة واحدة
  };
  
  return jwt.sign(payload, secretKey);
}

// الحصول على قائمة التجار باستخدام التوكن
async function getVendors() {
  try {
    // إنشاء توكن المسؤول
    const adminToken = generateAdminToken();
    
    console.log('تم إنشاء توكن JWT:', adminToken);
    
    // إرسال طلب للحصول على قائمة التجار
    const response = await axios.get('http://localhost:5005/vendors', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('تم استلام قائمة التجار بنجاح:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // حفظ النتيجة في ملف
    const fs = require('fs');
    fs.writeFileSync('vendors-list.json', JSON.stringify(response.data, null, 2));
    console.log('تم حفظ قائمة التجار في ملف vendors-list.json');
    
  } catch (error) {
    console.error('حدث خطأ أثناء الحصول على قائمة التجار:');
    if (error.response) {
      console.error('استجابة الخطأ:', error.response.data);
      console.error('رمز الحالة:', error.response.status);
    } else {
      console.error('تفاصيل الخطأ:', error.message);
    }
    
    // حفظ تفاصيل الخطأ في ملف
    const fs = require('fs');
    const errorDetails = {
      message: error.message,
      response: error.response ? {
        data: error.response.data,
        status: error.response.status
      } : null
    };
    fs.writeFileSync('vendors-error.json', JSON.stringify(errorDetails, null, 2));
    console.log('تم حفظ تفاصيل الخطأ في ملف vendors-error.json');
  }
}

// تنفيذ الدالة
getVendors();