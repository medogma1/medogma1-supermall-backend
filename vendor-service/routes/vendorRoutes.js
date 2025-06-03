const express = require('express');
const router = express.Router();
const { registerVendor, getVendors } = require('../controllers/vendorController');

// راوتات
router.post('/register', registerVendor);
router.get('/', getVendors);

module.exports = router;
