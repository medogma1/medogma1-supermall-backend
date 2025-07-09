const axios = require('axios');

async function testVendorEmail() {
  try {
    console.log('Testing vendor email functionality...');
    
    // Let's test with a sample email
    const testEmail = 'test@example.com';
    console.log(`Testing with email: ${testEmail}`);

    
    try {
      // Test finding vendor by email
      const emailResponse = await axios.get(`http://localhost:5005/vendors/email/${testEmail}`);
      console.log('Vendor found by email:', emailResponse.data);
    } catch (emailError) {
      console.log(`No vendor found with email: ${testEmail}`);
      console.log('Error details:', emailError.response ? emailError.response.data : emailError.message);
      
      // Let's try creating a vendor with this email for testing
      console.log('\nCreating a test vendor...');
      try {
        const createResponse = await axios.post('http://localhost:5005/vendors', {
          user_id: 999,
          name: 'Test Vendor',
          email: testEmail,
          contact_email: testEmail,
          phone: '01012345678',
          business_type: 'retail'
        });
        console.log('Test vendor created:', createResponse.data);
      } catch (createError) {
        console.log('Failed to create test vendor:', createError.response ? createError.response.data : createError.message);
      }
    }
    
    console.log('Vendor email test completed');
  } catch (error) {
    console.error('Error testing vendor email functionality:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVendorEmail();