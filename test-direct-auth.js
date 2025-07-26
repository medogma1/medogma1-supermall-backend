// Test registration directly on auth service (bypassing API Gateway)
const axios = require('axios');

async function testDirectAuth() {
  console.log('🔍 Testing registration directly on Auth Service...');
  
  try {
    const userData = {
      name: 'Test User Direct',
      email: 'testdirect@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      phone: '1234567890',
      governorate: 'Cairo',
      address: '123 Test Street',
      role: 'customer'
    };
    
    console.log('Testing direct registration on port 5000...');
    const response = await axios.post('http://localhost:5000/auth/register', userData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Direct registration successful:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Direct registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
      console.error('Code:', error.code);
    }
  }
}

testDirectAuth();