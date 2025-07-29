// user-service/routes/adminRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// مسارات الإدارة للمستخدمين (بدون middleware إضافي)
// لأن المصادقة والتحقق من الصلاحيات يتم في API Gateway

router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/customers', userController.getCustomers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

// مسارات إدارة العملاء الإضافية
router.post('/customers/:id/ban', userController.banCustomer);
router.post('/customers/:id/unban', userController.unbanCustomer);
router.post('/customers/:id/reset-password', userController.resetCustomerPassword);
router.post('/customers/:id/send-notification', userController.sendNotificationToCustomer);
router.get('/customers/:id/orders', userController.getCustomerOrders);

module.exports = router;