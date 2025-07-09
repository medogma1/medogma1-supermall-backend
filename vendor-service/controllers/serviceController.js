// vendor-service/controllers/serviceController.js
const Service = require('../models/Service');
const Vendor = require('../models/Vendor');
const logger = require('../logger');

// إنشاء خدمة جديدة
exports.createService = async (req, res) => {
  try {
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(req.body.vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'البائع غير موجود' });
    }

    // إعداد بيانات الخدمة
    const serviceData = {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      currency: req.body.currency,
      type: req.body.type,
      vendor_id: req.body.vendorId,
      vendor_name: vendor.name,
      image_url: req.body.imageUrl,
      additional_images: req.body.additionalImages || [],
      tags: req.body.tags || [],
      category_id: req.body.categoryId,
      category_name: req.body.categoryName,
      specifications: req.body.specifications || {},
      requirements: req.body.requirements || {},
      available_start_time: req.body.availableStartTime,
      available_end_time: req.body.availableEndTime,
      estimated_duration: req.body.estimatedDuration,
      is_featured: req.body.isFeatured || false
    };

    // إنشاء الخدمة
    const service = await Service.create(serviceData);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الخدمة بنجاح',
      data: service
    });
  } catch (error) {
    logger.error('خطأ في إنشاء خدمة جديدة:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'فشل في إنشاء الخدمة',
      error: error.message
    });
  }
};

// الحصول على جميع الخدمات
exports.getAllServices = async (req, res) => {
  try {
    // استخراج معايير البحث من الاستعلام
    const criteria = {};
    
    // فلترة حسب الحالة
    if (req.query.status) {
      criteria.status = req.query.status;
    } else {
      // افتراضيًا، عرض الخدمات النشطة فقط
      criteria.status = 'active';
    }
    
    // فلترة حسب التوفر
    if (req.query.isAvailable !== undefined) {
      criteria.is_available = req.query.isAvailable === 'true';
    }
    
    // فلترة حسب النوع
    if (req.query.type) {
      criteria.type = req.query.type;
    }
    
    // فلترة حسب الفئة
    if (req.query.categoryId) {
      criteria.category_id = req.query.categoryId;
    }

    // الحصول على الخدمات
    const services = await Service.find(criteria);

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error('خطأ في الحصول على الخدمات:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في الحصول على الخدمات',
      error: error.message
    });
  }
};

// الحصول على خدمة بواسطة المعرف
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error(`خطأ في الحصول على الخدمة بالمعرف ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'فشل في الحصول على الخدمة',
      error: error.message
    });
  }
};

// تحديث خدمة
exports.updateService = async (req, res) => {
  try {
    // التحقق من وجود الخدمة
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }

    // التحقق من ملكية الخدمة (إذا كان المستخدم ليس مسؤولاً)
    if (req.user && req.user.role !== 'admin' && service.vendor_id.toString() !== req.user.vendorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتحديث هذه الخدمة'
      });
    }

    // إعداد بيانات التحديث
    const updateData = {};
    
    // تحديث الحقول المقدمة فقط
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.price !== undefined) updateData.price = req.body.price;
    if (req.body.currency) updateData.currency = req.body.currency;
    if (req.body.type) updateData.type = req.body.type;
    if (req.body.imageUrl) updateData.image_url = req.body.imageUrl;
    if (req.body.additionalImages) updateData.additional_images = req.body.additionalImages;
    if (req.body.tags) updateData.tags = req.body.tags;
    if (req.body.categoryId) updateData.category_id = req.body.categoryId;
    if (req.body.categoryName) updateData.category_name = req.body.categoryName;
    if (req.body.specifications) updateData.specifications = req.body.specifications;
    if (req.body.requirements) updateData.requirements = req.body.requirements;
    if (req.body.availableStartTime) updateData.available_start_time = req.body.availableStartTime;
    if (req.body.availableEndTime) updateData.available_end_time = req.body.availableEndTime;
    if (req.body.estimatedDuration) updateData.estimated_duration = req.body.estimatedDuration;
    if (req.body.isAvailable !== undefined) updateData.is_available = req.body.isAvailable;
    if (req.body.isFeatured !== undefined) updateData.is_featured = req.body.isFeatured;

    // تحديث الخدمة
    const updatedService = await Service.update(req.params.id, updateData);

    res.status(200).json({
      success: true,
      message: 'تم تحديث الخدمة بنجاح',
      data: updatedService
    });
  } catch (error) {
    logger.error(`خطأ في تحديث الخدمة بالمعرف ${req.params.id}:`, error);
    res.status(400).json({
      success: false,
      message: 'فشل في تحديث الخدمة',
      error: error.message
    });
  }
};

// حذف خدمة
exports.deleteService = async (req, res) => {
  try {
    // التحقق من وجود الخدمة
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }

    // التحقق من ملكية الخدمة (إذا كان المستخدم ليس مسؤولاً)
    if (req.user && req.user.role !== 'admin' && service.vendor_id.toString() !== req.user.vendorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بحذف هذه الخدمة'
      });
    }

    // حذف الخدمة
    await Service.delete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'تم حذف الخدمة بنجاح'
    });
  } catch (error) {
    logger.error(`خطأ في حذف الخدمة بالمعرف ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'فشل في حذف الخدمة',
      error: error.message
    });
  }
};

