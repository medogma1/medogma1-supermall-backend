const { uploadImageFromBuffer, deleteImage, getOptimizedUrl, getSquareUrl } = require('./utils/cloudinary');
const fs = require('fs');
const path = require('path');

// اختبار رفع صورة إلى Cloudinary
async function testCloudinaryUpload() {
  try {
    console.log('🚀 بدء اختبار Cloudinary...');
    
    // إنشاء صورة اختبار بسيطة (SVG)
    const testImageSVG = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#4CAF50"/>
        <text x="100" y="100" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dy=".3em">
          اختبار Cloudinary
        </text>
        <circle cx="50" cy="50" r="20" fill="#FFC107"/>
        <circle cx="150" cy="50" r="20" fill="#FF5722"/>
        <circle cx="100" cy="150" r="30" fill="#2196F3"/>
      </svg>
    `;
    
    const imageBuffer = Buffer.from(testImageSVG);
    
    console.log('📤 رفع الصورة إلى Cloudinary...');
    
    // رفع الصورة
    const uploadResult = await uploadImageFromBuffer(imageBuffer, {
      folder: 'supermall/test',
      public_id: `test-image-${Date.now()}`,
      resource_type: 'image'
    });
    
    console.log('✅ تم رفع الصورة بنجاح!');
    console.log('📋 تفاصيل الرفع:', {
      url: uploadResult.url,
      public_id: uploadResult.public_id,
      width: uploadResult.width,
      height: uploadResult.height,
      format: uploadResult.format,
      bytes: uploadResult.bytes
    });
    
    // اختبار الروابط المحسنة
    console.log('\n🔧 اختبار الروابط المحسنة...');
    
    const optimizedUrl = getOptimizedUrl(uploadResult.public_id);
    const squareUrl = getSquareUrl(uploadResult.public_id, 150);
    
    console.log('🖼️ الرابط المحسن:', optimizedUrl);
    console.log('⬜ الرابط المربع:', squareUrl);
    
    // اختبار حذف الصورة
    console.log('\n🗑️ اختبار حذف الصورة...');
    
    const deleteResult = await deleteImage(uploadResult.public_id);
    
    if (deleteResult.success) {
      console.log('✅ تم حذف الصورة بنجاح!');
    } else {
      console.log('❌ فشل في حذف الصورة:', deleteResult.result);
    }
    
    console.log('\n🎉 انتهى الاختبار بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار Cloudinary:', error.message);
    console.error('📝 تفاصيل الخطأ:', error);
  }
}

// اختبار إعدادات Cloudinary
function testCloudinaryConfig() {
  const config = require('./utils/config');
  
  console.log('⚙️ فحص إعدادات Cloudinary...');
  console.log('☁️ اسم السحابة:', config.cloudinary.cloudName || '❌ غير محدد');
  console.log('🔑 مفتاح API:', config.cloudinary.apiKey ? '✅ محدد' : '❌ غير محدد');
  console.log('🔐 سر API:', config.cloudinary.apiSecret ? '✅ محدد' : '❌ غير محدد');
  console.log('🌐 رابط Cloudinary:', config.cloudinary.url || '❌ غير محدد');
  
  const isConfigured = config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret;
  
  if (isConfigured) {
    console.log('✅ إعدادات Cloudinary مكتملة!');
    return true;
  } else {
    console.log('❌ إعدادات Cloudinary غير مكتملة!');
    return false;
  }
}

// تشغيل الاختبارات
async function runTests() {
  console.log('🧪 بدء اختبارات Cloudinary\n');
  
  // فحص الإعدادات أولاً
  const configOk = testCloudinaryConfig();
  
  if (configOk) {
    console.log('\n');
    await testCloudinaryUpload();
  } else {
    console.log('\n❌ لا يمكن تشغيل اختبار الرفع بسبب نقص الإعدادات');
  }
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCloudinaryUpload,
  testCloudinaryConfig,
  runTests
};