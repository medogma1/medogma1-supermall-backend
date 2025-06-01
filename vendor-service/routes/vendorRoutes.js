const express = require('express');
const router = express.Router();
const { registerVendor, getAllVendors, getVendorById, updateVendor, deleteVendor } = require('../controllers/vendorController');

// راوتات المتاجر
router.post('/vendors/register', registerVendor);
router.get('/vendors', getAllVendors);
router.get('/vendors/:id', getVendorById);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

module.exports = router;
