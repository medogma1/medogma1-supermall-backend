const { Vendor } = require('../models/Vendor');
const { VendorSettings } = require('../models/VendorSettings');
// const { logger } = require('../../utils/logger');

// دالة مساعدة للتحقق من اكتمال إعدادات المتجر
const checkStoreSettingsComplete = (vendor) => {
  return (
    vendor.store_name && 
    vendor.store_description && 
    vendor.store_logo_url && 
    vendor.contact_email && 
    vendor.contact_phone && 
    vendor.store_address
  );
};

// إنشاء بائع جديد → POST /vendors
exports.createVendor = async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Received vendor creation request with data:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
    
    // التحقق من وجود حقول غير مرغوب فيها
    const unauthorizedFields = ['password', 'password_hash', 'password_confirmation', 'salt', 'hash'];
    const foundUnauthorizedFields = unauthorizedFields.filter(field => req.body.hasOwnProperty(field));
    
    if (foundUnauthorizedFields.length > 0) {
      console.warn('⚠️ [WARNING] Found unauthorized fields:', foundUnauthorizedFields);
      // إزالة الحقول غير المرغوب فيها
      foundUnauthorizedFields.forEach(field => {
        delete req.body[field];
        console.log(`🗑️ [CLEANUP] Removed unauthorized field: ${field}`);
      });
    }
    
    const {
      name,
      email,
      phone,
      storeName,
      storeDescription,
      storeLogoUrl,
      contactEmail,
      contactPhone,
      storeAddress,
      country,
      governorate,
      nationalId,
      user_id,
      business_type
    } = req.body;

    console.log('Extracted vendor data:', { name, email, phone, country, governorate, nationalId, user_id, business_type });

    if (!name || !email || !phone || !user_id || !business_type) {
      console.error('Missing required fields');
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!phone) missingFields.push('phone');
      if (!user_id) missingFields.push('user_id');
      if (!business_type) missingFields.push('business_type');
      
      return res.status(400).json({ 
        message: 'الحقول التالية مطلوبة', 
        missingFields: missingFields,
        details: `الحقول المطلوبة: ${missingFields.join(', ')}` 
      });
    }

    // إذا لم يتم توفير store_name، استخدم name كقيمة افتراضية
    const finalStoreName = storeName || name || `${name}'s Store`;

    // التحقق من وجود البريد الإلكتروني مسبقًا
    const existingVendor = await Vendor.findByEmail(email);
    if (existingVendor) {
      console.error('Email already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    // التحقق من عدم وجود user_id مكرر
    const existingVendorByUserId = await Vendor.findByUserId(user_id);
    if (existingVendorByUserId) {
      console.error('User already has a vendor account:', user_id);
      return res.status(400).json({ message: 'User already has a vendor account' });
    }

    // تحويل القيم الفارغة إلى سلاسل نصية فارغة لتجنب مشاكل التحقق من الصحة
    const vendorData = {
      name,
      email,
      phone,
      user_id: typeof user_id === 'string' ? parseInt(user_id, 10) : user_id,
      business_type,
      store_name: finalStoreName,
      store_description: storeDescription || '',
      store_logo_url: storeLogoUrl || '',
      contact_email: contactEmail || email,
      contact_phone: contactPhone || phone,
      store_address: storeAddress || '',
      country: country || '',
      governorate: governorate || '',
      national_id: nationalId || req.body.nationalId || '', // دعم كلا من nationalId و national_id
      is_active: true,
      store_settings_completed: false
    };

    // تحويل أي قيم undefined إلى null وإزالة القيم الفارغة
    Object.keys(vendorData).forEach(key => {
      if (vendorData[key] === undefined || vendorData[key] === '') {
        vendorData[key] = null;
      }
    });
    
    // التحقق الإضافي من عدم وجود قيم undefined في البيانات
    const hasUndefinedValues = Object.values(vendorData).some(value => value === undefined);
    if (hasUndefinedValues) {
      console.error('Found undefined values in vendor data:', vendorData);
      return res.status(400).json({ 
        message: 'Invalid data: undefined values detected',
        error: 'Bind parameters must not contain undefined. To pass SQL NULL specify JS null'
      });
    }

    // التأكد من أن user_id هو رقم صحيح
    if (isNaN(vendorData.user_id)) {
      console.error('user_id must be a valid number');
      return res.status(400).json({ message: 'user_id must be a valid number' });
    }

    console.log('🔍 [DEBUG] Final vendor data before create:', JSON.stringify(vendorData, null, 2));
    
    // التحقق من صحة البيانات
    try {
      if (!Vendor.validateVendorData(vendorData)) {
        const validationErrors = Vendor._lastValidationError || 'Invalid vendor data';
        console.error('❌ [VALIDATION] Vendor data validation failed:', validationErrors);
        return res.status(400).json({ 
          message: 'Validation error', 
          error: 'Invalid vendor data',
          details: Array.isArray(validationErrors) ? validationErrors : [validationErrors]
        });
      }
    } catch (validationError) {
      console.error('❌ [VALIDATION] Validation error:', validationError.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        error: validationError.message || 'Invalid vendor data',
        details: [validationError.message || 'Invalid vendor data']
      });
    }

    console.log('✅ [VALIDATION] Vendor data validation passed');
    
    // إنشاء البائع الجديد
    console.log('🚀 [CREATE] Starting vendor creation...');
    const newVendor = await Vendor.create(vendorData);
    
    if (!newVendor) {
      console.error('Vendor creation returned null');
      return res.status(500).json({ 
        message: 'Error creating vendor', 
        error: 'Vendor creation returned null'
      });
    }
    
    console.log('Vendor created successfully with ID:', newVendor.id);
    console.log('✅ Sending vendor response:', JSON.stringify({ message: 'Vendor created successfully', vendor: newVendor }, null, 2));
    res.status(201).json({ message: 'Vendor created successfully', vendor: newVendor });
  } catch (error) {
    // تسجيل مفصل للخطأ
    console.error('❌ [ERROR] Vendor creation failed:', {
      message: error.message,
      stack: error.stack,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      code: error.code,
      statusCode: error.statusCode
    });
    
    // تحسين رسالة الخطأ لتكون أكثر تفصيلاً
    let errorMessage = 'حدث خطأ أثناء إنشاء الحساب';
    let statusCode = error.statusCode || 500;
    
    // معالجة أخطاء SQL المحددة
    if (error.sqlState === '42S22' && error.message.includes('Unknown column')) {
      errorMessage = 'خطأ في بنية قاعدة البيانات - يرجى الاتصال بالدعم الفني';
      console.error('🔥 [CRITICAL] Database schema error detected:', error.message);
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'البيانات مكررة - يرجى التحقق من البريد الإلكتروني أو رقم الهاتف';
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({ 
      message: 'Error creating vendor', 
      error: errorMessage,
      details: error.details || null,
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          sqlState: error.sqlState,
          sqlMessage: error.sqlMessage,
          code: error.code
        }
      })
    });
  }
};

