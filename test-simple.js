const axios = require('axios');

// Test simple health check
async function testHealth() {
  console.log('🔍 Testing API Gateway health...');
  
  try {
    const response = await axios.get('http://localhost:5001/api/health', {
      timeout: 30000
    });
    console.log('✅ API Gateway health check:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Health check failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Test direct auth service health
async function testAuthHealth() {
  console.log('\n🔍 Testing Auth Service health directly...');
  
  try {
    const response = await axios.get('http://localhost:5000/health', {
      timeout: 10000
    });
    console.log('✅ Auth Service health check:', response.status);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Auth health check failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function main() {
  await testAuthHealth();
  await testHealth();
}

main().catch(console.error);