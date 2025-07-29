const Banner = require('../models/Banner');
const { successResponse, errorResponse } = require('../../utils/common/responseHandler');

// جلب جميع البنرات
const getAllBanners = async (req, res) => {
  try {
    const { active } = req.query;
    const options = {};
    
    if (active !== undefined) {
      options.isActive = active === 'true';
    }
    
    const banners = await Banner.findAll(options);
    
    successResponse(res, 200, 'تم جلب البنرات بنجاح', banners);
  } catch (error) {
    console.error('خطأ في جلب البنرات:', error);
    errorResponse(res, 500, 'فشل في جلب البنرات', error.message);
  }
};

// جلب بنر بواسطة المعرف
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    
    if (!banner) {
      return errorResponse(res, 404, 'البنر غير موجود');
    }
    
    successResponse(res, 200, 'تم جلب البنر بنجاح', banner);
  } catch (error) {
    console.error('خطأ في جلب البنر:', error);
    errorResponse(res, 500, 'فشل في جلب البنر', error.message);
  }
};

// إنشاء بنر جديد
const createBanner = async (req, res) => {
  try {
    const { title, description, imageUrl, link, isActive, position, startDate, endDate } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!title || !description) {
      return errorResponse(res, 400, 'العنوان والوصف مطلوبان');
    }
    
    const bannerData = {
      title,
      description,
      imageUrl,
      link,
      isActive: isActive !== undefined ? isActive : true,
      position: position || 0,
      startDate,
      endDate
    };
    
    const banner = await Banner.create(bannerData);
    
    successResponse(res, 201, 'تم إنشاء البنر بنجاح', banner);
  } catch (error) {
    console.error('خطأ في إنشاء البنر:', error);
    errorResponse(res, 500, 'فشل في إنشاء البنر', error.message);
  }
};

// تحديث بنر
const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const banner = await Banner.update(id, updateData);
    
    if (!banner) {
      return errorResponse(res, 404, 'البنر غير موجود');
    }
    
    successResponse(res, 200, 'تم تحديث البنر بنجاح', banner);
  } catch (error) {
    console.error('خطأ في تحديث البنر:', error);
    errorResponse(res, 500, 'فشل في تحديث البنر', error.message);
  }
};

// حذف بنر
const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await Banner.delete(id);
    
    if (!deleted) {
      return errorResponse(res, 404, 'البنر غير موجود');
    }
    
    successResponse(res, 200, 'تم حذف البنر بنجاح');
  } catch (error) {
    console.error('خطأ في حذف البنر:', error);
    errorResponse(res, 500, 'فشل في حذف البنر', error.message);
  }
};

// تبديل حالة البنر
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.toggleStatus(id);
    
    if (!banner) {
      return errorResponse(res, 404, 'البنر غير موجود');
    }
    
    successResponse(res, 200, 'تم تغيير حالة البنر بنجاح', banner);
  } catch (error) {
    console.error('خطأ في تغيير حالة البنر:', error);
    errorResponse(res, 500, 'فشل في تغيير حالة البنر', error.message);
  }
};

// جلب البنرات النشطة للعرض العام
const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({ isActive: true });
    
    // فلترة البنرات حسب التاريخ
    const now = new Date();
    const activeBanners = banners.filter(banner => {
      if (banner.startDate && new Date(banner.startDate) > now) {
        return false;
      }
      if (banner.endDate && new Date(banner.endDate) < now) {
        return false;
      }
      return true;
    });
    
    successResponse(res, 200, 'تم جلب البنرات النشطة بنجاح', activeBanners);
  } catch (error) {
    console.error('خطأ في جلب البنرات النشطة:', error);
    errorResponse(res, 500, 'فشل في جلب البنرات النشطة', error.message);
  }
};

module.exports = {
  getAllBanners,
  getBannerById,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  getActiveBanners
};