// إعدادات المتجر → PUT /vendors/:vendorId/settings
exports.updateStoreSettings = async (req, res) => {
  try {
    console.log('📥 Store settings update request:', JSON.stringify(req.body, null, 2));
    
    const {
      storeName,
      storeDescription,
      storeLogoUrl,
      logoUrl, // إضافة دعم للاسم البديل المستخدم في الفرونت إند
      contactEmail,
      contactPhone,
      storeAddress
    } = req.body;

    const { vendorId } = req.params;
    
    // تنظيف وتحقق من رقم الهاتف
    const { cleanPhoneNumber, validatePhoneNumber } = require('../../utils/phoneUtils');
    let cleanedContactPhone = '';
    if (contactPhone) {
      cleanedContactPhone = cleanPhoneNumber(contactPhone);
      console.log('📞 Phone cleaning:', {
        original: contactPhone,
        cleaned: cleanedContactPhone,
        originalLength: contactPhone?.length,
        cleanedLength: cleanedContactPhone?.length
      });
      
      if (!validatePhoneNumber(cleanedContactPhone)) {
        return res.status(400).json({ 
          message: 'Invalid phone number format',
          errors: {
            contactPhone: 'يجب أن يكون رقم الهاتف بتنسيق صحيح (مثال: 05xxxxxxxx للسعودية أو 01xxxxxxxx لمصر أو +966xxxxxxxxx)'
          }
        });
      }
    }
    
    // استخدام logoUrl إذا كان storeLogoUrl غير موجود
    const finalLogoUrl = storeLogoUrl || logoUrl;

    // التحقق من الحقول المطلوبة مع رسائل خطأ مفصلة
    const errors = {};
    if (!storeName || storeName.trim() === '') errors.storeName = 'اسم المتجر مطلوب';
    if (!storeDescription || storeDescription.trim() === '') errors.storeDescription = 'وصف المتجر مطلوب';
    if (!finalLogoUrl || finalLogoUrl.trim() === '') errors.storeLogoUrl = 'شعار المتجر مطلوب';
    if (!contactEmail || contactEmail.trim() === '') errors.contactEmail = 'البريد الإلكتروني مطلوب';
    if (!cleanedContactPhone || cleanedContactPhone.trim() === '') errors.contactPhone = 'رقم الهاتف مطلوب';
    if (!storeAddress || storeAddress.trim() === '') errors.storeAddress = 'عنوان المتجر مطلوب';

    if (Object.keys(errors).length > 0) {
      console.log('❌ Validation errors:', errors);
      return res.status(400).json({ 
        message: 'بيانات غير مكتملة',
        errors 
      });
    }

    // التحقق من وجود البائع
    const existingVendor = await Vendor.findById(vendorId);
    if (!existingVendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // تحديث بيانات المتجر في نموذج Vendor
    const updatedVendor = await Vendor.update(vendorId, {
      store_name: storeName.trim(),
      store_description: storeDescription.trim(),
      store_logo_url: finalLogoUrl.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: cleanedContactPhone,
      store_address: storeAddress.trim(),
      store_settings_completed: true // تحديث حالة إكمال الإعدادات
    });
    
    console.log('✅ Store settings updated successfully for vendor:', vendorId);

    // تحديث إعدادات المتجر في نموذج VendorSettings
    const settingsData = {
      vendor_id: vendorId,
      theme: JSON.stringify({
        primaryColor: '#3498db',
        secondaryColor: '#2ecc71',
        accentColor: '#e74c3c',
        fontFamily: 'Roboto',
        darkMode: false,
        customCss: ''
      }),
      layout: JSON.stringify({
        productListLayout: 'grid',
        productsPerPage: 12,
        showFilters: true,
        showSortOptions: true,
        enableQuickView: true
      }),
      business: JSON.stringify({
        storeCurrency: 'EGP',
        taxRate: 14,
        shippingOptions: [],
        paymentMethods: {
          cashOnDelivery: true,
          creditCard: false,
          bankTransfer: false,
          applePay: false,
          googlePay: false
        },
        returnPolicy: '',
        privacyPolicy: '',
        termsAndConditions: ''
      }),
      seo: JSON.stringify({
        metaTitle: storeName,
        metaDescription: storeDescription,
        keywords: [],
        googleAnalyticsId: '',
        facebookPixelId: ''
      }),
      social_media: JSON.stringify({
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
        pinterest: ''
      }),
      notifications: JSON.stringify({
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        orderUpdates: true,
        promotionalEmails: true,
        lowStockAlerts: true
      })
    };

    // التحقق من وجود إعدادات المتجر وتحديثها أو إنشائها
    let storeSettings = await VendorSettings.findByVendorId(vendorId);
    if (storeSettings) {
      storeSettings = await VendorSettings.update(vendorId, settingsData);
    } else {
      storeSettings = await VendorSettings.create(settingsData);
    }

    res.json({ 
      message: 'Store settings updated successfully', 
      settings: storeSettings,
      storeSettingsCompleted: true
    });
  } catch (error) {
    console.error('Error updating store settings:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error updating store settings', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// جلب بائع واحد → GET /vendors/:id
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // إضافة معلومات إضافية عن المتجر إذا كانت الإعدادات مكتملة
    if (vendor.store_settings_completed) {
      // يمكن إضافة معلومات إضافية هنا إذا لزم الأمر
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error fetching vendor', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// جلب بائع بواسطة البريد الإلكتروني → GET /vendors/email/:email
exports.getVendorByEmail = async (req, res) => {
  try {
    const vendor = await Vendor.findByEmail(req.params.email);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // إضافة معلومات إضافية عن المتجر إذا كانت الإعدادات مكتملة
    if (vendor.store_settings_completed) {
      // يمكن إضافة معلومات إضافية هنا إذا لزم الأمر
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor by email:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error fetching vendor by email', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// البحث في البائعين → GET /vendors/search
exports.searchVendors = async (req, res) => {
  try {
    const { q, business_type, is_active, page = 1, limit = 10 } = req.query;
    
    const searchOptions = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    // إضافة معايير البحث
    if (q) {
      searchOptions.search = q;
    }
    
    if (business_type) {
      searchOptions.business_type = business_type;
    }
    
    if (is_active !== undefined) {
      searchOptions.is_active = is_active === 'true';
    }
    
    const result = await Vendor.findAll(searchOptions);
    
    res.json({
      success: true,
      data: result.vendors,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error searching vendors:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error searching vendors', 
      error: err.message 
    });
  }
};

// تحديث بيانات بائع → PUT /vendors/:id
exports.updateVendor = async (req, res) => {
  try {
    const { name, email, phone, storeName, storeDescription, storeLogoUrl, contactEmail, contactPhone, storeAddress } = req.body;
    
    // إنشاء كائن التحديث مع البيانات الأساسية
    const updateData = { name, email, phone };
    
    // إضافة بيانات المتجر إذا تم توفيرها
    if (storeName) updateData.store_name = storeName;
    if (storeDescription) updateData.store_description = storeDescription;
    if (storeLogoUrl) updateData.store_logo_url = storeLogoUrl;
    if (contactEmail) updateData.contact_email = contactEmail;
    if (contactPhone) updateData.contact_phone = contactPhone;
    if (storeAddress) updateData.store_address = storeAddress;
    
    // تحديث بيانات البائع
    const vendor = await Vendor.update(req.params.id, updateData);
    
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // تحديث إعدادات المتجر إذا تم توفير بيانات المتجر
    if (storeName || storeDescription || storeLogoUrl || contactEmail || contactPhone || storeAddress) {
      // تحديث أو إنشاء إعدادات المتجر
      const storeSettingsData = {};
      
      // التحقق من وجود إعدادات المتجر
      let storeSettings = await VendorSettings.findByVendorId(req.params.id);
      
      if (storeSettings) {
        // تحديث الإعدادات الموجودة
        if (storeName) {
          const seo = JSON.parse(storeSettings.seo);
          seo.metaTitle = storeName;
          storeSettingsData.seo = JSON.stringify(seo);
        }
        if (storeDescription) {
          const seo = JSON.parse(storeSettings.seo);
          seo.metaDescription = storeDescription;
          storeSettingsData.seo = JSON.stringify(seo);
        }
        
        if (Object.keys(storeSettingsData).length > 0) {
          await VendorSettings.update(req.params.id, storeSettingsData);
        }
      } else {
        // إنشاء إعدادات جديدة
        await VendorSettings.create({
          vendor_id: req.params.id,
          theme: JSON.stringify({
            primaryColor: '#3498db',
            secondaryColor: '#2ecc71',
            accentColor: '#e74c3c',
            fontFamily: 'Roboto',
            darkMode: false,
            customCss: ''
          }),
          layout: JSON.stringify({
            productListLayout: 'grid',
            productsPerPage: 12,
            showFilters: true,
            showSortOptions: true,
            enableQuickView: true
          }),
          business: JSON.stringify({
            storeCurrency: 'EGP',
            taxRate: 14,
            shippingOptions: [],
            paymentMethods: {
              cashOnDelivery: true,
              creditCard: false,
              bankTransfer: false,
              applePay: false,
              googlePay: false
            },
            returnPolicy: '',
            privacyPolicy: '',
            termsAndConditions: ''
          }),
          seo: JSON.stringify({
            metaTitle: storeName || '',
            metaDescription: storeDescription || '',
            keywords: [],
            googleAnalyticsId: '',
            facebookPixelId: ''
          }),
          social_media: JSON.stringify({
            facebook: '',
            instagram: '',
            twitter: '',
            youtube: '',
            linkedin: '',
            pinterest: ''
          }),
          notifications: JSON.stringify({
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            orderUpdates: true,
            promotionalEmails: true,
            lowStockAlerts: true
          })
        });
      }
    }
    
    res.json({ message: 'Vendor updated successfully', vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error updating vendor', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// حذف بائع → DELETE /vendors/:id
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    // حذف البائع
    await Vendor.delete(req.params.id);
    
    // حذف إعدادات المتجر المرتبطة بالبائع
    await VendorSettings.delete(req.params.id);
    
    res.json({ message: 'Vendor deleted successfully', vendor });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error deleting vendor', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// جلب إعدادات المتجر → GET /vendors/:vendorId/settings
exports.getStoreSettings = async (req, res) => {
  try {
    const vendorId = req.params.vendorId || req.params.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    // جلب إعدادات المتجر من VendorSettings إذا كانت موجودة
    let storeSettings = await VendorSettings.findByVendorId(vendorId);
    
    // إذا لم توجد إعدادات متجر، أنشئ إعدادات افتراضية
    if (!storeSettings) {
      storeSettings = await VendorSettings.create({
        vendor_id: vendorId,
        theme: JSON.stringify({
          primaryColor: '#3498db',
          secondaryColor: '#2ecc71',
          accentColor: '#e74c3c',
          fontFamily: 'Roboto',
          darkMode: false,
          customCss: ''
        }),
        layout: JSON.stringify({
          productListLayout: 'grid',
          productsPerPage: 12,
          showFilters: true,
          showSortOptions: true,
          enableQuickView: true
        }),
        business: JSON.stringify({
          storeCurrency: 'EGP',
          taxRate: 14,
          shippingOptions: [],
          paymentMethods: {
            cashOnDelivery: true,
            creditCard: false,
            bankTransfer: false,
            applePay: false,
            googlePay: false
          },
          returnPolicy: '',
          privacyPolicy: '',
          termsAndConditions: ''
        }),
        seo: JSON.stringify({
          metaTitle: vendor.store_name || '',
          metaDescription: vendor.store_description || '',
          keywords: [],
          googleAnalyticsId: '',
          facebookPixelId: ''
        }),
        social_media: JSON.stringify({
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: '',
          linkedin: '',
          pinterest: ''
        }),
        notifications: JSON.stringify({
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true,
          orderUpdates: true,
          promotionalEmails: true,
          lowStockAlerts: true
        })
      });
    }
    
    res.json({
      message: 'Store settings fetched successfully',
      settings: storeSettings
    });
  } catch (error) {
    console.error('Error fetching store settings:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error fetching store settings', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// رفع شعار المتجر → POST /vendors/:vendorId/upload-logo
exports.uploadStoreLogo = async (req, res) => {
  try {
    if (!req.file) {
      console.error('لم يتم رفع أي ملف شعار');
      return res.status(400).json({ message: 'يجب رفع صورة شعار المتجر' });
    }
    
    const vendorId = req.params.vendorId;
    
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      console.error(`Vendor not found with ID: ${vendorId}`);
      return res.status(404).json({ message: 'Vendor not found' });
    }
    
    // إنشاء رابط الصورة المرفوعة
    const logoUrl = `/uploads/${req.file.filename}`;
    
    // تحديث شعار المتجر في قاعدة البيانات
    const updatedVendor = await Vendor.update(vendorId, { 
      store_logo_url: logoUrl 
    });
    
    // تحديث إعدادات المتجر أيضاً إذا كانت موجودة
    try {
      await VendorSettings.update(vendorId, { 
        store_logo_url: logoUrl 
      });
    } catch (settingsError) {
      console.warn('Could not update VendorSettings logo URL:', settingsError.message);
    }
    
    console.log(`✅ Store logo uploaded successfully for vendor ${vendorId}: ${logoUrl}`);
    
    res.json({ 
      message: 'تم رفع الشعار بنجاح', 
      logoUrl: logoUrl,
      vendor: updatedVendor 
    });
    
  } catch (error) {
    console.error('فشل رفع شعار المتجر:', error);
    res.status(500).json({ 
      message: 'فشل رفع شعار المتجر', 
      error: error.message 
    });
  }
};

// تحديث حالة البائع → PUT /vendors/:id/status
exports.updateVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // التحقق من صحة البيانات
    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة البائع غير صحيحة. يجب أن تكون: active, inactive, أو suspended'
      });
    }

    const result = await Vendor.updateStatus(id, status);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم تحديث حالة البائع بنجاح',
      data: { id, status }
    });
  } catch (error) {
    console.error('فشل تحديث حالة البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحديث حالة البائع',
      error: error.message
    });
  }
};

// تبديل حالة البائع بين active و inactive → PATCH /:id/toggle-status
exports.toggleVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // جلب البائع الحالي
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود'
      });
    }

    // تحديد الحالة الجديدة (تبديل بين active و inactive)
    const newStatus = vendor.isActive === 1 ? 'inactive' : 'active';

    const result = await Vendor.updateStatus(id, newStatus);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'فشل في تحديث حالة البائع'
      });
    }

    res.status(200).json({
      success: true,
      message: `تم تبديل حالة البائع إلى ${newStatus === 'active' ? 'نشط' : 'غير نشط'}`,
      data: { 
        id, 
        previousStatus: vendor.status, 
        newStatus 
      }
    });
  } catch (error) {
    console.error('فشل تبديل حالة البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تبديل حالة البائع',
      error: error.message
    });
  }
};

