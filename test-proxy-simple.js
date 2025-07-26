// Simple test to verify proxy functionality
const axios = require('axios');

async function testProxySimple() {
  console.log('🔍 Testing simple proxy connection...');
  
  try {
    // Test health endpoint through API Gateway
    console.log('Testing health endpoint through API Gateway...');
    const healthResponse = await axios.get('http://localhost:5001/auth/health', {
      timeout: 10000
    });
    console.log('✅ Health check via API Gateway:', healthResponse.status);
    console.log('Response:', healthResponse.data);
    
  } catch (error) {
    console.error('❌ Proxy test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
      console.error('Code:', error.code);
    }
  }
}

testProxySimple();