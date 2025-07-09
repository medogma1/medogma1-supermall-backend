const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// مسارات البحث

// البحث العام عن المنتجات
router.get('/products', searchController.searchProducts);

// البحث عن المنتجات حسب الفئة
router.get('/category/:categoryId', searchController.searchProductsByCategory);

// البحث عن المنتجات حسب البائع
router.get('/vendor/:vendorId', searchController.searchProductsByVendor);

// تصفية المنتجات
router.get('/filter', searchController.filterProducts);

module.exports = router;