// جلب البائعين العامين (بدون مصادقة) → GET /vendors/public
exports.getPublicVendors = async (req, res) => {
  try {
    const vendors = await Vendor.getPublicVendors();
    res.status(200).json({
      success: true,
      message: 'تم جلب البائعين العامين بنجاح',
      data: vendors
    });
  } catch (error) {
    console.error('فشل جلب البائعين العامين:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب البائعين العامين',
      error: error.message
    });
  }
};

// جلب جميع البائعين (للمدير فقط) → GET /vendors
exports.getAllVendors = async (req, res) => {
  try {
    console.log('🔍 [Vendor Controller] getAllVendors called');
    console.log('🔍 [Vendor Controller] User:', req.user);
    
    const vendors = await Vendor.getAll();
    console.log('✅ [Vendor Controller] Vendors retrieved:', vendors.length, 'vendors');
    console.log('🔍 [Vendor Controller] Sample vendor:', vendors[0] || 'No vendors found');
    
    const response = {
      success: true,
      message: 'تم جلب جميع البائعين بنجاح',
      data: vendors
    };
    
    console.log('📤 [Vendor Controller] Sending response:', JSON.stringify(response).substring(0, 200) + '...');
    
    res.status(200).json(response);
  } catch (error) {
    console.log('❌ [Vendor Controller] Error in getAllVendors:', error.message);
    console.error('فشل جلب جميع البائعين:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب جميع البائعين',
      error: error.message
    });
  }
};

