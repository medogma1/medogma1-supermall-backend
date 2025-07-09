// auth-service/routes/profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// GET /auth/profile → جلب بيانات البروفايل
router.get('/profile', authenticateToken, profileController.getProfile);

// PUT /auth/profile → تعديل بيانات البروفايل
router.put('/profile', authenticateToken, profileController.updateProfile);

// POST /auth/change-password → تغيير كلمة المرور
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;