// تحديث حالة الخدمة
exports.updateServiceStatus = async (req, res) => {
  try {
    // التحقق من وجود الخدمة
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }

    // التحقق من صلاحية الحالة
    if (!req.body.status || !['active', 'inactive', 'pending', 'rejected'].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الخدمة غير صالحة'
      });
    }

    // تحديث حالة الخدمة
    const updatedService = await Service.update(req.params.id, { status: req.body.status });

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة الخدمة بنجاح',
      data: updatedService
    });
  } catch (error) {
    logger.error(`خطأ في تحديث حالة الخدمة بالمعرف ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث حالة الخدمة',
      error: error.message
    });
  }
};

// الحصول على خدمات بائع معين
exports.getVendorServices = async (req, res) => {
  try {
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود'
      });
    }

    // استخراج معايير البحث من الاستعلام
    let status = null;
    if (req.query.status) {
      status = req.query.status;
    }

    // الحصول على خدمات البائع
    const services = await Service.findByVendorId(req.params.vendorId, status);

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error(`خطأ في الحصول على خدمات البائع ${req.params.vendorId}:`, error);
    res.status(500).json({
      success: false,
      message: 'فشل في الحصول على خدمات البائع',
      error: error.message
    });
  }
};

// البحث عن الخدمات
exports.searchServices = async (req, res) => {
  try {
    // إعداد معايير البحث
    const searchParams = {
      query: req.query.q,
      category: req.query.category,
      type: req.query.type,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice
    };

    // البحث عن الخدمات
    const services = await Service.search(searchParams);

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error('خطأ في البحث عن الخدمات:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في البحث عن الخدمات',
      error: error.message
    });
  }
};

// الحصول على الخدمات المميزة
exports.getFeaturedServices = async (req, res) => {
  try {
    // تحديد عدد الخدمات المطلوبة
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    // الحصول على الخدمات المميزة
    const services = await Service.findFeatured(limit);

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error('خطأ في الحصول على الخدمات المميزة:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في الحصول على الخدمات المميزة',
      error: error.message
    });
  }
};

// تحديث تقييم الخدمة
exports.updateServiceRating = async (req, res) => {
  try {
    // التحقق من وجود الخدمة
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'الخدمة غير موجودة'
      });
    }

    // التحقق من صحة بيانات التقييم
    if (req.body.rating === undefined || req.body.rating < 0 || req.body.rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'التقييم يجب أن يكون بين 0 و 5'
      });
    }

    if (req.body.reviewCount === undefined || req.body.reviewCount < 0) {
      return res.status(400).json({
        success: false,
        message: 'عدد المراجعات يجب أن يكون 0 أو أكثر'
      });
    }

    // تحديث تقييم الخدمة
    const updatedService = await Service.updateRating(
      req.params.id,
      req.body.rating,
      req.body.reviewCount
    );

    res.status(200).json({
      success: true,
      message: 'تم تحديث تقييم الخدمة بنجاح',
      data: updatedService
    });
  } catch (error) {
    logger.error(`خطأ في تحديث تقييم الخدمة بالمعرف ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث تقييم الخدمة',
      error: error.message
    });
  }
};