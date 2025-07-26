const axios = require('axios');

// Test toggle-status endpoint
async function testToggleStatus() {
  try {
    console.log('🧪 Testing PATCH /admin/stores/1/toggle-status...');
    
    const response = await axios({
      method: 'PATCH',
      url: 'http://localhost:5001/admin/stores/1/toggle-status',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer your-admin-token-here' // Replace with actual admin token
      }
    });
    
    console.log('✅ Success:', response.data);
    console.log('Status Code:', response.status);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error Response:', error.response.data);
      console.log('Status Code:', error.response.status);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Test without authentication to see the error
async function testWithoutAuth() {
  try {
    console.log('\n🧪 Testing PATCH /admin/stores/1/toggle-status without auth...');
    
    const response = await axios({
      method: 'PATCH',
      url: 'http://localhost:5001/admin/stores/1/toggle-status',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Expected Error (no auth):', error.response.data);
      console.log('Status Code:', error.response.status);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting toggle-status endpoint tests...');
  await testWithoutAuth();
  await testToggleStatus();
  console.log('\n✅ Tests completed!');
}

runTests();