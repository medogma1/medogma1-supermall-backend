// product-service/routes/favoriteRoutes.js
const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// مسار للحصول على جميع العناصر المفضلة للمستخدم
router.get('/user/:userId', favoriteController.getUserFavorites);

// مسار للتحقق مما إذا كان العنصر مفضلاً للمستخدم
router.get('/check', favoriteController.checkIsFavorite);

// مسار لإضافة عنصر إلى المفضلة
router.post('/', favoriteController.addToFavorites);

// مسار لتبديل حالة العنصر في المفضلة (إضافة أو إزالة)
router.post('/toggle', favoriteController.toggleFavorite);

// مسار لتحديث ملاحظات العنصر المفضل
router.patch('/:id/notes', favoriteController.updateFavoriteNotes);

// مسار لإزالة عنصر من المفضلة
router.delete('/:id', favoriteController.removeFromFavorites);

module.exports = router;