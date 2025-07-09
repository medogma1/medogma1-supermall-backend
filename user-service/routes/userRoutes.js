// user-service/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// مسارات المصادقة العامة
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.post('/forgotPassword', userController.forgotPassword);
router.patch('/resetPassword/:token', userController.resetPassword);
router.get('/verifyEmail/:token', userController.verifyEmail);

// مسارات المستخدم المصادق
router.use(userController.protect); // حماية جميع المسارات التالية

router.get('/me', userController.getMe);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.patch('/updatePassword', userController.updatePassword);
router.post('/resendVerificationEmail', userController.resendVerificationEmail);

// مسارات العناوين
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.patch('/addresses/:addressId', userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);
router.patch('/addresses/:addressId/setDefault', userController.setDefaultAddress);

// مسارات المسؤول
router.use(userController.restrictTo('admin')); // تقييد المسارات التالية للمسؤولين فقط

router.get('/', userController.getAllUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;