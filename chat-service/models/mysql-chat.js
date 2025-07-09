// chat-service/models/mysql-chat.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

// إنشاء محادثة جديدة
async function createConversation(userId, vendorId) {
  try {
    // التحقق من وجود محادثة سابقة
    const [existingConversations] = await pool.query(
      'SELECT * FROM chat_conversations WHERE user_id = ? AND vendor_id = ?',
      [userId, vendorId]
    );

    if (existingConversations.length > 0) {
      return { success: true, conversation: existingConversations[0] };
    }

    // إنشاء محادثة جديدة
    const [result] = await pool.query(
      'INSERT INTO chat_conversations (user_id, vendor_id) VALUES (?, ?)',
      [userId, vendorId]
    );

    const [newConversation] = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = ?',
      [result.insertId]
    );

    return { success: true, conversation: newConversation[0] };
  } catch (error) {
    console.error('خطأ في إنشاء محادثة:', error);
    return { success: false, error: error.message };
  }
}

// إرسال رسالة جديدة
async function sendMessage(conversationId, senderId, receiverId, messageText, attachments = null) {
  try {
    const [result] = await pool.query(
      'INSERT INTO chat_messages (conversation_id, sender_id, receiver_id, message_text, attachments) VALUES (?, ?, ?, ?, ?)',
      [conversationId, senderId, receiverId, messageText, attachments ? JSON.stringify(attachments) : null]
    );

    // تحديث آخر رسالة في المحادثة
    await pool.query(
      'UPDATE chat_conversations SET last_message_text = ?, last_message_time = NOW(), unread_count = unread_count + 1 WHERE id = ?',
      [messageText, conversationId]
    );

    const [newMessage] = await pool.query(
      'SELECT * FROM chat_messages WHERE id = ?',
      [result.insertId]
    );

    return { success: true, message: newMessage[0] };
  } catch (error) {
    console.error('خطأ في إرسال رسالة:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على رسائل محادثة
async function getConversationMessages(conversationId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;

    const [messages] = await pool.query(
      'SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [conversationId, limit, offset]
    );

    // تحويل حقل attachments من JSON string إلى كائن JavaScript
    return messages.map(message => ({
      ...message,
      attachments: message.attachments ? JSON.parse(message.attachments) : null
    }));
  } catch (error) {
    console.error('خطأ في الحصول على رسائل المحادثة:', error);
    return [];
  }
}

// الحصول على محادثات المستخدم
async function getUserConversations(userId) {
  try {
    const [conversations] = await pool.query(
      `SELECT c.*, 
        u.username as user_name, u.profile_image as user_image,
        v.store_name as vendor_name, v.store_logo_url as vendor_image
      FROM chat_conversations c
      JOIN users u ON c.user_id = u.id
      JOIN vendors v ON c.vendor_id = v.id
      WHERE c.user_id = ? OR c.vendor_id IN (SELECT id FROM vendors WHERE user_id = ?)
      ORDER BY c.last_message_time DESC`,
      [userId, userId]
    );

    return conversations;
  } catch (error) {
    console.error('خطأ في الحصول على محادثات المستخدم:', error);
    return [];
  }
}

// تحديث حالة قراءة الرسائل
async function markMessagesAsRead(conversationId, userId) {
  try {
    // تحديث حالة قراءة الرسائل
    await pool.query(
      'UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND receiver_id = ? AND is_read = FALSE',
      [conversationId, userId]
    );

    // إعادة تعيين عداد الرسائل غير المقروءة
    await pool.query(
      'UPDATE chat_conversations SET unread_count = 0 WHERE id = ?',
      [conversationId]
    );

    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث حالة قراءة الرسائل:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على عدد الرسائل غير المقروءة
async function getUnreadMessageCount(userId) {
  try {
    const [result] = await pool.query(
      `SELECT SUM(unread_count) as total_unread
      FROM chat_conversations
      WHERE user_id = ? OR vendor_id IN (SELECT id FROM vendors WHERE user_id = ?)`,
      [userId, userId]
    );

    return { success: true, count: result[0].total_unread || 0 };
  } catch (error) {
    console.error('خطأ في الحصول على عدد الرسائل غير المقروءة:', error);
    return { success: false, error: error.message };
  }
}

// إغلاق محادثة
async function closeConversation(conversationId, userId) {
  try {
    // التحقق من أن المستخدم مشارك في المحادثة
    const [conversation] = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = ? AND (user_id = ? OR vendor_id IN (SELECT id FROM vendors WHERE user_id = ?))',
      [conversationId, userId, userId]
    );

    if (!conversation || conversation.length === 0) {
      return { success: false, error: 'المحادثة غير موجودة أو غير مصرح لك بإغلاقها' };
    }

    // تحديث حالة المحادثة إلى غير نشطة
    await pool.query(
      'UPDATE chat_conversations SET is_active = FALSE WHERE id = ?',
      [conversationId]
    );

    return { success: true };
  } catch (error) {
    console.error('خطأ في إغلاق المحادثة:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على مشاركي المحادثة
async function getConversationParticipants(conversationId) {
  try {
    const [conversation] = await pool.query(
      'SELECT * FROM chat_conversations WHERE id = ?',
      [conversationId]
    );

    if (!conversation || conversation.length === 0) {
      return { success: false, error: 'المحادثة غير موجودة' };
    }

    // في نموذج MySQL الحالي، المشاركون هم فقط المستخدم والبائع
    const [user] = await pool.query(
      'SELECT id, username, email, profile_image FROM users WHERE id = ?',
      [conversation[0].user_id]
    );

    const [vendor] = await pool.query(
      'SELECT v.id, v.store_name, v.store_logo_url, u.email FROM vendors v JOIN users u ON v.user_id = u.id WHERE v.id = ?',
      [conversation[0].vendor_id]
    );

    const participants = [];
    
    if (user && user.length > 0) {
      participants.push({
        id: user[0].id,
        name: user[0].username,
        email: user[0].email,
        profile_image: user[0].profile_image,
        role: 'user'
      });
    }

    if (vendor && vendor.length > 0) {
      participants.push({
        id: vendor[0].id,
        name: vendor[0].store_name,
        email: vendor[0].email,
        profile_image: vendor[0].store_logo_url,
        role: 'vendor'
      });
    }

    return { success: true, participants };
  } catch (error) {
    console.error('خطأ في الحصول على مشاركي المحادثة:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  pool,
  createConversation,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  markMessagesAsRead,
  getUnreadMessageCount,
  closeConversation,
  getConversationParticipants
};