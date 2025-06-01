const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// راوت إنشاء منتج جديد
router.post('/products', createProduct);

// راوت جلب جميع المنتجات
router.get('/products', getAllProducts);

// راوت جلب منتج معين
router.get('/products/:id', getProductById);

// راوت تعديل منتج معين
router.put('/products/:id', updateProduct);

// راوت حذف منتج معين
router.delete('/products/:id', deleteProduct);

module.exports = router;
