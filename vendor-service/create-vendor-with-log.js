const axios = require('axios');
const fs = require('fs');

const createVendor = async () => {
  try {
    const response = await axios.post('http://localhost:5005/vendors', {
      email: 'electronics2@example.com',
      phone: '0123456789',
      businessType: 'electronics',
      userId: 1002
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjI1MTQwMDAwfQ.z2RMO8qbJe0W99d_tAR-vWdkVxs-TgQSUwkJH9vN38s'
      }
    });

    const result = {
      success: true,
      data: response.data
    };
    
    // كتابة النتيجة إلى ملف
    fs.writeFileSync('vendor-creation-result.json', JSON.stringify(result, null, 2));
    console.log('تم إنشاء التاجر بنجاح وتم حفظ النتيجة في ملف vendor-creation-result.json');
  } catch (error) {
    const errorResult = {
      success: false,
      error: error.message
    };
    
    if (error.response) {
      errorResult.responseData = error.response.data;
      errorResult.status = error.response.status;
    }
    
    // كتابة الخطأ إلى ملف
    fs.writeFileSync('vendor-creation-error.json', JSON.stringify(errorResult, null, 2));
    console.error('حدث خطأ أثناء إنشاء التاجر وتم حفظ تفاصيل الخطأ في ملف vendor-creation-error.json');
  }
};

createVendor();