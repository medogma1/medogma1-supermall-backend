// user-service/routes/adminRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// مسارات الإدارة للمستخدمين (بدون middleware إضافي)
// لأن المصادقة والتحقق من الصلاحيات يتم في API Gateway

router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;