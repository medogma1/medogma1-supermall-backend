const http = require('http');
const axios = require('axios');

// Test connection to auth service
async function testAuthConnection() {
  console.log('🔍 Testing connection to Auth Service...');
  
  try {
    // Test auth service health
    const authResponse = await axios.get('http://localhost:5000/health', {
      timeout: 5000
    });
    console.log('✅ Auth Service is responding:', authResponse.status);
    
    // Test registration endpoint
    console.log('\n🔍 Testing registration endpoint...');
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Test123456!@#',
      confirmPassword: 'Test123456!@#',
      role: 'customer',
      country: 'مصر',
      governorate: 'القاهرة',
      phoneNumber: '01234567890',
      nationalId: '12345678901234',
      workshopAddress: 'Test Address'
    };
    
    const registerResponse = await axios.post('http://localhost:5000/auth/register', testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration endpoint is working:', registerResponse.status);
    console.log('Response:', registerResponse.data);
    
  } catch (error) {
    console.error('❌ Error testing auth service:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test API Gateway proxy
async function testAPIGatewayProxy() {
  console.log('\n🔍 Testing API Gateway proxy to Auth Service...');
  
  try {
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test2@example.com',
      password: 'Test123456!@#',
      confirmPassword: 'Test123456!@#',
      role: 'customer',
      country: 'مصر',
      governorate: 'القاهرة',
      phoneNumber: '01234567891',
      nationalId: '12345678901235',
      workshopAddress: 'Test Address'
    };
    
    const response = await axios.post('http://localhost:5001/auth/register', testUser, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Gateway proxy is working:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Error testing API Gateway proxy:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function main() {
  await testAuthConnection();
  await testAPIGatewayProxy();
}

main().catch(console.error);