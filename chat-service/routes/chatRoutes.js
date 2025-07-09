const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// تطبيق middleware المصادقة على جميع المسارات
router.use(authMiddleware);

// مسارات المحادثات
router.post('/conversations', chatController.createChatRoom);
router.get('/conversations/user', chatController.getUserChatRooms);
router.post('/conversations/close/:conversationId', chatController.closeChatRoom);

// مسارات الرسائل
router.get('/messages/:chatId', chatController.getChatMessages);
router.post('/messages', chatController.sendMessage);
router.post('/messages/read/:conversationId', chatController.markMessagesAsRead);

// مسارات المشاركين
router.get('/participants/:chatId', chatController.getChatParticipants);
// مسارات إضافة وإزالة المشاركين غير مدعومة في نموذج MySQL الحالي
// لكن تم الاحتفاظ بها للتوافق مع الواجهة الأمامية
router.post('/participants/:chatId', chatController.addParticipant);
router.delete('/participants/:chatId/:userId', chatController.removeParticipant);

module.exports = router;