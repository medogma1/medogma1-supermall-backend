const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

// قراءة الإعدادات مباشرة من متغيرات البيئة
const cloudName = process.env.CLOUD_NAME;
const apiKey = process.env.CLOUD_API_KEY;
const apiSecret = process.env.CLOUD_API_SECRET;

console.log('🔧 التحقق من إعدادات Cloudinary...');
console.log('Cloud Name:', cloudName);
console.log('API Key:', apiKey);
console.log('API Secret Length:', apiSecret ? apiSecret.length : 'غير موجود');
console.log('API Secret (first 4 chars):', apiSecret ? apiSecret.substring(0, 4) + '...' : 'غير موجود');

// تكوين Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

// اختبار بسيط للتحقق من صحة الإعدادات
async function testCloudinaryConfig() {
  try {
    console.log('\n🔄 محاولة الاتصال بـ Cloudinary...');
    
    // محاولة الحصول على معلومات الحساب
    const result = await cloudinary.api.ping();
    console.log('✅ تم الاتصال بـ Cloudinary بنجاح!');
    console.log('Response:', result);
    
    // اختبار رفع صورة بسيطة
    console.log('\n📤 اختبار رفع صورة...');
    const uploadResult = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      {
        public_id: 'test-image-' + Date.now(),
        folder: 'supermall-test'
      }
    );
    console.log('✅ تم رفع الصورة بنجاح!');
    console.log('URL:', uploadResult.secure_url);
    
    // حذف الصورة التجريبية
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ تم حذف الصورة التجريبية');
    
  } catch (error) {
    console.log('❌ فشل الاتصال بـ Cloudinary:');
    console.log('Error:', error);
    console.log('Error Code:', error.http_code);
    console.log('Error Message:', error.message);
    
    if (error.http_code === 401) {
      console.log('\n🔍 تشخيص المشكلة:');
      console.log('- تأكد من صحة API Key و API Secret');
      console.log('- تحقق من أن الحساب نشط');
      console.log('- تأكد من عدم وجود مسافات إضافية في المتغيرات');
    }
  }
}

testCloudinaryConfig();