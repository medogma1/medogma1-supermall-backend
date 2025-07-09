/**
 * وسيط للتحقق من ملكية البائع للخدمات
 * يستخدم للتأكد من أن البائع يمكنه فقط تعديل أو حذف الخدمات التي يملكها
 */

const { Service } = require('../models/Service');

module.exports = async (req, res, next) => {
  try {
    // التحقق من وجود معلومات المستخدم (يجب أن يكون قد مر عبر وسيط المصادقة أولاً)
    if (!req.user) {
      return res.status(401).json({ message: 'غير مصرح - يرجى تسجيل الدخول أولاً' });
    }

    // إذا كان المستخدم مشرفًا، السماح له بالوصول إلى جميع الخدمات
    if (req.user.role === 'admin') {
      return next();
    }

    // التحقق من أن المستخدم هو بائع
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'غير مسموح - يجب أن تكون بائعًا للوصول إلى هذا المورد' });
    }

    // الحصول على معرف الخدمة من المعلمات
    const serviceId = req.params.id || req.params.serviceId;
    
    if (!serviceId) {
      return res.status(400).json({ message: 'معرف الخدمة مطلوب' });
    }

    // البحث عن الخدمة في قاعدة البيانات
    const service = await Service.findByPk(serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'الخدمة غير موجودة' });
    }

    // التحقق من أن البائع هو مالك الخدمة
    if (service.vendor_id !== req.user.vendorId) {
      return res.status(403).json({ message: 'غير مسموح - لا يمكنك الوصول إلى خدمة لا تملكها' });
    }

    // إضافة الخدمة إلى الطلب للاستخدام في المراحل اللاحقة
    req.service = service;
    
    // السماح بالمتابعة إذا كان البائع هو المالك
    next();
  } catch (error) {
    return res.status(500).json({ message: 'خطأ في التحقق من ملكية الخدمة', error: error.message });
  }
};