// جلب إحصائيات البائعين (للمدير فقط) → GET /vendors/analytics
exports.getVendorsAnalytics = async (req, res) => {
  try {
    const analytics = await Vendor.getAnalytics();
    res.status(200).json({
      success: true,
      message: 'تم جلب إحصائيات البائعين بنجاح',
      data: analytics
    });
  } catch (error) {
    console.error('فشل جلب إحصائيات البائعين:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب إحصائيات البائعين',
      error: error.message
    });
  }
};

// جلب إعدادات البائع → GET /vendors/:id/settings
exports.getVendorSettings = async (req, res) => {
  try {
    const { id } = req.params;
    // Use getOrCreate to ensure settings exist
    const settings = await VendorSettings.getOrCreate(id);

    res.status(200).json({
      success: true,
      message: 'تم جلب إعدادات البائع بنجاح',
      data: settings
    });
  } catch (error) {
    console.error('فشل جلب إعدادات البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب إعدادات البائع',
      error: error.message
    });
  }
};

// تحديث إعدادات البائع → PUT /vendors/:id/settings
exports.updateVendorSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settingsData = req.body;
    
    console.log('📦 [updateVendorSettings] Received data for vendor:', id);
    console.log('📦 [updateVendorSettings] Settings data:', JSON.stringify(settingsData, null, 2));
    
    // Transform Flutter app data to VendorSettings format
    // Ensure null values are converted to empty strings for Flutter compatibility
    const transformedData = {
      business: {
        storeName: settingsData.storeName || '',
        storeDescription: settingsData.storeDescription || '',
        contactEmail: settingsData.contactEmail || '',
        contactPhone: settingsData.contactPhone || '',
        storeAddress: settingsData.storeAddress || '',
        storeLogoUrl: settingsData.storeLogoUrl || ''
      }
    };
    
    console.log('🔄 [updateVendorSettings] Transformed data:', JSON.stringify(transformedData, null, 2));

    // Ensure settings exist before updating
    let settings = await VendorSettings.getOrCreate(id);
    const updatedSettings = await VendorSettings.update(id, transformedData);
    
    // Fallback to created settings if update returns null
    const responseData = updatedSettings || settings;
    
    if (!responseData) {
      throw new Error('Failed to create or update vendor settings');
    }
    
    // Sanitize response data to ensure no null values for Flutter compatibility
    const sanitizeObject = (obj) => {
      if (obj === null || obj === undefined) return '';
      if (typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitizeObject);
      
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined) {
          sanitized[key] = '';
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };
    
    const sanitizedData = sanitizeObject(responseData);
    
    res.status(200).json({
       success: true,
       message: 'تم تحديث إعدادات البائع بنجاح',
       data: sanitizedData
     });
  } catch (error) {
    console.error('فشل تحديث إعدادات البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحديث إعدادات البائع',
      error: error.message
    });
  }
};

