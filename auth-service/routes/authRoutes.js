const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Auth service is running',
    timestamp: new Date().toISOString()
  });
});

// المسارات العامة
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login/vendor', authController.login); // إضافة مسار تسجيل دخول البائع
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/governorates', authController.getGovernorates);

// المسارات المحمية
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, authController.updateProfile);
router.post('/change-password', protect, authController.changePassword);

module.exports = router;