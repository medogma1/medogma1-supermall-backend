const axios = require('axios');

// Test customer registration via API Gateway
async function testCustomerRegistration() {
  console.log('🔍 Testing customer registration via API Gateway...');
  
  const uniqueId = Date.now();
  const testUser = {
    name: 'Ahmed Mohamed',
    firstName: 'Ahmed',
    lastName: 'Mohamed',
    email: `customer${uniqueId}@example.com`,
    password: 'StrongPass123!@#',
    confirmPassword: 'StrongPass123!@#',
  
    role: 'customer',
   
  };

  try {
    console.log('Sending customer registration request...');
    const response = await axios.post('http://localhost:5001/auth/register', testUser, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Customer registration successful via API Gateway!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Customer registration failed via API Gateway:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Test vendor registration via API Gateway
async function testVendorRegistration() {
  console.log('\n🏪 Testing vendor registration via API Gateway...');
  
  const uniqueId = Date.now() + 1000; // Different ID to avoid conflicts
  const testVendor = {
    name: 'محمد أحمد التاجر',
    firstName: 'محمد',
    lastName: 'أحمد التاجر',
    email: `vendor${uniqueId}@example.com`,
    password: 'VendorPass123!@#',
    confirmPassword: 'VendorPass123!@#',
    phoneNumber: `0109876${String(uniqueId).slice(-4)}`,
    dateOfBirth: '1985-05-15',
    gender: 'male',
    role: 'vendor',
    country: 'مصر',
    governorate: 'الجيزة',
    nationalId: `30123456789012`,
    workshopAddress: 'ورشة التاجر - شارع الهرم - الجيزة',
    businessName: 'متجر محمد أحمد للإلكترونيات',
    businessType: 'إلكترونيات',
    taxNumber: `TAX${uniqueId}`,
    commercialRegister: `CR${uniqueId}`
  };
  
  try {
    console.log('Sending vendor registration request...');
    const response = await axios.post('http://localhost:5001/auth/register', testVendor, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Vendor registration successful via API Gateway!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Vendor registration failed via API Gateway:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('🚀 Starting registration tests...\n');
  
  // Test customer registration
  const customerSuccess = await testCustomerRegistration();
  
  // Test vendor registration
  const vendorSuccess = await testVendorRegistration();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Customer Registration: ${customerSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Vendor Registration: ${vendorSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (customerSuccess && vendorSuccess) {
    console.log('\n🎉 All registration tests passed!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the logs above.');
  }
}

// Run the tests
runTests().catch(console.error);