// رفع شعار البائع → POST /vendors/:id/upload-logo
exports.uploadLogo = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📤 Upload logo request for vendor:', id);
    console.log('📁 Request file:', req.file ? 'Present' : 'Missing');
    console.log('📄 Request body:', req.body);
    
    let logoUrl;
    
    // Check if this is a Cloudinary URL update (JSON data)
    if (req.body.logoUrl && !req.file) {
      console.log('✅ Cloudinary logo URL provided:', req.body.logoUrl);
      logoUrl = req.body.logoUrl;
    }
    // Check if this is a file upload
    else if (req.file) {
      console.log('✅ File uploaded successfully:', req.file.filename);
      logoUrl = `/uploads/${req.file.filename}`;
    }
    // No file or URL provided
    else {
      console.log('❌ No file uploaded or logo URL provided');
      return res.status(400).json({
        success: false,
        message: 'يجب رفع ملف أو توفير رابط الشعار'
      });
    }

    await Vendor.updateLogo(id, logoUrl);
    
    console.log('✅ Logo URL updated in database:', logoUrl);
    res.status(200).json({
       success: true,
       message: 'تم رفع الشعار بنجاح',
       data: { logoUrl }
     });
   } catch (error) {
     console.error('❌ Upload logo error:', error);
     
     // Handle multer errors specifically
     if (error.code === 'LIMIT_FILE_SIZE') {
       return res.status(400).json({
         success: false,
         message: 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)'
       });
     }
     
     if (error.message.includes('يُسمح بالصور فقط')) {
       return res.status(400).json({
         success: false,
         message: error.message
       });
     }
     
     res.status(500).json({
       success: false,
       message: 'فشل رفع الشعار',
       error: error.message
     });
   }
 };

