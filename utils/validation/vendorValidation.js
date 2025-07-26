// Enhanced Vendor Data Validation with Arabic error messages
const Joi = require('joi');

/**
 * Custom Validation Error Class
 */
class ValidationError extends Error {
  constructor(message, details = null, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = 'VALIDATION_FAILED';
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.name = 'ValidationError';
  }
}

/**
 * Custom Joi validation messages in Arabic
 */
const arabicMessages = {
  'any.required': 'هذا الحقل مطلوب',
  'any.empty': 'هذا الحقل لا يمكن أن يكون فارغاً',
  'string.base': 'يجب أن يكون هذا الحقل نصاً',
  'string.empty': 'هذا الحقل لا يمكن أن يكون فارغاً',
  'string.min': 'يجب أن يحتوي هذا الحقل على {{#limit}} حرف على الأقل',
  'string.max': 'يجب ألا يتجاوز هذا الحقل {{#limit}} حرف',
  'string.email': 'يجب أن يكون البريد الإلكتروني صحيحاً',
  'string.uri': 'يجب أن يكون الرابط صحيحاً',
  'string.pattern.base': 'تنسيق هذا الحقل غير صحيح',
  'number.base': 'يجب أن يكون هذا الحقل رقماً',
  'number.min': 'يجب أن يكون هذا الرقم {{#limit}} على الأقل',
  'number.max': 'يجب ألا يتجاوز هذا الرقم {{#limit}}',
  'boolean.base': 'يجب أن يكون هذا الحقل صحيح أو خطأ',
  'object.base': 'يجب أن يكون هذا الحقل كائناً',
  'array.base': 'يجب أن يكون هذا الحقل مصفوفة'
};

/**
 * Phone number validation for Saudi Arabia
 */
const saudiPhonePattern = /^(\+966|966|0)?[5][0-9]{8}$/;
const internationalPhonePattern = /^\+[1-9]\d{1,14}$/;

/**
 * Business hours validation schema
 */
const businessHoursSchema = Joi.object().pattern(
  Joi.string().valid('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'),
  Joi.object({
    open: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'وقت الفتح يجب أن يكون بتنسيق HH:MM (مثال: 09:00)',
        'any.required': 'وقت الفتح مطلوب'
      }),
    close: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .required()
      .messages({
        'string.pattern.base': 'وقت الإغلاق يجب أن يكون بتنسيق HH:MM (مثال: 18:00)',
        'any.required': 'وقت الإغلاق مطلوب'
      }),
    isOpen: Joi.boolean().default(true).messages({
      'boolean.base': 'حالة المتجر يجب أن تكون مفتوح أو مغلق'
    })
  })
).messages({
  'object.base': 'ساعات العمل يجب أن تكون كائناً صحيحاً'
});

/**
 * Social media validation schema
 */
const socialMediaSchema = Joi.object({
  instagram: Joi.string()
    .pattern(/^@?[a-zA-Z0-9._]{1,30}$/)
    .optional()
    .messages({
      'string.pattern.base': 'اسم المستخدم في إنستغرام غير صحيح (يجب أن يحتوي على أحرف وأرقام فقط)'
    }),
  twitter: Joi.string()
    .pattern(/^@?[a-zA-Z0-9_]{1,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'اسم المستخدم في تويتر غير صحيح (يجب أن يحتوي على أحرف وأرقام فقط)'
    }),
  facebook: Joi.string()
    .pattern(/^[a-zA-Z0-9.]{5,50}$/)
    .optional()
    .messages({
      'string.pattern.base': 'اسم المستخدم في فيسبوك غير صحيح'
    }),
  website: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'رابط الموقع الإلكتروني غير صحيح'
    })
}).optional();

/**
 * Delivery settings validation schema
 */
