// استخدام نموذج MySQL بدلاً من MongoDB
const supportModel = require('../models/mysql-support');
// ملاحظة: نحتاج إلى إنشاء نموذج MySQL للأسئلة الشائعة (FAQ) أو استخدام اتصال قاعدة البيانات مباشرة

// Ticket Controllers
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, orderId } = req.body;
    
    // إنشاء بيانات التذكرة باستخدام نموذج MySQL
    const ticketData = {
      user_id: req.user.id, // ملاحظة: في MySQL نستخدم id بدلاً من _id
      subject,
      description: message,
      priority: 'medium', // قيمة افتراضية
      category: 'general', // قيمة افتراضية
      // يمكن إضافة معرف الطلب لاحقًا إذا كان مطلوبًا
    };
    
    const result = await supportModel.createSupportTicket(ticketData);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    res.status(201).json(result.ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserTickets = async (req, res) => {
  try {
    // استخدام نموذج MySQL للحصول على تذاكر المستخدم
    const result = await supportModel.getUserSupportTickets(req.user.id);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    res.json(result.tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTicketDetails = async (req, res) => {
  try {
    // استخدام نموذج MySQL للحصول على تفاصيل التذكرة
    const result = await supportModel.getSupportTicketById(req.params.ticketId);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    if (!result.ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // التحقق من صلاحية المستخدم لعرض هذه التذكرة
    if (result.ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    
    res.json(result.ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addTicketReply = async (req, res) => {
  try {
    const { message } = req.body;
    const ticketId = req.params.ticketId;
    
    // أولاً، نتحقق من وجود التذكرة وصلاحية المستخدم
    const ticketResult = await supportModel.getSupportTicketById(ticketId);
    
    if (!ticketResult.success || !ticketResult.ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // التحقق من صلاحية المستخدم للرد على هذه التذكرة
    if (ticketResult.ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reply to this ticket' });
    }
    
    // إضافة الرد باستخدام نموذج MySQL
    const replyData = {
      ticket_id: ticketId,
      user_id: req.user.id,
      message: message
    };
    
    const result = await supportModel.addMessageToTicket(replyData);
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    // إذا كانت التذكرة مغلقة سابقًا، نقوم بتحديث حالتها إلى مفتوحة
    if (ticketResult.ticket.status === 'closed') {
      await supportModel.updateTicketStatus(ticketId, 'open');
    }
    
    // الحصول على التذكرة المحدثة
    const updatedTicket = await supportModel.getSupportTicketById(ticketId);
    res.json(updatedTicket.ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    
    // أولاً، نتحقق من وجود التذكرة وصلاحية المستخدم
    const ticketResult = await supportModel.getSupportTicketById(ticketId);
    
    if (!ticketResult.success || !ticketResult.ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    // التحقق من صلاحية المستخدم لإغلاق هذه التذكرة
    if (ticketResult.ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to close this ticket' });
    }
    
    // تحديث حالة التذكرة إلى مغلقة باستخدام نموذج MySQL
    const result = await supportModel.updateTicketStatus(ticketId, 'closed');
    
    if (!result.success) {
      return res.status(500).json({ message: result.error });
    }
    
    // الحصول على التذكرة المحدثة
    const updatedTicket = await supportModel.getSupportTicketById(ticketId);
    res.json(updatedTicket.ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FAQ Controllers
exports.getFAQs = async (req, res) => {
  try {
    // استخدام اتصال قاعدة البيانات مباشرة للحصول على الأسئلة الشائعة
    // نفترض أن لدينا جدول faqs في قاعدة البيانات MySQL
    const pool = supportModel.pool; // الحصول على اتصال قاعدة البيانات من نموذج الدعم
    
    const [faqs] = await pool.query(
      'SELECT * FROM faqs WHERE is_active = ? ORDER BY display_order ASC, category ASC',
      [true]
    );
    
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    // فقط المسؤول يمكنه إنشاء أسئلة شائعة
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create FAQs' });
    }
    
    const { question, answer, category, order } = req.body;
    const pool = supportModel.pool; // الحصول على اتصال قاعدة البيانات من نموذج الدعم
    
    // إدخال السؤال الشائع الجديد في قاعدة البيانات MySQL
    const [result] = await pool.query(
      'INSERT INTO faqs (question, answer, category, display_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [question, answer, category, order || 0, true]
    );
    
    // الحصول على السؤال الشائع المدخل حديثًا
    const [faq] = await pool.query('SELECT * FROM faqs WHERE id = ?', [result.insertId]);
    
    res.status(201).json(faq[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    // فقط المسؤول يمكنه تحديث الأسئلة الشائعة
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update FAQs' });
    }
    
    const faqId = req.params.faqId;
    const { question, answer, category, order, isActive } = req.body;
    const pool = supportModel.pool; // الحصول على اتصال قاعدة البيانات من نموذج الدعم
    
    // التحقق من وجود السؤال الشائع
    const [existingFaq] = await pool.query('SELECT * FROM faqs WHERE id = ?', [faqId]);
    
    if (existingFaq.length === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    // بناء استعلام التحديث ديناميكيًا
    let updateFields = [];
    let updateValues = [];
    
    if (question) {
      updateFields.push('question = ?');
      updateValues.push(question);
    }
    
    if (answer) {
      updateFields.push('answer = ?');
      updateValues.push(answer);
    }
    
    if (category) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    
    if (order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(order);
    }
    
    if (isActive !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(isActive);
    }
    
    // إضافة تاريخ التحديث
    updateFields.push('updated_at = NOW()');
    
    // إضافة معرف السؤال الشائع للاستعلام
    updateValues.push(faqId);
    
    // تنفيذ استعلام التحديث
    await pool.query(
      `UPDATE faqs SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // الحصول على السؤال الشائع المحدث
    const [updatedFaq] = await pool.query('SELECT * FROM faqs WHERE id = ?', [faqId]);
    
    res.json(updatedFaq[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    // فقط المسؤول يمكنه حذف الأسئلة الشائعة
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete FAQs' });
    }
    
    const faqId = req.params.faqId;
    const pool = supportModel.pool; // الحصول على اتصال قاعدة البيانات من نموذج الدعم
    
    // التحقق من وجود السؤال الشائع
    const [existingFaq] = await pool.query('SELECT * FROM faqs WHERE id = ?', [faqId]);
    
    if (existingFaq.length === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    
    // حذف السؤال الشائع من قاعدة البيانات
    await pool.query('DELETE FROM faqs WHERE id = ?', [faqId]);
    
    res.json({ message: 'FAQ deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};