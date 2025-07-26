const axios = require('axios');

// First login to get admin token
async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:5001/auth/login',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: 'admin@supermall.com',
        password: 'xx100100'
      }
    });
    
    console.log('✅ Admin login successful');
    console.log('Login response:', response.data);
    return response.data.data?.token || response.data.token;
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Login Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
      console.log('❌ Error details:', error.code, error.errno);
    }
    return null;
  }
}

// Test toggle-status endpoint with valid token
async function testToggleStatusWithAuth(token, vendorId) {
  try {
    console.log(`\n🧪 Testing PATCH /admin/stores/${vendorId}/toggle-status with admin token...`);
    
    const response = await axios({
      method: 'PATCH',
      url: `http://localhost:5001/admin/stores/${vendorId}/toggle-status`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Toggle Status Success:', response.data);
    console.log('Status Code:', response.status);
    
    return true;
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Toggle Error:', error.response.data);
      console.log('Status Code:', error.response.status);
    } else {
      console.log('❌ Network Error:', error.message);
    }
    return false;
  }
}

// Get all vendors to find available IDs
async function getAllVendors(token) {
  try {
    console.log('\n📋 Getting all vendors...');
    
    const response = await axios({
      method: 'GET',
      url: 'http://localhost:5001/admin/stores',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Found vendors:', response.data.data?.length || 0);
    if (response.data.data && response.data.data.length > 0) {
      console.log('Available vendor IDs:', response.data.data.map(v => ({ id: v.id, name: v.name, isActive: v.isActive })));
      return response.data.data;
    }
    
    return [];
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Get All Vendors Error:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
    return [];
  }
}

// Get vendor info to see current status
async function getVendorInfo(token, vendorId) {
  try {
    console.log(`\n📋 Getting vendor ${vendorId} info...`);
    
    const response = await axios({
      method: 'GET',
      url: `http://localhost:5001/admin/stores/${vendorId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Vendor Info Response:', response.data);
    
    const vendor = response.data.data || response.data;
    console.log('✅ Vendor Details:', {
      id: vendor.id,
      name: vendor.name,
      isActive: vendor.isActive
    });
    
    return vendor;
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Get Vendor Error:', error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
    return null;
  }
}

// Run complete test
async function runCompleteTest() {
  console.log('🚀 Starting complete toggle-status test...');
  
  // Step 1: Login as admin
  const token = await loginAsAdmin();
  if (!token) {
    console.log('❌ Cannot proceed without admin token');
    return;
  }
  
  // Step 2: Get all vendors to find available IDs
  const vendors = await getAllVendors(token);
  if (vendors.length === 0) {
    console.log('❌ No vendors found to test');
    return;
  }
  
  const vendorId = vendors[0].id; // Test with first available vendor
  console.log(`\n🎯 Testing with vendor ID: ${vendorId}`);
  
  // Step 3: Get current vendor status
  const vendorBefore = await getVendorInfo(token, vendorId);
  if (!vendorBefore) {
    console.log('❌ Cannot get vendor info');
    return;
  }
  
  // Step 4: Toggle status
  const toggleSuccess = await testToggleStatusWithAuth(token, vendorId);
  if (!toggleSuccess) {
    console.log('❌ Toggle failed');
    return;
  }
  
  // Step 5: Get vendor status after toggle
  const vendorAfter = await getVendorInfo(token, vendorId);
  if (!vendorAfter) {
    console.log('❌ Cannot get vendor info after toggle');
    return;
  }
  
  // Step 6: Compare results
  console.log('\n📊 Toggle Results:');
  console.log(`Before: ${vendorBefore.isActive}`);
  console.log(`After: ${vendorAfter.isActive}`);
  
  if (vendorBefore.isActive !== vendorAfter.isActive) {
    console.log('✅ Status successfully toggled!');
  } else {
    console.log('❌ Status was not changed');
  }
  
  console.log('\n✅ Complete test finished!');
}

runCompleteTest();