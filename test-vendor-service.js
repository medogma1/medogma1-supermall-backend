const axios = require('axios');

async function testVendorService() {
  try {
    console.log('Testing vendor service...');
    
    // Test vendor service connection
    const response = await axios.get('http://localhost:5005/');
    console.log('Vendor service health check response:', response.data);
    
    // You can add more tests here if needed
    
    console.log('Vendor service test completed successfully');
  } catch (error) {
    console.error('Error testing vendor service:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVendorService();