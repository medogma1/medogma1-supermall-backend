// product-service/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// مسارات الفئات الرئيسية
router.post('/', categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/featured', categoryController.getFeaturedCategories);
router.get('/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

// مسارات الفئات الفرعية
router.post('/:id/subcategories', categoryController.addSubCategory);
router.put('/:categoryId/subcategories/:subCategoryId', categoryController.updateSubCategory);
router.delete('/:categoryId/subcategories/:subCategoryId', categoryController.deleteSubCategory);

module.exports = router;