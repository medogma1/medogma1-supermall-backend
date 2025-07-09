// vendor-service/models/storeSetting.js
const mongoose = require('mongoose');

const storeSettingSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    unique: true
  },
  storeName: {
    type: String,
    required: true
  },
  storeDescription: {
    type: String,
    required: true
  },
  storeLogoUrl: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  storeAddress: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('StoreSetting', storeSettingSchema);