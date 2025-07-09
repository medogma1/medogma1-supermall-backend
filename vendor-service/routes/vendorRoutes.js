// vendor-service/routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const { Vendor } = require('../models/Vendor');
const vendorController = require('../controllers/vendorController');
const multer = require('multer');
const path = require('path');
const config = require('../config');
const logger = require('../logger');

// استيراد الوسائط البرمجية للمصادقة
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// GET /vendors  → جلب كل التجّار (مسموح للمشرفين فقط)
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    // إضافة خيار لتصفية المتاجر النشطة والتي أكملت إعداداتها
    const { active, completed, page, limit } = req.query;
    
    let filters = {};
    
    // تصفية حسب حالة النشاط إذا تم تحديدها
    if (active === 'true') {
      filters.is_active = true;
    }
    
    // تصفية حسب اكتمال إعدادات المتجر إذا تم تحديدها
    if (completed === 'true') {
      filters.store_settings_completed = true;
    }
    
    // إضافة خيارات الصفحات إذا تم تحديدها
    if (page) {
      filters.page = parseInt(page);
    }
    
    if (limit) {
      filters.limit = parseInt(limit);
    }
    
    try {
      const result = await Vendor.findAll(filters);
      
      // التحقق من وجود البيانات
      if (!result || !result.vendors) {
        logger.error('Invalid result structure from findAll');
        return res.status(500).json({ 
          message: 'Error fetching vendors', 
          error: 'Invalid result structure' 
        });
      }
      
      res.json(result); // إرجاع الكائن الكامل الذي يحتوي على vendors و pagination
    } catch (findError) {
      logger.error('Error in findAll operation:', findError);
      return res.status(500).json({ 
        message: 'Error fetching vendors', 
        error: findError.message || 'Database query error' 
      });
    }
  } catch (err) {
    logger.error('Error in vendors route:', err);
    res.status(500).json({ message: 'Error fetching vendors', error: err.message });
  }
});

// GET /vendors/active  → جلب المتاجر النشطة والتي أكملت إعداداتها (متاح للجميع)
router.get('/active', async (req, res) => {
  try {
    const { page, limit } = req.query;
    
    let filters = {
      is_active: true,
      store_settings_completed: true
    };
    
    // إضافة خيارات الصفحات إذا تم تحديدها
    if (page) {
      filters.page = parseInt(page);
    }
    
    if (limit) {
      filters.limit = parseInt(limit);
    }
    
    try {
      const result = await Vendor.findAll(filters);
      
      // التحقق من وجود البيانات
      if (!result || !result.vendors) {
        logger.error('Invalid result structure from findAll');
        return res.status(500).json({ 
          message: 'Error fetching active vendors', 
          error: 'Invalid result structure' 
        });
      }
      
      res.json(result); // إرجاع الكائن الكامل الذي يحتوي على vendors و pagination
    } catch (findError) {
      logger.error('Error in findAll operation for active vendors:', findError);
      return res.status(500).json({ 
        message: 'Error fetching active vendors', 
        error: findError.message || 'Database query error' 
      });
    }
  } catch (err) {
    logger.error('Error in active vendors route:', err);
    res.status(500).json({ message: 'Error fetching active vendors', error: err.message });
  }
});

// ✅ POST /vendors → إنشاء تاجر جديد (مسموح للمشرفين فقط)
router.post('/', authMiddleware, roleMiddleware('admin'), vendorController.createVendor);

// ✅ GET /vendors/email/:email → جلب تاجر بالبريد الإلكتروني (مسموح للمشرفين والبائع نفسه)
router.get('/email/:email', authMiddleware, async (req, res, next) => {
  // السماح للمشرف بالوصول إلى أي بائع
  if (req.user.role === 'admin') {
    return next();
  }
  
  // السماح للبائع بالوصول إلى بياناته فقط
  if (req.user.role === 'vendor' && req.user.email === req.params.email) {
    return next();
  }
  
  // منع الوصول لغير المصرح لهم
  return res.status(403).json({ message: 'غير مسموح - لا يمكنك الوصول إلى بيانات بائع آخر' });
}, vendorController.getVendorByEmail);

