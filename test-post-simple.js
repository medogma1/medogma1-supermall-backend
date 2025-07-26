// Simple POST test through API Gateway
const axios = require('axios');

async function testPostSimple() {
  console.log('🔍 Testing simple POST through API Gateway...');
  
  try {
    // Test a simple POST request with minimal data
    const simpleData = {
      test: 'data'
    };
    
    console.log('Testing simple POST to auth health endpoint...');
    const response = await axios.post('http://localhost:5001/auth/health', simpleData, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Simple POST successful:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Simple POST failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
      console.error('Code:', error.code);
    }
  }
}

testPostSimple();