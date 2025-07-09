// notification-service/models/mysql-notification.js
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

// إنشاء إشعار جديد
async function createNotification(notificationData) {
  try {
    const { user_id, title, message, notification_type, reference_id, reference_type } = notificationData;
    
    const [result] = await pool.query(
      'INSERT INTO notifications (user_id, title, message, notification_type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, title, message, notification_type, reference_id || null, reference_type || null]
    );
    
    const [newNotification] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [result.insertId]
    );
    
    return { success: true, notification: newNotification[0] };
  } catch (error) {
    console.error('خطأ في إنشاء إشعار:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على إشعارات المستخدم
async function getUserNotifications(userId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );
    
    return { success: true, notifications };
  } catch (error) {
    console.error('خطأ في الحصول على إشعارات المستخدم:', error);
    return { success: false, error: error.message };
  }
}

// تحديث حالة قراءة الإشعار
async function markNotificationAsRead(notificationId) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ?',
      [notificationId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث حالة قراءة الإشعار:', error);
    return { success: false, error: error.message };
  }
}

// تحديث حالة قراءة جميع إشعارات المستخدم
async function markAllNotificationsAsRead(userId) {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في تحديث حالة قراءة جميع الإشعارات:', error);
    return { success: false, error: error.message };
  }
}

// حذف إشعار
async function deleteNotification(notificationId) {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    return { success: true };
  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على عدد الإشعارات غير المقروءة
async function getUnreadNotificationCount(userId) {
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    
    return { success: true, count: result[0].count };
  } catch (error) {
    console.error('خطأ في الحصول على عدد الإشعارات غير المقروءة:', error);
    return { success: false, error: error.message };
  }
}

// الحصول على إعدادات الإشعارات للمستخدم
async function getNotificationSettings(userId) {
  try {
    const [settings] = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = ?',
      [userId]
    );
    
    if (settings.length === 0) {
      // إنشاء إعدادات افتراضية إذا لم تكن موجودة
      const [result] = await pool.query(
        'INSERT INTO notification_settings (user_id) VALUES (?)',
        [userId]
      );
      
      const [newSettings] = await pool.query(
        'SELECT * FROM notification_settings WHERE id = ?',
        [result.insertId]
      );
      
      return { success: true, settings: newSettings[0] };
    }
    
    return { success: true, settings: settings[0] };
  } catch (error) {
    console.error('خطأ في الحصول على إعدادات الإشعارات:', error);
    return { success: false, error: error.message };
  }
}

// تحديث إعدادات الإشعارات
async function updateNotificationSettings(userId, settingsData) {
  try {
    const { email_notifications, push_notifications, sms_notifications, marketing_notifications, order_notifications, chat_notifications } = settingsData;
    
    // التحقق من وجود إعدادات
    const [existingSettings] = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = ?',
      [userId]
    );
    
    if (existingSettings.length === 0) {
      // إنشاء إعدادات جديدة
      await pool.query(
        `INSERT INTO notification_settings 
        (user_id, email_notifications, push_notifications, sms_notifications, marketing_notifications, order_notifications, chat_notifications) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, email_notifications, push_notifications, sms_notifications, marketing_notifications, order_notifications, chat_notifications]
      );
    } else {
      // تحديث الإعدادات الموجودة
      await pool.query(
        `UPDATE notification_settings SET 
        email_notifications = ?, 
        push_notifications = ?, 
        sms_notifications = ?, 
        marketing_notifications = ?, 
        order_notifications = ?, 
        chat_notifications = ? 
        WHERE user_id = ?`,
        [email_notifications, push_notifications, sms_notifications, marketing_notifications, order_notifications, chat_notifications, userId]
      );
    }
    
    const [updatedSettings] = await pool.query(
      'SELECT * FROM notification_settings WHERE user_id = ?',
      [userId]
    );
    
    return { success: true, settings: updatedSettings[0] };
  } catch (error) {
    console.error('خطأ في تحديث إعدادات الإشعارات:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  getNotificationSettings,
  updateNotificationSettings
};