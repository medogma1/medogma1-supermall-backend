// notification-service/models/Notification.js
const mysqlNotification = require('./mysql-notification');

// واجهة الإشعارات التي تستخدم MySQL
// تحافظ على نفس واجهة Mongoose للتوافق مع الكود الحالي
// تعريف واجهة الإشعارات التي تستخدم وظائف MySQL

// تعريف كائن الإشعارات الذي يستخدم وظائف MySQL
const Notification = {
  // إنشاء إشعار جديد
  create: async function(notificationData) {
    // تحويل البيانات من صيغة Mongoose إلى صيغة MySQL
    const mysqlData = {
      user_id: notificationData.recipient,
      title: notificationData.title,
      message: notificationData.body,
      notification_type: notificationData.type,
      reference_id: notificationData.data?.referenceId || null,
      reference_type: notificationData.data?.referenceType || null
    };
    
    return await mysqlNotification.createNotification(mysqlData);
  },
  
  // الحصول على إشعارات المستخدم
  find: async function(query = {}, options = {}) {
    const userId = query.recipient;
    const page = options.page || 1;
    const limit = options.limit || 20;
    
    return await mysqlNotification.getUserNotifications(userId, page, limit);
  },
  
  // طرق مساعدة
  markAsRead: async function(notificationId) {
    return await mysqlNotification.markNotificationAsRead(notificationId);
  },
  
  // طرق ثابتة
  getUnreadByUser: async function(userId) {
    return await mysqlNotification.getUserNotifications(userId, 1, 100);
  },
  
  markAllAsRead: async function(userId) {
    return await mysqlNotification.markAllNotificationsAsRead(userId);
  },
  
  // الحصول على عدد الإشعارات غير المقروءة
  getUnreadCount: async function(userId) {
    return await mysqlNotification.getUnreadNotificationCount(userId);
  },
  
  // حذف إشعار
  deleteOne: async function(query = {}) {
    const notificationId = query._id || query.id;
    return await mysqlNotification.deleteNotification(notificationId);
  }
};

module.exports = Notification;