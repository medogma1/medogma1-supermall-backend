const axios = require('axios');

const createVendor = async () => {
  try {
    const response = await axios.post('http://localhost:5005/vendors', {
      email: 'electronics@example.com',
      phone: '0123456789',
      businessType: 'electronics',
      userId: 1001
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjI1MTQwMDAwfQ.z2RMO8qbJe0W99d_tAR-vWdkVxs-TgQSUwkJH9vN38s'
      }
    });

    console.log('Vendor created successfully:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error creating vendor:');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
};

createVendor();