// جلب طلبات البائع → GET /vendors/:id/orders
exports.getVendorOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = await Vendor.getOrders(id);
    
    res.status(200).json({
      success: true,
      message: 'تم جلب طلبات البائع بنجاح',
      data: orders
    });
  } catch (error) {
    console.error('فشل جلب طلبات البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب طلبات البائع',
      error: error.message
    });
  }
};

// جلب منتجات البائع → GET /vendors/:id/products
exports.getVendorProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Vendor.getProducts(id);
    
    res.status(200).json({
      success: true,
      message: 'تم جلب منتجات البائع بنجاح',
      data: products
    });
  } catch (error) {
    console.error('فشل جلب منتجات البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب منتجات البائع',
      error: error.message
    });
  }
};

// جلب تقييمات البائع → GET /vendors/:id/reviews
exports.getVendorReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Vendor.getReviews(id);
    
    res.status(200).json({
      success: true,
      message: 'تم جلب تقييمات البائع بنجاح',
      data: reviews
    });
  } catch (error) {
    console.error('فشل جلب تقييمات البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب تقييمات البائع',
      error: error.message
    });
  }
};

// جلب لوحة تحكم البائع → GET /vendors/my/dashboard
exports.getVendorDashboard = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id || req.user.id;
    const dashboard = await Vendor.getDashboard(vendorId);
    
    res.status(200).json({
      success: true,
      message: 'تم جلب لوحة التحكم بنجاح',
      data: dashboard
    });
  } catch (error) {
    console.error('فشل جلب لوحة التحكم:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب لوحة التحكم',
      error: error.message
    });
  }
};

// جلب الملف الشخصي للبائع → GET /vendors/my/profile
exports.getMyProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id || req.user.id;
    const profile = await Vendor.findById(vendorId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'الملف الشخصي غير موجود'
      });
    }

    res.status(200).json({
      success: true,
      message: 'تم جلب الملف الشخصي بنجاح',
      data: profile
    });
  } catch (error) {
    console.error('فشل جلب الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب الملف الشخصي',
      error: error.message
    });
  }
};

// تحديث الملف الشخصي للبائع → PUT /vendors/my/profile
exports.updateMyProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id || req.user.id;
    const updateData = req.body;

    const updatedProfile = await Vendor.update(vendorId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: updatedProfile
    });
  } catch (error) {
    console.error('فشل تحديث الملف الشخصي:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحديث الملف الشخصي',
      error: error.message
    });
  }
};

