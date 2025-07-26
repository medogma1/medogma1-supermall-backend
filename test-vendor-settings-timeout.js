const axios = require('axios');

// Test data from the Flutter app
const testData = {
  storeName: 'mora',
  storeDescription: 'maosgjahsklghk',
  contactEmail: 'nono@gmail.com',
  contactPhone: '01013177727',
  storeAddress: 'jhfdgjhlkkhfjfjhjjhg',
  storeLogoUrl: null
};

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIyOSwidXNlcm5hbWUiOiJub25vIG5vbm8iLCJyb2xlIjoidmVuZG9yIiwidmVuZG9ySWQiOjU5LCJpYXQiOjE3NTMxNzY1NzcsImV4cCI6MTc1MzI2Mjk3N30.a1k1oCJPSQRt7E6vczEvPiiFu8hFwWu4bwmwq9GXtM0';

async function testVendorSettingsUpdate() {
  const startTime = Date.now();
  try {
    console.log('🔄 Testing vendor settings update...');
    console.log('📡 URL: http://localhost:5001/api/v1/vendors/59/settings');
    console.log('📦 Data:', JSON.stringify(testData, null, 2));
    
    console.log('⏱️  Start time:', new Date(startTime).toISOString());
    
    const response = await axios({
      method: 'PUT',
      url: 'http://localhost:5001/api/v1/vendors/59/settings',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-App-Version': '1.0.0'
      },
      data: testData,
      timeout: 65000 // 65 seconds timeout
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Success!');
    console.log('⏱️  Duration:', duration + 'ms');
    console.log('📊 Status:', response.status);
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('❌ Error!');
    console.log('⏱️  Duration:', duration + 'ms');
    console.log('🔍 Error details:', error.message);
    console.log('🔍 Error code:', error.code);
    console.log('🔍 Full error:', error);
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testVendorSettingsUpdate();