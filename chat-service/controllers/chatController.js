const chatModel = require('../models/mysql-chat');
// تم استبدال نماذج MongoDB بنماذج MySQL

exports.createChatRoom = async (req, res) => {
  try {
    const { vendorId } = req.body;
    const userId = req.user.id;

    if (!vendorId) {
      return res.status(400).json({ message: 'معرف البائع مطلوب' });
    }

    const result = await chatModel.createConversation(userId, vendorId);

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    res.status(201).json(result.conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await chatModel.getUserConversations(userId);
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // الحصول على رسائل المحادثة
    const messages = await chatModel.getConversationMessages(chatId, page, limit);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, messageText, attachments } = req.body;
    const senderId = req.user.id;

    // الحصول على معلومات المحادثة
    const [conversations] = await chatModel.pool.query(
      'SELECT * FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ message: 'المحادثة غير موجودة' });
    }

    // تحديد المستلم
    const receiverId = conversations[0].user_id == senderId
      ? conversations[0].vendor_id
      : conversations[0].user_id;

    // إرسال الرسالة
    const result = await chatModel.sendMessage(
      conversationId,
      senderId,
      receiverId,
      messageText,
      attachments
    );

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    res.status(201).json(result.message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const result = await chatModel.markMessagesAsRead(conversationId, userId);

    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }

    res.json({ message: 'تم تحديث حالة قراءة الرسائل' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.closeChatRoom = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const result = await chatModel.closeConversation(conversationId, userId);

    if (!result.success) {
      return res.status(403).json({ message: result.error });
    }

    res.json({ message: 'تم إغلاق المحادثة بنجاح' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getChatParticipants = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const result = await chatModel.getConversationParticipants(chatId);

    if (!result.success) {
      return res.status(404).json({ message: result.error });
    }

    res.json(result.participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addParticipant = async (req, res) => {
  try {
    // في نموذج MySQL الحالي، لا يمكن إضافة مشاركين إضافيين للمحادثة
    // المحادثة تكون دائمًا بين مستخدم وبائع فقط
    res.status(400).json({ 
      message: 'إضافة مشاركين إضافيين غير مدعومة في نموذج المحادثة الحالي',
      details: 'المحادثة في النظام الحالي تكون فقط بين مستخدم وبائع'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    // في نموذج MySQL الحالي، لا يمكن إزالة مشاركين من المحادثة
    // المحادثة تكون دائمًا بين مستخدم وبائع فقط
    res.status(400).json({ 
      message: 'إزالة مشاركين غير مدعومة في نموذج المحادثة الحالي',
      details: 'المحادثة في النظام الحالي تكون فقط بين مستخدم وبائع. يمكنك إغلاق المحادثة بدلاً من ذلك.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};