// التحقق من البائع → POST /vendors/:id/verify
// التحقق العام من البائعين → POST /vendors/verify
exports.verifyVendorGeneral = async (req, res) => {
  try {
    console.log('🔍 [Vendor Verify] Starting general verification process');
    console.log('🔍 [Vendor Verify] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 [Vendor Verify] Content-Type:', req.headers['content-type']);
    console.log('🔍 [Vendor Verify] Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 [Vendor Verify] Request body type:', typeof req.body);
    console.log('🔍 [Vendor Verify] Request body keys:', Object.keys(req.body));
    console.log('🔍 [Vendor Verify] Raw body length:', req.body ? Object.keys(req.body).length : 'null');
    
    const { vendorId, vendorIds } = req.body;
    
    // التحقق من وجود البيانات في الطلب
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'جسم الطلب فارغ. يجب تمرير vendorId أو vendorIds',
        example: {
          single: { vendorId: "123" },
          multiple: { vendorIds: ["123", "456"] }
        }
      });
    }
    
    // إذا تم تمرير معرف بائع واحد
    if (vendorId) {
      console.log(`🔍 [Vendor Verify] Processing single vendor: ${vendorId}`);
      
      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: 'البائع غير موجود'
        });
      }
      
      const updatedVendor = await Vendor.update(vendorId, {
        verificationStatus: 'verified',
        isVerified: 1
      });
      
      console.log(`✅ تم التحقق من البائع: ${vendorId}`);
      
      return res.status(200).json({
        success: true,
        message: 'تم التحقق من البائع بنجاح',
        data: updatedVendor
      });
    }
    
    // إذا تم تمرير مصفوفة من معرفات البائعين
    if (vendorIds && Array.isArray(vendorIds)) {
      console.log(`🔍 [Vendor Verify] Processing multiple vendors: ${vendorIds.length} vendors`);
      
      const results = [];
      
      for (const id of vendorIds) {
        try {
          const vendor = await Vendor.findById(id);
          if (vendor) {
            const updatedVendor = await Vendor.update(id, {
              verificationStatus: 'verified',
              isVerified: 1
            });
            results.push({ id, success: true, data: updatedVendor });
            console.log(`✅ تم التحقق من البائع: ${id}`);
          } else {
            results.push({ id, success: false, message: 'البائع غير موجود' });
          }
        } catch (error) {
          results.push({ id, success: false, message: error.message });
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'تم معالجة طلبات التحقق',
        data: results
      });
    }
    
    // إذا لم يتم تمرير أي معرفات صحيحة
    return res.status(400).json({
      success: false,
      message: 'يجب تمرير vendorId (نص) أو vendorIds (مصفوفة)',
      received: {
        vendorId: vendorId,
        vendorIds: vendorIds,
        vendorIdType: typeof vendorId,
        vendorIdsType: typeof vendorIds,
        isVendorIdsArray: Array.isArray(vendorIds)
      },
      example: {
        single: { vendorId: "123" },
        multiple: { vendorIds: ["123", "456"] }
      }
    });
    
  } catch (error) {
    console.error('فشل التحقق العام من البائعين:', error);
    res.status(500).json({
      success: false,
      message: 'فشل التحقق من البائعين',
      error: error.message
    });
  }
};

// التحقق من بائع محدد → POST /vendors/:id/verify
exports.verifyVendor = async (req, res) => {
  try {
    const vendorId = req.params.id;
    
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود'
      });
    }
    
    // تحديث حالة التحقق
    const updatedVendor = await Vendor.update(vendorId, {
      verificationStatus: 'verified',
      isVerified: 1
    });
    
    console.log(`✅ تم التحقق من البائع: ${vendorId}`);
    
    res.status(200).json({
      success: true,
      message: 'تم التحقق من البائع بنجاح',
      data: updatedVendor
    });
  } catch (error) {
    console.error('فشل التحقق من البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل التحقق من البائع',
      error: error.message
    });
  }
};

// التحقق من متجر → PATCH /stores/:id/verify
exports.verifyStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { isVerified = true, verificationStatus = 'verified' } = req.body;
    
    console.log(`🔍 [Store Verify] Processing store verification: ${storeId}`);
    
    // التحقق من وجود المتجر
    const vendor = await Vendor.findById(storeId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }
    
    // تحديث حالة التحقق
    const updatedVendor = await Vendor.update(storeId, {
      verificationStatus: verificationStatus,
      isVerified: isVerified ? 1 : 0,
      verified_at: isVerified ? new Date() : null
    });
    
    console.log(`✅ تم التحقق من المتجر: ${storeId}`);
    
    res.status(200).json({
      success: true,
      message: 'تم التحقق من المتجر بنجاح',
      data: updatedVendor
    });
  } catch (error) {
    console.error('فشل التحقق من المتجر:', error);
    res.status(500).json({
      success: false,
      message: 'فشل التحقق من المتجر',
      error: error.message
    });
  }
};

// اعتماد متجر → PATCH /stores/:id/approve
exports.approveStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { isApproved = true, status = 'approved' } = req.body;
    
    console.log(`🔍 [Store Approve] Processing store approval: ${storeId}`);
    
    // التحقق من وجود المتجر
    const vendor = await Vendor.findById(storeId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }
    
    // تحديث حالة الاعتماد
    const updatedVendor = await Vendor.update(storeId, {
      status: status,
      isApproved: isApproved ? 1 : 0,
      approvedAt: isApproved ? new Date() : null
    });
    
    console.log(`✅ تم اعتماد المتجر: ${storeId}`);
    
    res.status(200).json({
      success: true,
      message: 'تم اعتماد المتجر بنجاح',
      data: updatedVendor
    });
  } catch (error) {
    console.error('فشل اعتماد المتجر:', error);
    res.status(500).json({
      success: false,
      message: 'فشل اعتماد المتجر',
      error: error.message
    });
  }
};