// GET /vendors/:id → جلب تاجر بمعرّف (مسموح للمشرفين والبائع نفسه)
router.get('/:id', authMiddleware, async (req, res, next) => {
  // السماح للمشرف بالوصول إلى أي بائع
  if (req.user.role === 'admin') {
    return next();
  }
  
  // السماح للبائع بالوصول إلى بياناته فقط
  if (req.user.role === 'vendor' && req.user.vendorId === req.params.id) {
    return next();
  }
  
  // منع الوصول لغير المصرح لهم
  return res.status(403).json({ message: 'غير مسموح - لا يمكنك الوصول إلى بيانات بائع آخر' });
}, vendorController.getVendorById);

// PUT /vendors/:id → تحديث تاجر (مسموح للمشرفين والبائع نفسه)
router.put('/:id', authMiddleware, async (req, res, next) => {
  // السماح للمشرف بتحديث أي بائع
  if (req.user.role === 'admin') {
    return next();
  }
  
  // السماح للبائع بتحديث بياناته فقط
  if (req.user.role === 'vendor' && req.user.vendorId === req.params.id) {
    return next();
  }
  
  // منع الوصول لغير المصرح لهم
  return res.status(403).json({ message: 'غير مسموح - لا يمكنك تحديث بيانات بائع آخر' });
}, vendorController.updateVendor);

// DELETE /vendors/:id → حذف تاجر (مسموح للمشرفين فقط)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), vendorController.deleteVendor);

// PUT /vendors/:vendorId/settings → تحديث إعدادات المتجر (مسموح للمشرفين والبائع نفسه)
router.put('/:vendorId/settings', authMiddleware, async (req, res, next) => {
  // السماح للمشرف بتحديث إعدادات أي متجر
  if (req.user.role === 'admin') {
    return next();
  }
  
  // السماح للبائع بتحديث إعدادات متجره فقط
  if (req.user.role === 'vendor' && req.user.vendorId === req.params.vendorId) {
    return next();
  }
  
  // منع الوصول لغير المصرح لهم
  return res.status(403).json({ message: 'غير مسموح - لا يمكنك تحديث إعدادات متجر آخر' });
}, vendorController.updateStoreSettings);

// إعداد التخزين لمسار الصور
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, config.uploadsPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// التحقق من نوع وحجم الملف
function fileFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// رفع شعار المتجر (مسموح للمشرفين والبائع نفسه)
router.post('/:vendorId/upload-logo', authMiddleware, async (req, res, next) => {
  // السماح للمشرف برفع شعار لأي متجر
  if (req.user.role === 'admin') {
    return next();
  }
  
  // السماح للبائع برفع شعار لمتجره فقط
  if (req.user.role === 'vendor' && req.user.vendorId === req.params.vendorId) {
    return next();
  }
  
  // منع الوصول لغير المصرح لهم
  return res.status(403).json({ message: 'غير مسموح - لا يمكنك رفع شعار لمتجر آخر' });
}, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      logger.error('لم يتم رفع أي ملف شعار');
      return res.status(400).json({ message: 'يجب رفع صورة شعار المتجر' });
    }
    
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // تحديث مسار شعار المتجر
    const updatedVendor = await Vendor.update(
      req.params.vendorId,
      { store_logo_url: req.file.path }
    );
    
    res.json({ message: 'تم رفع الشعار بنجاح', logoUrl: req.file.path, vendor: updatedVendor });
  } catch (err) {
    logger.error('فشل رفع شعار المتجر: ' + err.message);
    res.status(500).json({ message: 'فشل رفع شعار المتجر', error: err.message });
  }
});

// GET /vendors/:vendorId/settings → جلب إعدادات المتجر (مسموح للمشرفين والبائع نفسه)
router.get('/:vendorId/settings', authMiddleware, async (req, res, next) => {
  // السماح للمشرف بجلب إعدادات أي متجر
  if (req.user.role === 'admin') {
    return next();
  }
  
  // السماح للبائع بجلب إعدادات متجره فقط
  if (req.user.role === 'vendor' && req.user.vendorId === req.params.vendorId) {
    return next();
  }
  
  // منع الوصول لغير المصرح لهم
  return res.status(403).json({ message: 'غير مسموح - لا يمكنك جلب إعدادات متجر آخر' });
}, async (req, res) => {
  try {
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // جلب إعدادات المتجر
    const settings = await vendorController.getStoreSettings(req.params.vendorId);
    
    res.json(settings);
  } catch (err) {
    logger.error('Error fetching store settings:', err);
    res.status(500).json({ message: 'Error fetching store settings', error: err.message });
  }
});

module.exports = router;