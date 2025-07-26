/**
 * Role-based authorization middleware
 * SuperMall Backend - Security Enhancement
 */

const roleMiddleware = {
  /**
   * يتطلب صلاحيات المدير
   */
  requireAdmin: (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'غير مصرح - المصادقة مطلوبة'
        });
      }

      if (req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'fail',
          message: 'غير مصرح - صلاحيات المدير مطلوبة',
          requiredRole: 'admin',
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('خطأ في فحص صلاحيات المدير:', error);
      return res.status(500).json({
        status: 'error',
        message: 'خطأ داخلي في فحص الصلاحيات'
      });
    }
  },

  /**
   * يتطلب صلاحيات البائع أو المدير
   */
  requireVendorOrAdmin: (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'غير مصرح - المصادقة مطلوبة'
        });
      }

      const allowedRoles = ['vendor', 'admin'];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          status: 'fail',
          message: 'غير مصرح - صلاحيات البائع أو المدير مطلوبة',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      console.error('خطأ في فحص صلاحيات البائع/المدير:', error);
      return res.status(500).json({
        status: 'error',
        message: 'خطأ داخلي في فحص الصلاحيات'
      });
    }
  },

  /**
   * يتطلب أن يكون البائع يصل لبياناته الخاصة أو مدير
   */
  requireVendorOwnershipOrAdmin: (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'fail',
          message: 'غير مصرح - المصادقة مطلوبة'
        });
      }

      const vendorId = parseInt(req.params.vendorId || req.params.id);
      
      // المدير يمكنه الوصول لأي بائع
      if (req.user.role === 'admin') {
        return next();
      }

      // البائع يمكنه الوصول لبياناته فقط
      if (req.user.role === 'vendor') {
        if (req.user.vendorId === vendorId || req.user.id === vendorId) {
          return next();
        } else {
          return res.status(403).json({
            status: 'fail',
            message: 'غير مصرح - يمكنك الوصول لبياناتك فقط',
            requestedVendorId: vendorId,
            userVendorId: req.user.vendorId || req.user.id
          });
        }
      }

      // أي دور آخر غير مصرح
      return res.status(403).json({
        status: 'fail',
        message: 'غير مصرح - صلاحيات البائع أو المدير مطلوبة',
        userRole: req.user.role
      });

    } catch (error) {
      console.error('خطأ في فحص ملكية البائع:', error);
      return res.status(500).json({
        status: 'error',
        message: 'خطأ داخلي في فحص الصلاحيات'
      });
    }
  },

  /**
   * يسمح للجميع (للـ endpoints العامة)
   */
  allowAll: (req, res, next) => {
    next();
  }
};

module.exports = roleMiddleware;