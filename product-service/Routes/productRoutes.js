const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');

// مسارات المنتجات الأساسية
router.post('/', authenticate, productController.createProduct);
router.get('/', productController.getAllProducts);

// Admin routes
router.get('/admin/products', authenticate, productController.getAllProducts);
router.patch('/admin/products/:id/status', authenticate, productController.updateProductStatus);
router.post('/admin/products/:id/verify', authenticate, productController.verifyProduct);

// مسارات البحث
router.get('/search', productController.searchProducts);
router.get('/search/tags', productController.searchByTags);

// مسارات الإحصائيات
router.get('/stats', productController.getProductStats);

// مسارات البائع
router.get('/vendor/:vendorId', productController.getVendorProducts);

// مسارات المنتج المحددة
router.get('/:id', productController.getProductById);
router.get('/:id/tags', productController.getProductTags);
router.put('/:id', authenticate, productController.updateProduct);
router.put('/:id/rating', authenticate, productController.updateProductRating);
router.delete('/:id', authenticate, productController.deleteProduct);

// Admin routes
router.get('/', authenticate, productController.getAllProducts);
router.put('/:id/status', authenticate, productController.updateProductStatus);
router.post('/:id/verify', authenticate, productController.verifyProduct);

module.exports = router;
