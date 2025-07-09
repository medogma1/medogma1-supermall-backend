// support-service/models/Ticket.js
const mysqlSupport = require('./mysql-support');

// واجهة التذاكر التي تستخدم MySQL
// تحافظ على نفس واجهة Mongoose للتوافق مع الكود الحالي
// تعريف واجهة التذاكر التي تستخدم وظائف MySQL

// تعريف كائن التذاكر الذي يستخدم وظائف MySQL
const Ticket = {
  // إنشاء تذكرة جديدة
  create: async function(ticketData) {
    // تحويل البيانات من صيغة Mongoose إلى صيغة MySQL
    const mysqlData = {
      user_id: ticketData.userId,
      subject: ticketData.subject,
      description: ticketData.message,
      priority: ticketData.priority || 'medium',
      category: ticketData.category || 'general'
    };
    
    return await mysqlSupport.createSupportTicket(mysqlData);
  },
  
  // الحصول على تذكرة بواسطة المعرف
  findById: async function(ticketId) {
    return await mysqlSupport.getSupportTicketById(ticketId);
  },
  
  // الحصول على تذاكر المستخدم
  find: async function(query = {}, options = {}) {
    const userId = query.userId;
    const page = options.page || 1;
    const limit = options.limit || 20;
    
    if (userId) {
      return await mysqlSupport.getUserSupportTickets(userId, page, limit);
    } else {
      return await mysqlSupport.getAllSupportTickets(page, limit, query.status);
    }
  },
  
  // إضافة رد إلى تذكرة
  addReply: async function(ticketId, replyData) {
    const messageData = {
      ticket_id: ticketId,
      user_id: replyData.userId,
      message: replyData.message,
      is_staff: replyData.isStaff || false
    };
    
    return await mysqlSupport.addMessageToTicket(messageData);
  },
  
  // تحديث حالة التذكرة
  updateStatus: async function(ticketId, status) {
    return await mysqlSupport.updateTicketStatus(ticketId, status);
  },
  
  // الحصول على إحصائيات التذاكر
  getStats: async function() {
    return await mysqlSupport.getSupportTicketStats();
  },
  
  // البحث في التذاكر
  search: async function(searchTerm, page = 1, limit = 20) {
    return await mysqlSupport.searchSupportTickets(searchTerm, page, limit);
  }
};

module.exports = Ticket;