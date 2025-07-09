// support-service/models/FAQ.js
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

// واجهة الأسئلة الشائعة التي تستخدم MySQL
// تحافظ على نفس واجهة Mongoose للتوافق مع الكود الحالي
// تعريف واجهة الأسئلة الشائعة التي تستخدم وظائف MySQL

// تعريف كائن الأسئلة الشائعة الذي يستخدم وظائف MySQL
const FAQ = {
  // إنشاء سؤال شائع جديد
  create: async function(faqData) {
    try {
      const { question, answer, category, order, isActive } = faqData;
      
      const [result] = await pool.query(
        'INSERT INTO faqs (question, answer, category, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
        [question, answer, category, order || 0, isActive === undefined ? true : isActive]
      );
      
      const [newFAQ] = await pool.query(
        'SELECT * FROM faqs WHERE id = ?',
        [result.insertId]
      );
      
      return { success: true, faq: newFAQ[0] };
    } catch (error) {
      console.error('خطأ في إنشاء سؤال شائع:', error);
      return { success: false, error: error.message };
    }
  },
  
  // الحصول على سؤال شائع بواسطة المعرف
  findById: async function(faqId) {
    try {
      const [faq] = await pool.query(
        'SELECT * FROM faqs WHERE id = ?',
        [faqId]
      );
      
      if (faq.length === 0) {
        return { success: false, error: 'السؤال الشائع غير موجود' };
      }
      
      return { success: true, faq: faq[0] };
    } catch (error) {
      console.error('خطأ في الحصول على السؤال الشائع:', error);
      return { success: false, error: error.message };
    }
  },
  
  // الحصول على الأسئلة الشائعة حسب الفئة
  find: async function(query = {}, options = {}) {
    try {
      const { category, isActive } = query;
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;
      
      let sqlQuery = 'SELECT * FROM faqs';
      let params = [];
      let conditions = [];
      
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      
      if (isActive !== undefined) {
        conditions.push('is_active = ?');
        params.push(isActive);
      }
      
      if (conditions.length > 0) {
        sqlQuery += ' WHERE ' + conditions.join(' AND ');
      }
      
      sqlQuery += ' ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      const [faqs] = await pool.query(sqlQuery, params);
      
      return { success: true, faqs };
    } catch (error) {
      console.error('خطأ في الحصول على الأسئلة الشائعة:', error);
      return { success: false, error: error.message };
    }
  },
  
  // تحديث سؤال شائع
  findByIdAndUpdate: async function(faqId, updateData) {
    try {
      const { question, answer, category, order, isActive } = updateData;
      
      // التحقق من وجود السؤال الشائع
      const [faq] = await pool.query(
        'SELECT * FROM faqs WHERE id = ?',
        [faqId]
      );
      
      if (faq.length === 0) {
        return { success: false, error: 'السؤال الشائع غير موجود' };
      }
      
      // تحديث السؤال الشائع
      let updateFields = [];
      let params = [];
      
      if (question !== undefined) {
        updateFields.push('question = ?');
        params.push(question);
      }
      
      if (answer !== undefined) {
        updateFields.push('answer = ?');
        params.push(answer);
      }
      
      if (category !== undefined) {
        updateFields.push('category = ?');
        params.push(category);
      }
      
      if (order !== undefined) {
        updateFields.push('display_order = ?');
        params.push(order);
      }
      
      if (isActive !== undefined) {
        updateFields.push('is_active = ?');
        params.push(isActive);
      }
      
      updateFields.push('updated_at = NOW()');
      
      if (updateFields.length === 0) {
        return { success: true, faq: faq[0] };
      }
      
      const updateQuery = `UPDATE faqs SET ${updateFields.join(', ')} WHERE id = ?`;
      params.push(faqId);
      
      await pool.query(updateQuery, params);
      
      const [updatedFAQ] = await pool.query(
        'SELECT * FROM faqs WHERE id = ?',
        [faqId]
      );
      
      return { success: true, faq: updatedFAQ[0] };
    } catch (error) {
      console.error('خطأ في تحديث السؤال الشائع:', error);
      return { success: false, error: error.message };
    }
  },
  
  // حذف سؤال شائع
  findByIdAndDelete: async function(faqId) {
    try {
      // التحقق من وجود السؤال الشائع
      const [faq] = await pool.query(
        'SELECT * FROM faqs WHERE id = ?',
        [faqId]
      );
      
      if (faq.length === 0) {
        return { success: false, error: 'السؤال الشائع غير موجود' };
      }
      
      // حذف السؤال الشائع
      await pool.query(
        'DELETE FROM faqs WHERE id = ?',
        [faqId]
      );
      
      return { success: true, faq: faq[0] };
    } catch (error) {
      console.error('خطأ في حذف السؤال الشائع:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = FAQ;