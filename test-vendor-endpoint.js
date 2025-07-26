const jwt = require('jsonwebtoken');
const axios = require('axios');

async function testVendorEndpoint() {
  try {
    // Create a test token
    const token = jwt.sign(
      { id: 1, userId: 1, role: 'vendor' },
      'supermall_secret_key_2024',
      { expiresIn: '1h' }
    );

    // Test data
    const testData = {
      user_id: 1,
      name: 'Test Vendor',
      email: 'test@vendor.com',
      phone: '01234567890',
      business_type: 'individual',
      storeName: 'Test Store',
      contactEmail: 'test@vendor.com',
      contactPhone: '01234567890',
      country: 'مصر',
      governorate: 'القاهرة'
    };

    console.log('Testing vendor endpoint...');
    console.log('URL: http://localhost:5005/api/v1/vendors');
    console.log('Token:', token.substring(0, 50) + '...');
    
    const response = await axios.post(
      'http://localhost:5005/api/v1/vendors',
      testData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Success!');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.log('Error Code:', error.code);
    }
  }
}

testVendorEndpoint();