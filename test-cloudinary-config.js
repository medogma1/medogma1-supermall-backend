const config = require('./utils/config');
const cloudinary = require('cloudinary').v2;

console.log('Testing Cloudinary Configuration...');
console.log('Cloud Name:', config.cloudinary.cloudName);
console.log('API Key:', config.cloudinary.apiKey ? 'Set' : 'Not Set');
console.log('API Secret:', config.cloudinary.apiSecret ? 'Set' : 'Not Set');

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

// Test the configuration
cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connection successful:', result);
  })
  .catch(error => {
    console.error('❌ Cloudinary connection failed:', error.message);
  });