const deliverySettingsSchema = Joi.object({
  deliveryFee: Joi.number()
    .min(0)
    .max(1000)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'رسوم التوصيل لا يمكن أن تكون أقل من 0',
      'number.max': 'رسوم التوصيل لا يمكن أن تتجاوز 1000 ريال',
      'number.base': 'رسوم التوصيل يجب أن تكون رقماً'
    }),
  freeDeliveryThreshold: Joi.number()
    .min(0)
    .max(10000)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'حد التوصيل المجاني لا يمكن أن يكون أقل من 0',
      'number.max': 'حد التوصيل المجاني لا يمكن أن يتجاوز 10000 ريال',
      'number.base': 'حد التوصيل المجاني يجب أن يكون رقماً'
    }),
  estimatedDeliveryTime: Joi.string()
    .min(5)
    .max(100)
    .optional()
    .messages({
      'string.min': 'وقت التوصيل المتوقع يجب أن يحتوي على 5 أحرف على الأقل',
      'string.max': 'وقت التوصيل المتوقع لا يمكن أن يتجاوز 100 حرف'
    }),
  deliveryAreas: Joi.array()
    .items(Joi.string().min(2).max(50))
    .optional()
    .messages({
      'array.base': 'مناطق التوصيل يجب أن تكون مصفوفة',
      'string.min': 'اسم المنطقة يجب أن يحتوي على حرفين على الأقل',
      'string.max': 'اسم المنطقة لا يمكن أن يتجاوز 50 حرف'
    })
}).optional();

/**
 * Main vendor settings validation schema
 */
const vendorSettingsSchema = Joi.object({
  // Basic store information
  storeName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'اسم المتجر مطلوب',
      'string.min': 'اسم المتجر يجب أن يحتوي على حرفين على الأقل',
      'string.max': 'اسم المتجر لا يمكن أن يتجاوز 100 حرف',
      'any.required': 'اسم المتجر مطلوب'
    }),
  
  storeDescription: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'وصف المتجر مطلوب',
      'string.min': 'وصف المتجر يجب أن يحتوي على 10 أحرف على الأقل',
      'string.max': 'وصف المتجر لا يمكن أن يتجاوز 1000 حرف',
      'any.required': 'وصف المتجر مطلوب'
    }),
  
  storeLogoUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.empty': 'رابط شعار المتجر مطلوب',
      'string.uri': 'رابط شعار المتجر غير صحيح',
      'any.required': 'رابط شعار المتجر مطلوب'
    }),
  
  // Contact information
  contactEmail: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'البريد الإلكتروني مطلوب',
      'string.email': 'البريد الإلكتروني غير صحيح',
      'any.required': 'البريد الإلكتروني مطلوب'
    }),
  
  contactPhone: Joi.string()
    .pattern(saudiPhonePattern)
    .required()
    .messages({
      'string.empty': 'رقم الهاتف مطلوب',
      'string.pattern.base': 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 05 ويتبعه 8 أرقام)',
      'any.required': 'رقم الهاتف مطلوب'
    }),
  
  storeAddress: Joi.string()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.empty': 'عنوان المتجر مطلوب',
      'string.min': 'عنوان المتجر يجب أن يحتوي على 10 أحرف على الأقل',
      'string.max': 'عنوان المتجر لا يمكن أن يتجاوز 200 حرف',
      'any.required': 'عنوان المتجر مطلوب'
    }),
  
  // Optional fields
  businessHours: businessHoursSchema,
  socialMedia: socialMediaSchema,
  deliverySettings: deliverySettingsSchema,
  
  // Store settings
  isActive: Joi.boolean().optional().messages({
    'boolean.base': 'حالة المتجر يجب أن تكون نشط أو غير نشط'
  }),
  
  allowReviews: Joi.boolean().optional().messages({
    'boolean.base': 'السماح بالتقييمات يجب أن يكون نعم أو لا'
  }),
  
  minimumOrderAmount: Joi.number()
    .min(0)
    .max(10000)
    .precision(2)
    .optional()
    .messages({
      'number.min': 'الحد الأدنى للطلب لا يمكن أن يكون أقل من 0',
      'number.max': 'الحد الأدنى للطلب لا يمكن أن يتجاوز 10000 ريال',
      'number.base': 'الحد الأدنى للطلب يجب أن يكون رقماً'
    }),
  
  // SEO settings
  metaTitle: Joi.string()
    .max(60)
    .optional()
    .messages({
      'string.max': 'عنوان الصفحة لا يمكن أن يتجاوز 60 حرف'
    }),
  
  metaDescription: Joi.string()
    .max(160)
    .optional()
    .messages({
      'string.max': 'وصف الصفحة لا يمكن أن يتجاوز 160 حرف'
    }),
  
  keywords: Joi.array()
    .items(Joi.string().min(2).max(30))
    .max(10)
    .optional()
    .messages({
      'array.base': 'الكلمات المفتاحية يجب أن تكون مصفوفة',
      'array.max': 'لا يمكن إضافة أكثر من 10 كلمات مفتاحية',
      'string.min': 'الكلمة المفتاحية يجب أن تحتوي على حرفين على الأقل',
      'string.max': 'الكلمة المفتاحية لا يمكن أن تتجاوز 30 حرف'
    })
});

