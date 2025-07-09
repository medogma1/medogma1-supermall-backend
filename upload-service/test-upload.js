// ملف اختبار لخدمة الرفع
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// تكوين الاختبار
const config = {
  serviceUrl: 'http://localhost:5009/upload',
  testImagePath: path.join(__dirname, 'test-image.jpg'), // سيتم إنشاؤه تلقائيًا إذا لم يكن موجودًا
  createTestImage: true // إنشاء صورة اختبار إذا لم تكن موجودة
};

// إنشاء صورة اختبار إذا لم تكن موجودة
async function createTestImageIfNeeded() {
  if (!config.createTestImage) return;
  
  if (!fs.existsSync(config.testImagePath)) {
    console.log('إنشاء صورة اختبار...');
    
    // تنزيل صورة اختبار من الإنترنت
    const placeholderUrl = 'https://via.placeholder.com/300x200';
    
    return new Promise((resolve, reject) => {
      const protocol = placeholderUrl.startsWith('https') ? https : http;
      
      protocol.get(placeholderUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`فشل تنزيل صورة الاختبار: ${response.statusCode}`));
          return;
        }
        
        const fileStream = fs.createWriteStream(config.testImagePath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          console.log(`تم إنشاء صورة اختبار في: ${config.testImagePath}`);
          resolve();
        });
        
        fileStream.on('error', (err) => {
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  } else {
    console.log(`صورة الاختبار موجودة بالفعل في: ${config.testImagePath}`);
  }
}

// اختبار رفع الملف
async function testFileUpload() {
  try {
    // التأكد من وجود صورة اختبار
    await createTestImageIfNeeded();
    
    // إنشاء حدود للطلب متعدد الأجزاء
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    
    // قراءة ملف الصورة
    const fileContent = fs.readFileSync(config.testImagePath);
    
    // إنشاء محتوى الطلب متعدد الأجزاء
    let body = '';
    
    // إضافة الملف
    body += `--${boundary}\r\n`;
    body += 'Content-Disposition: form-data; name="file"; filename="test-image.jpg"\r\n';
    body += 'Content-Type: image/jpeg\r\n\r\n';
    
    // إنشاء الطلب
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      }
    };
    
    console.log('إرسال طلب رفع الملف...');
    
    // إرسال الطلب
    const url = new URL(config.serviceUrl);
    const protocol = url.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = protocol.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log(`استجابة الخادم (${res.statusCode}):`);
          try {
            const jsonResponse = JSON.parse(responseData);
            console.log(JSON.stringify(jsonResponse, null, 2));
            resolve(jsonResponse);
          } catch (err) {
            console.log(responseData);
            resolve(responseData);
          }
        });
      });
      
      req.on('error', (err) => {
        console.error('خطأ في الاتصال بالخادم:', err.message);
        reject(err);
      });
      
      // كتابة بداية الطلب
      req.write(body);
      
      // كتابة محتوى الملف
      req.write(fileContent);
      
      // كتابة نهاية الطلب
      req.write(`\r\n--${boundary}--\r\n`);
      
      req.end();
    });
  } catch (err) {
    console.error('خطأ في اختبار الرفع:', err);
  }
}

// تنفيذ الاختبار
console.log('===== اختبار خدمة الرفع =====');
testFileUpload()
  .then(() => {
    console.log('===== انتهى الاختبار =====');
  })
  .catch((err) => {
    console.error('فشل الاختبار:', err);
  });