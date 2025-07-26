// اختبار شامل لتحديث إعدادات المتجر مع جميع البيانات المطلوبة
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../utils/config');

// إنشاء توكن اختبار صالح للبائع
const testVendorPayload = {
  id: 52,
  vendorId: 52,
  email: 'vendor@test.com',
  role: 'vendor',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
};

const vendorToken = jwt.sign(testVendorPayload, config.jwt.secret);

// بيانات كاملة لتحديث إعدادات المتجر
const completeStoreSettings = {
  storeName: 'متجر الاختبار المحدث',
  storeDescription: 'هذا متجر تجريبي لاختبار النظام',
  storeLogoUrl: 'https://example.com/logo.png',
  contactEmail: 'store@test.com',
  contactPhone: '+966501234567',
  storeAddress: 'الرياض، حي النخيل، شارع الملك فهد',
  businessHours: {
    sunday: { open: '09:00', close: '22:00', isOpen: true },
    monday: { open: '09:00', close: '22:00', isOpen: true },
    tuesday: { open: '09:00', close: '22:00', isOpen: true },
    wednesday: { open: '09:00', close: '22:00', isOpen: true },
    thursday: { open: '09:00', close: '22:00', isOpen: true },
    friday: { open: '14:00', close: '22:00', isOpen: true },
    saturday: { open: '09:00', close: '22:00', isOpen: true }
  },
  deliverySettings: {
    deliveryFee: 15.00,
    freeDeliveryThreshold: 100.00,
    estimatedDeliveryTime: '30-45 دقيقة'
  },
  socialMedia: {
    instagram: '@test_store',
    twitter: '@test_store',
    facebook: 'test.store'
  }
};

async function testCompleteStoreUpdate() {
  try {
    console.log('🧪 اختبار تحديث إعدادات المتجر مع البيانات الكاملة...');
    console.log('🔑 التوكن المستخدم:', vendorToken.substring(0, 50) + '...');
    
    const response = await axios({
      method: 'PUT',
      url: 'http://localhost:5005/vendors/52/settings',
      headers: {
        'Authorization': `Bearer ${vendorToken}`,
        'Content-Type': 'application/json'
      },
      data: completeStoreSettings
    });
    
    console.log('✅ نجح التحديث! الاستجابة:', response.status, response.statusText);
    console.log('📄 بيانات الاستجابة:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ خطأ HTTP:', error.response.status, error.response.statusText);
      console.log('📄 تفاصيل الخطأ:');
      console.log(JSON.stringify(error.response.data, null, 2));
      
      // إذا كان الخطأ 400، اطبع البيانات المرسلة للمراجعة
      if (error.response.status === 400) {
        console.log('\n📋 البيانات المرسلة:');
        console.log(JSON.stringify(completeStoreSettings, null, 2));
      }
    } else {
      console.log('❌ خطأ في الطلب:', error.message);
    }
  }
}

// اختبار مع بيانات ناقصة لفهم الحقول المطلوبة
async function testIncompleteData() {
  try {
    console.log('\n🧪 اختبار مع بيانات ناقصة...');
    
    const incompleteData = {
      storeName: 'متجر ناقص البيانات'
    };
    
    const response = await axios({
      method: 'PUT',
      url: 'http://localhost:5005/vendors/52/settings',
      headers: {
        'Authorization': `Bearer ${vendorToken}`,
        'Content-Type': 'application/json'
      },
      data: incompleteData
    });
    
    console.log('✅ نجح بشكل غير متوقع:', response.status);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ خطأ متوقع:', error.response.status, error.response.statusText);
      console.log('📄 الحقول المطلوبة:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
  }
}

// اختبار جلب الإعدادات الحالية
async function testGetSettings() {
  try {
    console.log('\n🧪 اختبار جلب إعدادات المتجر الحالية...');
    
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:5005/vendors/52/settings',
      headers: {
        'Authorization': `Bearer ${vendorToken}`
      }
    });
    
    console.log('✅ تم جلب الإعدادات بنجاح:', response.status);
    console.log('📄 الإعدادات الحالية:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ خطأ في جلب الإعدادات:', error.response.status);
      console.log('📄 تفاصيل الخطأ:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
  console.log('🚀 بدء الاختبارات الشاملة لخدمة البائعين\n');
  
  await testGetSettings();
  await testIncompleteData();
  await testCompleteStoreUpdate();
  
  console.log('\n✨ انتهت جميع الاختبارات');
}

runAllTests();