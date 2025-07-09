// notification-service/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// مسارات الإشعارات
router.post('/', notificationController.createNotification);
router.get('/user/:userId', notificationController.getUserNotifications);
router.get('/user/:userId/unread-count', notificationController.getUnreadCount);
router.get('/:id', notificationController.getNotificationById);
router.put('/:id/read', notificationController.markAsRead);
router.put('/user/:userId/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);
router.delete('/user/:userId', notificationController.deleteAllUserNotifications);
router.post('/bulk', notificationController.sendBulkNotifications);

module.exports = router;