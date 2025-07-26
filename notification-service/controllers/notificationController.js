// notification-service/controllers/notificationController.js
const notificationModel = require('../models/mysql-notification');

// إنشاء إشعار جديد
exports.createNotification = async (req, res) => {
  try {
    const { recipient, type, title, body, data, image, priority, channel, scheduledAt, expiresAt } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!recipient || !type || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير المستلم ونوع الإشعار والعنوان والمحتوى'
      });
    }
    
    // إنشاء إشعار جديد باستخدام نموذج MySQL
    const notificationData = {
      user_id: recipient,
      title,
      message: body,
      type: type,
      reference_id: data?.referenceId || null
    };
    
    const result = await notificationModel.createNotification(notificationData);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء إنشاء الإشعار',
        error: result.error
      });
    }
    
    // هنا يمكن إضافة منطق لإرسال الإشعار عبر القناة المحددة
    // مثل إرسال إشعار بالتطبيق أو بريد إلكتروني أو رسالة نصية
    
    res.status(201).json({
      success: true,
      data: result.notification
    });
  } catch (error) {
    console.error('خطأ في إنشاء إشعار جديد:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الإشعار',
      error: error.message
    });
  }
};

// الحصول على جميع الإشعارات لمستخدم معين
exports.getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // استخدام نموذج MySQL للحصول على إشعارات المستخدم
    const result = await notificationModel.getUserNotifications(userId, parseInt(page), parseInt(limit));
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب الإشعارات',
        error: result.error
      });
    }
    
    // ملاحظة: نموذج MySQL لا يدعم حاليًا الفلترة حسب الحالة أو النوع
    // يمكن تحسين ذلك في المستقبل بإضافة معلمات إضافية إلى دالة getUserNotifications
    
    res.status(200).json({
      success: true,
      count: result.notifications.length,
      data: result.notifications,
      currentPage: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('خطأ في الحصول على إشعارات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإشعارات',
      error: error.message
    });
  }
};

// الحصول على إشعار واحد بواسطة المعرف
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ملاحظة: نموذج MySQL الحالي لا يحتوي على دالة للحصول على إشعار واحد بواسطة المعرف
    // سنقوم بتنفيذ هذه الوظيفة مباشرة هنا
    
    // الحصول على الاتصال بقاعدة البيانات من النموذج
    const pool = notificationModel.pool;
    
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الإشعار'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notifications[0]
    });
  } catch (error) {
    console.error('خطأ في الحصول على الإشعار:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإشعار',
      error: error.message
    });
  }
};

// تحديث حالة القراءة لإشعار واحد
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // استخدام نموذج MySQL لتحديث حالة قراءة الإشعار
    const result = await notificationModel.markNotificationAsRead(id);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تحديث حالة القراءة',
        error: result.error
      });
    }
    
    // الحصول على الإشعار المحدث
    const pool = notificationModel.pool;
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الإشعار'
      });
    }
    
    res.status(200).json({
      success: true,
      data: notifications[0]
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة القراءة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة القراءة',
      error: error.message
    });
  }
};

// تحديث حالة القراءة لجميع إشعارات المستخدم
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // استخدام نموذج MySQL لتحديث حالة قراءة جميع إشعارات المستخدم
    const result = await notificationModel.markAllNotificationsAsRead(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تحديث حالة القراءة',
        error: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث جميع الإشعارات كمقروءة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في تحديث حالة القراءة لجميع الإشعارات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة القراءة',
      error: error.message
    });
  }
};

// حذف إشعار
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    // التحقق من وجود الإشعار قبل الحذف
    const pool = notificationModel.pool;
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );
    
    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الإشعار'
      });
    }
    
    // استخدام نموذج MySQL لحذف الإشعار
    const result = await notificationModel.deleteNotification(id);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء حذف الإشعار',
        error: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم حذف الإشعار بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الإشعار',
      error: error.message
    });
  }
};

// حذف جميع إشعارات المستخدم
exports.deleteAllUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // استخدام اتصال قاعدة البيانات مباشرة لحذف جميع إشعارات المستخدم
    // لأن نموذج MySQL الحالي لا يحتوي على دالة لحذف جميع إشعارات المستخدم
    const pool = notificationModel.pool;
    
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE user_id = ?',
      [userId]
    );
    
    res.status(200).json({
      success: true,
      message: `تم حذف ${result.affectedRows} إشعار`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('خطأ في حذف جميع إشعارات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الإشعارات',
      error: error.message
    });
  }
};

// إرسال إشعار إلى مجموعة من المستخدمين
exports.sendBulkNotifications = async (req, res) => {
  try {
    const { recipients, type, title, body, data, image, priority, channel } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !type || !title || !body) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير قائمة المستلمين ونوع الإشعار والعنوان والمحتوى'
      });
    }
    
    // استخدام اتصال قاعدة البيانات مباشرة لإدخال الإشعارات المتعددة
    const pool = notificationModel.pool;
    
    // إنشاء مصفوفة من الإشعارات وإدخالها واحدًا تلو الآخر
    const createdNotifications = [];
    
    for (const recipient of recipients) {
      const notificationData = {
        user_id: recipient,
        title,
        message: body,
        notification_type: type,
        reference_id: data?.referenceId || null,
        reference_type: data?.referenceType || null
      };
      
      const result = await notificationModel.createNotification(notificationData);
      
      if (result.success) {
        createdNotifications.push(result.notification);
      }
    }
    
    // هنا يمكن إضافة منطق لإرسال الإشعارات عبر القناة المحددة
    
    res.status(201).json({
      success: true,
      message: `تم إنشاء ${createdNotifications.length} إشعار بنجاح`,
      count: createdNotifications.length,
      data: createdNotifications
    });
  } catch (error) {
    console.error('خطأ في إرسال إشعارات متعددة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال الإشعارات',
      error: error.message
    });
  }
};

// الحصول على عدد الإشعارات غير المقروءة للمستخدم
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // استخدام نموذج MySQL للحصول على عدد الإشعارات غير المقروءة
    const result = await notificationModel.getUnreadNotificationCount(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء جلب عدد الإشعارات',
        error: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      count: result.count
    });
  } catch (error) {
    console.error('خطأ في الحصول على عدد الإشعارات غير المقروءة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب عدد الإشعارات',
      error: error.message
    });
  }
};