/**
 * Vendor basic information validation schema
 */
const vendorBasicSchema = Joi.object({
  businessName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'اسم النشاط التجاري مطلوب',
      'string.min': 'اسم النشاط التجاري يجب أن يحتوي على حرفين على الأقل',
      'string.max': 'اسم النشاط التجاري لا يمكن أن يتجاوز 100 حرف',
      'any.required': 'اسم النشاط التجاري مطلوب'
    }),
  
  businessType: Joi.string()
    .valid('retail', 'wholesale', 'service', 'restaurant', 'other')
    .required()
    .messages({
      'any.only': 'نوع النشاط التجاري يجب أن يكون أحد القيم المحددة',
      'any.required': 'نوع النشاط التجاري مطلوب'
    }),
  
  commercialRegister: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'رقم السجل التجاري يجب أن يحتوي على 10 أرقام',
      'any.required': 'رقم السجل التجاري مطلوب'
    }),
  
  taxNumber: Joi.string()
    .pattern(/^[0-9]{15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'الرقم الضريبي يجب أن يحتوي على 15 رقم'
    })
});

/**
 * Validation functions
 */
const validateVendorSettings = (data) => {
  const { error, value } = vendorSettingsSchema.validate(data, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
    messages: arabicMessages
  });
  
  if (error) {
    const details = {};
    error.details.forEach(detail => {
      const field = detail.path.join('.');
      details[field] = detail.message;
    });
    
    throw new ValidationError('بيانات غير صحيحة', details);
  }
  
  return value;
};

const validateVendorBasic = (data) => {
  const { error, value } = vendorBasicSchema.validate(data, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
    messages: arabicMessages
  });
  
  if (error) {
    const details = {};
    error.details.forEach(detail => {
      const field = detail.path.join('.');
      details[field] = detail.message;
    });
    
    throw new ValidationError('بيانات البائع غير صحيحة', details);
  }
  
  return value;
};

/**
 * Custom validation helpers
 */
const validationHelpers = {
  /**
   * Validate Saudi phone number
   */
  validateSaudiPhone: (phone) => {
    if (!phone) return false;
    return saudiPhonePattern.test(phone);
  },
  
  /**
   * Validate business hours
   */
  validateBusinessHours: (hours) => {
    if (!hours || typeof hours !== 'object') return true; // Optional field
    
    for (const [day, schedule] of Object.entries(hours)) {
      if (!['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(day)) {
        throw new ValidationError(`يوم غير صحيح: ${day}`);
      }
      
      if (schedule.open && schedule.close) {
        const openTime = new Date(`2000-01-01T${schedule.open}:00`);
        const closeTime = new Date(`2000-01-01T${schedule.close}:00`);
        
        if (openTime >= closeTime) {
          throw new ValidationError(`وقت الإغلاق يجب أن يكون بعد وقت الفتح في يوم ${day}`);
        }
      }
    }
    
    return true;
  },
  
  /**
   * Validate URL format
   */
  validateUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

module.exports = {
  validateVendorSettings,
  validateVendorBasic,
  validationHelpers,
  ValidationError,
  vendorSettingsSchema,
  vendorBasicSchema
};