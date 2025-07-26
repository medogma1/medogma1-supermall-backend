// ملف اختبار لاختبار مسار PUT /vendors/:id/settings
const axios = require('axios');
const jwt = require('jsonwebtoken');
const config = require('../utils/config');

// إنشاء توكن اختبار لبائع
const testVendorPayload = {
  id: 52,
  vendorId: 52,
  email: 'vendor@test.com',
  role: 'vendor',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
};

const vendorToken = jwt.sign(testVendorPayload, config.jwt.secret);

async function testVendorSettingsUpdate() {
  try {
    console.log('🧪 Testing PUT /vendors/52/settings with valid vendor token...');
    
    const response = await axios({
      method: 'PUT',
      url: 'http://localhost:5005/vendors/52/settings',
      headers: {
        'Authorization': `Bearer ${vendorToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        storeName: 'Test Store Updated',
        storeDescription: 'This is a test store description',
        businessHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' }
        }
      }
    });
    
    console.log('✅ Success! Response:', response.status, response.statusText);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status, error.response.statusText);
      console.log('📄 Error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Request Error:', error.message);
    }
  }
}

// اختبار مع توكن غير صالح
async function testWithInvalidToken() {
  try {
    console.log('\n🧪 Testing with invalid token...');
    
    const response = await axios({
      method: 'PUT',
      url: 'http://localhost:5005/vendors/52/settings',
      headers: {
        'Authorization': 'Bearer invalid_token',
        'Content-Type': 'application/json'
      },
      data: {
        storeName: 'Test Store'
      }
    });
    
    console.log('✅ Unexpected success:', response.status);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Expected error:', error.response.status, error.response.statusText);
      console.log('📄 Error response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Request Error:', error.message);
    }
  }
}

// تشغيل الاختبارات
async function runTests() {
  await testVendorSettingsUpdate();
  await testWithInvalidToken();
}

runTests();