// توثيق متجر → PATCH /stores/:id/certify
exports.certifyStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { isCertified = true, certificationStatus = 'certified' } = req.body;
    
    console.log(`🔍 [Store Certify] Processing store certification: ${storeId}`);
    
    // التحقق من وجود المتجر
    const vendor = await Vendor.findById(storeId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }
    
    // تحديث حالة التوثيق
    const updatedVendor = await Vendor.update(storeId, {
      certificationStatus: certificationStatus,
      isCertified: isCertified ? 1 : 0,
      certifiedAt: isCertified ? new Date() : null
    });
    
    console.log(`✅ تم توثيق المتجر: ${storeId}`);
    
    res.status(200).json({
      success: true,
      message: 'تم توثيق المتجر بنجاح',
      data: updatedVendor
    });
  } catch (error) {
    console.error('فشل توثيق المتجر:', error);
    res.status(500).json({
      success: false,
      message: 'فشل توثيق المتجر',
      error: error.message
    });
  }
};

// حظر/إلغاء حظر تاجر → PATCH /vendors/:id/ban
exports.toggleVendorBan = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const { isBanned } = req.body;
    
    console.log(`🔍 [Vendor Ban] Processing vendor ban toggle: ${vendorId}, isBanned: ${isBanned}`);
    
    // التحقق من وجود البائع
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'البائع غير موجود'
      });
    }
    
    // تحديث حالة الحظر
    const updatedVendor = await Vendor.update(vendorId, {
      isBanned: isBanned ? 1 : 0,
      bannedAt: isBanned ? new Date() : null,
      banReason: isBanned ? req.body.banReason || 'تم الحظر من قبل الإدارة' : null
    });
    
    const action = isBanned ? 'حظر' : 'إلغاء حظر';
    console.log(`✅ تم ${action} البائع: ${vendorId}`);
    
    res.status(200).json({
      success: true,
      message: `تم ${action} البائع بنجاح`,
      data: updatedVendor
    });
  } catch (error) {
    console.error('فشل تغيير حالة حظر البائع:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تغيير حالة حظر البائع',
      error: error.message
    });
  }
};

// حذف متجر → DELETE /stores/:id
exports.deleteStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    
    console.log(`🔍 [Store Delete] Processing store deletion: ${storeId}`);
    
    // التحقق من وجود المتجر
    const vendor = await Vendor.findById(storeId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'المتجر غير موجود'
      });
    }
    
    // حذف المتجر
    const deleted = await Vendor.delete(storeId);
    
    if (deleted) {
      console.log(`✅ تم حذف المتجر: ${storeId}`);
      
      res.status(200).json({
        success: true,
        message: 'تم حذف المتجر بنجاح'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'فشل حذف المتجر'
      });
    }
  } catch (error) {
    console.error('فشل حذف المتجر:', error);
    res.status(500).json({
      success: false,
      message: 'فشل حذف المتجر',
      error: error.message
    });
  }
};

// ==================== المتاجر المميزة ====================

// جلب المتاجر المميزة
exports.getFeaturedStores = async (req, res) => {
  try {
    console.log('🔍 [DEBUG] جلب المتاجر المميزة');
    
    const featuredStores = await Vendor.getFeaturedStores();
    
    res.status(200).json({
      success: true,
      message: 'تم جلب المتاجر المميزة بنجاح',
      data: featuredStores
    });
  } catch (error) {
    console.error('❌ خطأ في جلب المتاجر المميزة:', error);
    res.status(500).json({
      success: false,
      message: 'فشل جلب المتاجر المميزة',
      error: error.message
    });
  }
};

// إضافة متجر مميز
exports.addFeaturedStore = async (req, res) => {
  try {
    const { storeId, priority } = req.body;
    
    console.log('🔍 [DEBUG] إضافة متجر مميز:', { storeId, priority });
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المتجر مطلوب'
      });
    }
    
    const result = await Vendor.addFeaturedStore(storeId, priority);
    
    res.status(201).json({
      success: true,
      message: 'تم إضافة المتجر إلى المتاجر المميزة بنجاح',
      data: result
    });
  } catch (error) {
    console.error('❌ خطأ في إضافة متجر مميز:', error);
    res.status(500).json({
      success: false,
      message: 'فشل إضافة المتجر إلى المتاجر المميزة',
      error: error.message
    });
  }
};

// تحديث متجر مميز
exports.updateFeaturedStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    console.log('🔍 [DEBUG] تحديث متجر مميز:', { id, priority });
    
    const result = await Vendor.updateFeaturedStore(id, { priority });
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث المتجر المميز بنجاح',
      data: result
    });
  } catch (error) {
    console.error('❌ خطأ في تحديث متجر مميز:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحديث المتجر المميز',
      error: error.message
    });
  }
};

// حذف متجر مميز
exports.removeFeaturedStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 [DEBUG] حذف متجر مميز:', { id });
    
    const result = await Vendor.removeFeaturedStore(id);
    
    res.status(200).json({
      success: true,
      message: 'تم حذف المتجر من المتاجر المميزة بنجاح',
      data: result
    });
  } catch (error) {
    console.error('❌ خطأ في حذف متجر مميز:', error);
    res.status(500).json({
      success: false,
      message: 'فشل حذف المتجر من المتاجر المميزة',
      error: error.message
    });
  }
};
