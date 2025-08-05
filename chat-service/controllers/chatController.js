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

// دالة منفصلة لإنشاء المحادثات (متوافقة مع الاختبارات)
exports.createConversation = async (req, res) => {
  try {
    const { vendorId, receiverId, title, type } = req.body;
    const userId = req.user.id || req.user.userId;

    // استخدام vendorId أو receiverId
    let targetVendorId = vendorId || receiverId;
    
    // إذا لم يتم تحديد معرف البائع أو المستقبل، فهذه محادثة دعم فني
    if (!targetVendorId) {
      // استخدام معرف افتراضي للدعم الفني أو null للمحادثات العامة
      targetVendorId = 'support'; // يمكن تغييره إلى معرف حقيقي لوكيل الدعم
    }

    const result = await chatModel.createConversation(userId, targetVendorId, {
      title: title || 'محادثة جديدة',
      type: type || 'customerSupport'
    });

    if (!result.success) {
      return res.status(500).json({ 
        success: false,
        message: result.error,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المحادثة بنجاح',
      data: result.conversation,
      conversationId: result.conversation.id
    });
  } catch (error) {
    console.error('خطأ في إنشاء المحادثة:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء المحادثة',
      error: error.message
    });
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

// جلب جميع المحادثات للمدير
exports.getAllConversationsForAdmin = async (req, res) => {
  try {
    // التحقق من أن المستخدم مدير
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذه البيانات' });
    }

    const conversations = await chatModel.getAllConversationsForAdmin();
    
    res.json(conversations);
  } catch (error) {
    console.error('خطأ في جلب المحادثات للمدير:', error);
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

    // التحقق من المعاملات المطلوبة
    if (!conversationId) {
      return res.status(400).json({ message: 'معرف المحادثة مطلوب' });
    }
    if (!messageText || messageText.trim() === '') {
      return res.status(400).json({ message: 'نص الرسالة مطلوب' });
    }
    if (!senderId) {
      return res.status(400).json({ message: 'معرف المرسل مطلوب' });
    }

    // الحصول على معلومات المحادثة
    const [conversations] = await chatModel.pool.execute(
      'SELECT * FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ message: 'المحادثة غير موجودة' });
    }

    // تحديد المستلم
    let receiverId = conversations[0].user_id == senderId
      ? conversations[0].vendor_id
      : conversations[0].user_id;

    // التأكد من أن receiverId ليس undefined أو null
    if (!receiverId) {
      return res.status(400).json({ message: 'لا يمكن تحديد المستلم' });
    }

    // التحقق من أن receiverId هو رقم صحيح وموجود في جدول users
    let receiverIdInt = parseInt(receiverId);
    if (isNaN(receiverIdInt)) {
      // إذا كان vendor_id نص مثل 'support'، استخدم المستخدم الإداري كمستلم
      if (receiverId === 'support') {
        // البحث عن مستخدم إداري للدعم الفني
        const [adminUsers] = await chatModel.pool.execute(
          'SELECT id FROM users WHERE role = ? LIMIT 1',
          ['admin']
        );
        
        if (adminUsers && adminUsers.length > 0) {
          receiverIdInt = adminUsers[0].id;
        } else {
          return res.status(400).json({ 
            message: 'لا يوجد مستخدم دعم فني متاح',
            details: 'لم يتم العثور على مستخدم إداري للدعم الفني'
          });
        }
      } else {
        return res.status(400).json({ 
          message: 'نوع المحادثة غير مدعوم',
          details: 'معرف المستلم غير صحيح'
        });
      }
    }

    // التحقق من وجود المستلم في جدول users
    const [receiverCheck] = await chatModel.pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [receiverIdInt]
    );

    if (!receiverCheck || receiverCheck.length === 0) {
      return res.status(400).json({ 
        message: 'المستلم غير موجود',
        details: 'معرف المستلم غير صحيح أو المستخدم محذوف'
      });
    }

    receiverId = receiverIdInt;

    // إرسال الرسالة
    const result = await chatModel.sendMessage(
      conversationId,
      senderId,
      receiverId,
      messageText.trim(),
      attachments || null
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