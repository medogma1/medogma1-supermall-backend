// chat-service/models/Chat.js
// تم تحديث هذا الملف لاستخدام MySQL بدلاً من MongoDB

// استيراد نموذج الدردشة من MySQL
const chatModel = require('./mysql-chat');

// تصدير النماذج من ملف mysql-chat
module.exports = {
  // واجهة متوافقة مع الكود القديم
  Message: {
    create: async (messageData) => {
      return await chatModel.sendMessage(
        messageData.chatId,
        messageData.senderId,
        messageData.receiverId,
        messageData.content,
        messageData.type !== 'text' ? {
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          type: messageData.type
        } : null
      );
    },
    find: async (query) => {
      if (query.chatId) {
        return await chatModel.getConversationMessages(query.chatId);
      }
      return [];
    },
    findById: async (id) => {
      const [messages] = await chatModel.pool.query('SELECT * FROM chat_messages WHERE id = ?', [id]);
      return messages[0] || null;
    },
    updateOne: async (query, update) => {
      if (query.chatId && query.receiverId && update.$set && update.$set.isRead) {
        return await chatModel.markMessagesAsRead(query.chatId, query.receiverId);
      }
      return { success: false, error: 'عملية التحديث غير مدعومة' };
    }
  },
  
  ChatRoom: {
    create: async (roomData) => {
      return await chatModel.createConversation(roomData.userId, roomData.vendorId);
    },
    find: async (query) => {
      if (query.userId) {
        return await chatModel.getUserConversations(query.userId);
      }
      return [];
    },
    findById: async (id) => {
      const [conversations] = await chatModel.pool.query('SELECT * FROM chat_conversations WHERE id = ?', [id]);
      return conversations[0] || null;
    },
    updateOne: async (query, update) => {
      if (query._id && update.$set && update.$set.isActive === false) {
        // استخدام المعرف المناسب للمستخدم الذي يقوم بالإغلاق
        const userId = update.$set.closedBy || 0;
        return await chatModel.closeConversation(query._id, userId);
      }
      return { success: false, error: 'عملية التحديث غير مدعومة' };
    }
  },
  
  ChatParticipant: {
    find: async (query) => {
      if (query.chatId) {
        return (await chatModel.getConversationParticipants(query.chatId)).participants || [];
      }
      return [];
    },
    create: async () => {
      // المشاركون يتم إنشاؤهم تلقائيًا عند إنشاء المحادثة في MySQL
      return { success: true, message: 'المشاركون يتم إنشاؤهم تلقائيًا مع المحادثة' };
    }
  }
};