const { Vendor } = require('./models/Vendor');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {})
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      const vendor = await Vendor.findOne({ email: 'vendor@example.com' });
      console.log('Vendor found:', vendor);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));