// Test direct connection from API Gateway to Auth Service
const axios = require('axios');

async function testDirectConnection() {
  console.log('🔍 Testing direct connection to Auth Service...');
  
  try {
    // Test health endpoint first
    const healthResponse = await axios.get('http://localhost:5000/health', {
      timeout: 10000
    });
    console.log('✅ Auth Service health check:', healthResponse.status);
    
    // Test registration endpoint
    const testUser = {
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      confirmPassword: 'TestPassword123!',
      phoneNumber: '+1234567890',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      role: 'customer'
    };
    
    console.log('🔍 Testing registration endpoint directly...');
    const registerResponse = await axios.post('http://localhost:5000/auth/register', testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Direct registration successful:', registerResponse.status);
    console.log('Response:', registerResponse.data);
    
  } catch (error) {
    console.error('❌ Direct connection failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
      console.error('Code:', error.code);
    }
  }
}

testDirectConnection();