const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// إنشاء منتج جديد
router.post('/', createProduct);

// جلب جميع المنتجات
router.get('/', getAllProducts);

// جلب منتج معين
router.get('/:id', getProductById);

// تعديل منتج معين
router.put('/:id', updateProduct);

// حذف منتج معين
router.delete('/:id', deleteProduct);

module.exports = router;
