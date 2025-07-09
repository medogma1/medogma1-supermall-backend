const { Vendor } = require('../models/Vendor');
const { VendorSettings } = require('../models/VendorSettings');
const logger = require('../logger');

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
    logger.info('Received vendor creation request with data:', JSON.stringify(req.body, null, 2));
    logger.info('Request headers:', JSON.stringify(req.headers, null, 2));
    
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

    logger.info('Extracted vendor data:', { name, email, phone, country, governorate, nationalId, user_id, business_type });

    if (!name || !email || !phone || !user_id || !business_type) {
      logger.error('Missing required fields');
      return res.status(400).json({ message: 'All fields are required', details: 'name, email, phone, user_id, and business_type are required' });
    }

    // التحقق من وجود البريد الإلكتروني مسبقًا
    const existingVendor = await Vendor.findByEmail(email);
    if (existingVendor) {
      logger.error('Email already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    // التحقق من عدم وجود user_id مكرر
    const existingVendorByUserId = await Vendor.findByUserId(user_id);
    if (existingVendorByUserId) {
      logger.error('User already has a vendor account:', user_id);
      return res.status(400).json({ message: 'User already has a vendor account' });
    }

    // تحويل القيم الفارغة إلى سلاسل نصية فارغة لتجنب مشاكل التحقق من الصحة
    const vendorData = {
      name,
      email,
      phone,
      user_id: typeof user_id === 'string' ? parseInt(user_id, 10) : user_id,
      business_type,
      store_name: storeName || '',
      store_description: storeDescription || '',
      store_logo_url: storeLogoUrl || '',
      contact_email: contactEmail || '',
      contact_phone: contactPhone || '',
      store_address: storeAddress || '',
      country: country || '',
      governorate: governorate || '',
      national_id: nationalId || '',
      is_active: true,
      store_settings_completed: false
    };

    // التأكد من أن user_id هو رقم صحيح
    if (isNaN(vendorData.user_id)) {
      logger.error('user_id must be a valid number');
      return res.status(400).json({ message: 'user_id must be a valid number' });
    }

    logger.info('Creating vendor with data:', vendorData);
    
    // التحقق من صحة البيانات
    if (!Vendor.validateVendorData(vendorData)) {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: 'Invalid vendor data',
        details: Vendor.getValidationErrors(vendorData) 
      });
    }

    // إنشاء البائع الجديد
    const newVendor = await Vendor.create(vendorData);
    logger.info('Vendor created successfully with ID:', newVendor.id);
    res.status(201).json({ message: 'Vendor created successfully', vendor: newVendor });
  } catch (error) {
    logger.error('Error creating vendor:', error);
    // تحسين رسالة الخطأ لتكون أكثر تفصيلاً
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error creating vendor', 
      error: errorMessage,
      details: error.details || null
    });
  }
};

// إعدادات المتجر → PUT /vendors/:vendorId/settings
exports.updateStoreSettings = async (req, res) => {
  try {
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
    
    // استخدام logoUrl إذا كان storeLogoUrl غير موجود
    const finalLogoUrl = storeLogoUrl || logoUrl;

    if (!storeName || !storeDescription || !finalLogoUrl || !contactEmail || !contactPhone || !storeAddress) {
      return res.status(400).json({ message: 'All fields are required for store settings' });
    }

    // التحقق من وجود البائع
    const existingVendor = await Vendor.findById(vendorId);
    if (!existingVendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // تحديث بيانات المتجر في نموذج Vendor
    const updatedVendor = await Vendor.update(vendorId, {
      store_name: storeName,
      store_description: storeDescription,
      store_logo_url: finalLogoUrl,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      store_address: storeAddress,
      store_settings_completed: true // تحديث حالة إكمال الإعدادات
    });

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
    logger.error('Error updating store settings:', error);
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
    logger.error('Error fetching vendor:', error);
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
    logger.error('Error fetching vendor by email:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error fetching vendor by email', 
      error: errorMessage,
      details: error.details || null
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
    logger.error('Error updating vendor:', error);
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
    logger.error('Error deleting vendor:', error);
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
    const { vendorId } = req.params;
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
    logger.error('Error fetching store settings:', error);
    const errorMessage = error.message || 'Unknown error';
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ 
      message: 'Error fetching store settings', 
      error: errorMessage,
      details: error.details || null
    });
  }
};
