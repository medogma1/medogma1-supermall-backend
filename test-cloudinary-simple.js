const { v2: cloudinary } = require('cloudinary');
const config = require('./utils/config');

// تكوين Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

async function testCloudinary() {
  try {
    console.log('🔧 اختبار إعدادات Cloudinary...');
    console.log('Cloud Name:', config.cloudinary.cloudName);
    console.log('API Key:', config.cloudinary.apiKey);
    console.log('API Secret:', config.cloudinary.apiSecret ? 'موجود' : 'غير موجود');
    
    // اختبار رفع صورة من URL
    console.log('\n📤 اختبار رفع صورة...');
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg',
      {
        public_id: 'test-shoes-' + Date.now(),
        folder: 'supermall-test'
      }
    );
    
    console.log('✅ تم رفع الصورة بنجاح!');
    console.log('URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);
    
    // اختبار إنشاء رابط محسن
    console.log('\n🔧 اختبار الروابط المحسنة...');
    const optimizedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });
    console.log('Optimized URL:', optimizedUrl);
    
    // اختبار إنشاء صورة مربعة
    const squareUrl = cloudinary.url(uploadResult.public_id, {
      crop: 'auto',
      gravity: 'auto',
      width: 500,
      height: 500
    });
    console.log('Square URL:', squareUrl);
    
    // حذف الصورة الاختبارية
    console.log('\n🗑️ حذف الصورة الاختبارية...');
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ تم حذف الصورة بنجاح!');
    
    console.log('\n🎉 جميع الاختبارات نجحت! Cloudinary جاهز للاستخدام.');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Cloudinary:', error.message);
    if (error.http_code) {
      console.error('HTTP Code:', error.http_code);
    }
  }
}

testCloudinary();