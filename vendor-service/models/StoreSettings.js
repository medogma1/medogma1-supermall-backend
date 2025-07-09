const mongoose = require('mongoose');

// Constants
const THEME_COLORS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  ACCENT: 'accent',
  NEUTRAL: 'neutral',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

const LAYOUT_TYPES = {
  GRID: 'grid',
  LIST: 'list',
  MASONRY: 'masonry'
};

const CURRENCY_OPTIONS = ['EGP', 'USD', 'EUR', 'GBP'];

// Store Settings Schema
const storeSettingsSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: [true, 'Vendor ID is required'],
    unique: true
  },
  // Theme settings
  theme: {
    primaryColor: {
      type: String,
      default: '#3498db'
    },
    secondaryColor: {
      type: String,
      default: '#2ecc71'
    },
    accentColor: {
      type: String,
      default: '#e74c3c'
    },
    fontFamily: {
      type: String,
      default: 'Roboto'
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    customCss: {
      type: String,
      default: ''
    }
  },
  // Layout settings
  layout: {
    productListLayout: {
      type: String,
      enum: Object.values(LAYOUT_TYPES),
      default: LAYOUT_TYPES.GRID
    },
    productsPerPage: {
      type: Number,
      default: 12,
      min: 4,
      max: 48
    },
    showFilters: {
      type: Boolean,
      default: true
    },
    showSortOptions: {
      type: Boolean,
      default: true
    },
    enableQuickView: {
      type: Boolean,
      default: true
    }
  },
  // Business settings
  business: {
    storeCurrency: {
      type: String,
      enum: CURRENCY_OPTIONS,
      default: 'EGP'
    },
    taxRate: {
      type: Number,
      default: 14,
      min: 0,
      max: 100
    },
    shippingOptions: [{
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      estimatedDays: { type: Number, required: true, min: 0 },
      isDefault: { type: Boolean, default: false }
    }],
    paymentMethods: {
      cashOnDelivery: { type: Boolean, default: true },
      creditCard: { type: Boolean, default: false },
      bankTransfer: { type: Boolean, default: false },
      applePay: { type: Boolean, default: false },
      googlePay: { type: Boolean, default: false }
    },
    returnPolicy: {
      type: String,
      default: ''
    },
    privacyPolicy: {
      type: String,
      default: ''
    },
    termsAndConditions: {
      type: String,
      default: ''
    }
  },
  // SEO settings
  seo: {
    metaTitle: {
      type: String,
      default: ''
    },
    metaDescription: {
      type: String,
      default: ''
    },
    keywords: [{
      type: String
    }],
    googleAnalyticsId: {
      type: String,
      default: ''
    },
    facebookPixelId: {
      type: String,
      default: ''
    }
  },
  // Social media links
  socialMedia: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    pinterest: { type: String, default: '' }
  },
  // Notification settings
  notifications: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    pushNotifications: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    promotionalEmails: { type: Boolean, default: true },
    lowStockAlerts: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Helper methods
storeSettingsSchema.methods.getDefaultShippingOption = function() {
  const defaultOption = this.business.shippingOptions.find(option => option.isDefault);
  return defaultOption || (this.business.shippingOptions.length > 0 ? this.business.shippingOptions[0] : null);
};

storeSettingsSchema.methods.hasPaymentMethod = function(method) {
  return this.business.paymentMethods[method] === true;
};

storeSettingsSchema.methods.getEnabledPaymentMethods = function() {
  const methods = [];
  const paymentMethods = this.business.paymentMethods;
  
  for (const [key, enabled] of Object.entries(paymentMethods)) {
    if (enabled) {
      methods.push(key);
    }
  }
  
  return methods;
};

storeSettingsSchema.methods.getThemeColors = function() {
  return {
    primary: this.theme.primaryColor,
    secondary: this.theme.secondaryColor,
    accent: this.theme.accentColor
  };
};

// Create model
const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);

module.exports = {
  StoreSettings,
  constants: {
    THEME_COLORS,
    LAYOUT_TYPES,
    CURRENCY_OPTIONS
  }
};