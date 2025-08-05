const Offer = require('../models/Offer');

// إنشاء عرض جديد
exports.createOffer = async (req, res) => {
  try {
    console.log('[Offers] Creating offer with data:', req.body);
    console.log('[Offers] User info:', req.user);
    
    const { 
      title, 
      description, 
      code, 
      type, 
      value, 
      minAmount,
      maxUsage,
      startDate,
      endDate,
      isActive
    } = req.body;

    // التحقق من البيانات الأساسية
    if (!title || !code || !type || !value) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول الأساسية مطلوبة (title, code, type, value)',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // التحقق من صحة النوع
    if (!['percentage', 'fixed'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع العرض يجب أن يكون percentage أو fixed',
        error: 'INVALID_OFFER_TYPE'
      });
    }

    // التحقق من صحة القيمة
    if (value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'قيمة العرض يجب أن تكون أكبر من صفر',
        error: 'INVALID_VALUE'
      });
    }

    // التحقق من صحة النسبة المئوية
    if (type === 'percentage' && value > 100) {
      return res.status(400).json({
        success: false,
        message: 'النسبة المئوية يجب أن تكون أقل من أو تساوي 100',
        error: 'INVALID_PERCENTAGE'
      });
    }

    const offerData = {
      title: title.trim(),
      description: description?.trim(),
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      minAmount: minAmount ? parseFloat(minAmount) : null,
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      isActive: isActive !== undefined ? isActive : true
    };

    console.log('[Offers] Offer data to create:', offerData);
    const savedOffer = await Offer.create(offerData);
    console.log('[Offers] Offer created successfully:', savedOffer);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء العرض بنجاح',
      data: savedOffer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Failed to create offer:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'كود العرض موجود مسبقاً',
        error: 'DUPLICATE_CODE',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء العرض',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// جلب جميع العروض
exports.getAllOffers = async (req, res) => {
  try {
    console.log('[Offers] Getting all offers with query:', req.query);
    
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      isActive,
      type,
      search
    } = req.query;

    const filters = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (type) filters.type = type;
    if (search) filters.search = search;

    const result = await Offer.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      filters
    });

    console.log(`[Offers] Found ${result.offers.length} offers`);
    
    res.json({
      success: true,
      message: 'تم جلب العروض بنجاح',
      data: result.offers,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error getting offers:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب العروض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// جلب عرض بواسطة المعرف
exports.getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Offers] Getting offer by ID: ${id}`);
    
    const offer = await Offer.findById(id);
    
    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'العرض غير موجود',
        error: 'OFFER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'تم جلب العرض بنجاح',
      data: offer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error getting offer by ID:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب العرض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// تحديث عرض
exports.updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Offers] Updating offer ${id} with data:`, req.body);
    
    const updateData = { ...req.body };
    
    // تنظيف البيانات
    if (updateData.title) updateData.title = updateData.title.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.code) updateData.code = updateData.code.trim().toUpperCase();
    if (updateData.value) updateData.value = parseFloat(updateData.value);
    if (updateData.minAmount) updateData.minAmount = parseFloat(updateData.minAmount);
    if (updateData.maxUsage) updateData.maxUsage = parseInt(updateData.maxUsage);
    
    // التحقق من صحة النوع إذا تم تحديثه
    if (updateData.type && !['percentage', 'fixed'].includes(updateData.type)) {
      return res.status(400).json({
        success: false,
        message: 'نوع العرض يجب أن يكون percentage أو fixed',
        error: 'INVALID_OFFER_TYPE'
      });
    }
    
    // التحقق من صحة القيمة إذا تم تحديثها
    if (updateData.value !== undefined && updateData.value <= 0) {
      return res.status(400).json({
        success: false,
        message: 'قيمة العرض يجب أن تكون أكبر من صفر',
        error: 'INVALID_VALUE'
      });
    }
    
    // التحقق من صحة النسبة المئوية
    if (updateData.type === 'percentage' && updateData.value > 100) {
      return res.status(400).json({
        success: false,
        message: 'النسبة المئوية يجب أن تكون أقل من أو تساوي 100',
        error: 'INVALID_PERCENTAGE'
      });
    }
    
    const updatedOffer = await Offer.update(id, updateData);
    
    if (!updatedOffer) {
      return res.status(404).json({
        success: false,
        message: 'العرض غير موجود',
        error: 'OFFER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'تم تحديث العرض بنجاح',
      data: updatedOffer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error updating offer:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        message: 'كود العرض موجود مسبقاً',
        error: 'DUPLICATE_CODE',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تحديث العرض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// حذف عرض
exports.deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Offers] Deleting offer: ${id}`);
    
    const deleted = await Offer.delete(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'العرض غير موجود',
        error: 'OFFER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف العرض بنجاح',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error deleting offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء حذف العرض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// تبديل حالة العرض
exports.toggleOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Offers] Toggling offer status: ${id}`);
    
    const updatedOffer = await Offer.toggleStatus(id);
    
    if (!updatedOffer) {
      return res.status(404).json({
        success: false,
        message: 'العرض غير موجود',
        error: 'OFFER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      message: `تم ${updatedOffer.isActive ? 'تفعيل' : 'إلغاء تفعيل'} العرض بنجاح`,
      data: updatedOffer,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error toggling offer status:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تغيير حالة العرض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// التحقق من صحة العرض
exports.validateOffer = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount = 0 } = req.body;
    
    console.log(`[Offers] Validating offer code: ${code} for amount: ${orderAmount}`);
    
    const validation = await Offer.validateOffer(code, parseFloat(orderAmount));
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        error: 'INVALID_OFFER',
        timestamp: new Date().toISOString()
      });
    }
    
    const discount = validation.offer.calculateDiscount(parseFloat(orderAmount));
    
    res.json({
      success: true,
      message: 'العرض صالح للاستخدام',
      data: {
        offer: validation.offer,
        discount,
        finalAmount: parseFloat(orderAmount) - discount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error validating offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء التحقق من العرض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// تطبيق العرض
exports.applyOffer = async (req, res) => {
  try {
    const { code } = req.params;
    const { orderAmount } = req.body;
    
    console.log(`[Offers] Applying offer code: ${code} for amount: ${orderAmount}`);
    
    const validation = await Offer.validateOffer(code, parseFloat(orderAmount));
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        error: 'INVALID_OFFER',
        timestamp: new Date().toISOString()
      });
    }
    
    // زيادة عداد الاستخدام
    await Offer.incrementUsage(validation.offer.id);
    
    const discount = validation.offer.calculateDiscount(parseFloat(orderAmount));
    
    res.json({
      success: true,
      message: 'تم تطبيق العرض بنجاح',
      data: {
        offer: validation.offer,
        discount,
        finalAmount: parseFloat(orderAmount) - discount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Offers] Error applying offer:', error);
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تطبيق العرض', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};