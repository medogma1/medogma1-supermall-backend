// support-service/models/mysql-support.js
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

// إنشاء تذكرة دعم جديدة
async function createSupportTicket(ticketData) {
  try {
    const { user_id, subject, description, priority, category } = ticketData;
    
    const [result] = await pool.query(
      'INSERT INTO support_tickets (user_id, subject, description, priority, category, status) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, subject, description, priority, category, 'open']
    );
    
    const [newTicket] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ?',
      [result.insertId]
    );
    
    return { success: true, ticket: newTicket[0] };
  } catch (error) {
    console.error('خطأ في إنشاء تذكرة دعم:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على تذكرة دعم بواسطة المعرف
async function getSupportTicketById(ticketId) {
  try {
    const [ticket] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (ticket.length === 0) {
      return { success: false, error: 'تذكرة الدعم غير موجودة' };
    }
    
    const [messages] = await pool.query(
      'SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC',
      [ticketId]
    );
    
    return { 
      success: true, 
      ticket: {
        ...ticket[0],
        messages: messages
      }
    };
  } catch (error) {
    console.error('خطأ في الحصول على تذكرة الدعم:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على تذاكر الدعم للمستخدم
async function getUserSupportTickets(userId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    
    const [tickets] = await pool.query(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    
    return { success: true, tickets };
  } catch (error) {
    console.error('خطأ في الحصول على تذاكر الدعم للمستخدم:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على جميع تذاكر الدعم (للمسؤولين)
async function getAllSupportTickets(page = 1, limit = 20, status = null) {
  try {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM support_tickets';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [tickets] = await pool.query(query, params);
    
    return { success: true, tickets };
  } catch (error) {
    console.error('خطأ في الحصول على جميع تذاكر الدعم:', error);
    return { success: false, error: error.message };
  }
}

// إضافة رسالة إلى تذكرة دعم
async function addMessageToTicket(messageData) {
  try {
    const { ticket_id, user_id, message, is_staff } = messageData;
    
    // التحقق من وجود التذكرة
    const [ticket] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticket_id]
    );
    
    if (ticket.length === 0) {
      return { success: false, error: 'تذكرة الدعم غير موجودة' };
    }
    
    // إضافة الرسالة
    const [result] = await pool.query(
      'INSERT INTO support_ticket_messages (ticket_id, user_id, message, is_staff) VALUES (?, ?, ?, ?)',
      [ticket_id, user_id, message, is_staff || false]
    );
    
    // تحديث حالة التذكرة إذا كانت الرسالة من الموظف
    if (is_staff) {
      await pool.query(
        'UPDATE support_tickets SET status = ? WHERE id = ?',
        ['in-progress', ticket_id]
      );
    }
    
    const [newMessage] = await pool.query(
      'SELECT * FROM support_ticket_messages WHERE id = ?',
      [result.insertId]
    );
    
    return { success: true, message: newMessage[0] };
  } catch (error) {
    console.error('خطأ في إضافة رسالة إلى تذكرة الدعم:', error);
    return { success: false, error: error.message };
  }
}

// تحديث حالة تذكرة الدعم
async function updateTicketStatus(ticketId, status) {
  try {
    // التحقق من وجود التذكرة
    const [ticket] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    if (ticket.length === 0) {
      return { success: false, error: 'تذكرة الدعم غير موجودة' };
    }
    
    // تحديث الحالة
    await pool.query(
      'UPDATE support_tickets SET status = ? WHERE id = ?',
      [status, ticketId]
    );
    
    const [updatedTicket] = await pool.query(
      'SELECT * FROM support_tickets WHERE id = ?',
      [ticketId]
    );
    
    return { success: true, ticket: updatedTicket[0] };
  } catch (error) {
    console.error('خطأ في تحديث حالة تذكرة الدعم:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على إحصائيات تذاكر الدعم
async function getSupportTicketStats() {
  try {
    const [openTickets] = await pool.query(
      'SELECT COUNT(*) as count FROM support_tickets WHERE status = ?',
      ['open']
    );
    
    const [inProgressTickets] = await pool.query(
      'SELECT COUNT(*) as count FROM support_tickets WHERE status = ?',
      ['in-progress']
    );
    
    const [closedTickets] = await pool.query(
      'SELECT COUNT(*) as count FROM support_tickets WHERE status = ?',
      ['closed']
    );
    
    const [totalTickets] = await pool.query(
      'SELECT COUNT(*) as count FROM support_tickets'
    );
    
    return { 
      success: true, 
      stats: {
        open: openTickets[0].count,
        inProgress: inProgressTickets[0].count,
        closed: closedTickets[0].count,
        total: totalTickets[0].count
      }
    };
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات تذاكر الدعم:', error);
    return { success: false, error: error.message };
  }
}

// البحث في تذاكر الدعم
async function searchSupportTickets(searchTerm, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    const searchPattern = `%${searchTerm}%`;
    
    const [tickets] = await pool.query(
      `SELECT * FROM support_tickets 
       WHERE subject LIKE ? OR description LIKE ? 
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, limit, offset]
    );
    
    return { success: true, tickets };
  } catch (error) {
    console.error('خطأ في البحث في تذاكر الدعم:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createSupportTicket,
  getSupportTicketById,
  getUserSupportTickets,
  getAllSupportTickets,
  addMessageToTicket,
  updateTicketStatus,
  getSupportTicketStats,
  searchSupportTickets
};