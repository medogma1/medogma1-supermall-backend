const db = require('../config/database');

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

/**
 * VendorSettings class for managing vendor store settings
 */
class VendorSettings {
  constructor(data) {
    this.id = data.id;
    this.vendor_id = data.vendor_id;
    this.theme = data.theme || this._getDefaultTheme();
    this.layout = data.layout || this._getDefaultLayout();
    this.business = data.business || this._getDefaultBusiness();
    this.seo = data.seo || this._getDefaultSeo();
    this.social_media = data.social_media || this._getDefaultSocialMedia();
    this.notifications = data.notifications || this._getDefaultNotifications();
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Convert database row to VendorSettings instance
   * @param {Object} row - Database row
   * @returns {VendorSettings} - VendorSettings instance
   */
  static fromDatabaseRow(row) {
    if (!row) return null;
    
    // Helper function to safely parse JSON
    const safeJsonParse = (jsonString) => {
      if (!jsonString) return null;
      try {
        // If it's already an object, return it
        if (typeof jsonString === 'object') return jsonString;
        // If it's a string, try to parse it
        return JSON.parse(jsonString);
      } catch (error) {
        console.warn('Failed to parse JSON:', jsonString, error.message);
        return null;
      }
    };
    
    return new VendorSettings({
      id: row.id,
      vendor_id: row.vendor_id,
      theme: safeJsonParse(row.theme),
      layout: safeJsonParse(row.layout),
      business: safeJsonParse(row.business),
      seo: safeJsonParse(row.seo),
      social_media: safeJsonParse(row.social_media),
      notifications: safeJsonParse(row.notifications),
      created_at: row.created_at,
      updated_at: row.updated_at
    });
  }

  /**
   * Convert VendorSettings instance to database row
   * @returns {Object} - Database row
   */
  toDatabaseRow() {
    return {
      vendor_id: this.vendor_id,
      theme: JSON.stringify(this.theme),
      layout: JSON.stringify(this.layout),
      business: JSON.stringify(this.business),
      seo: JSON.stringify(this.seo),
      social_media: JSON.stringify(this.social_media),
      notifications: JSON.stringify(this.notifications)
    };
  }

  /**
   * Get default theme settings
   * @returns {Object} - Default theme settings
   */
  _getDefaultTheme() {
    return {
      primaryColor: '#3498db',
      secondaryColor: '#2ecc71',
      accentColor: '#e74c3c',
      fontFamily: 'Roboto',
      darkMode: false,
      customCss: ''
    };
  }

  /**
   * Get default layout settings
   * @returns {Object} - Default layout settings
   */
  _getDefaultLayout() {
    return {
      productListLayout: LAYOUT_TYPES.GRID,
      productsPerPage: 12,
      showFilters: true,
      showSortOptions: true,
      enableQuickView: true
    };
  }

  /**
   * Get default business settings
   * @returns {Object} - Default business settings
   */
  _getDefaultBusiness() {
    return {
      storeName: '',
      storeDescription: '',
      contactEmail: '',
      contactPhone: '',
      storeAddress: '',
      storeLogoUrl: '',
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
    };
  }

  /**
   * Get default SEO settings
   * @returns {Object} - Default SEO settings
   */
  _getDefaultSeo() {
    return {
      metaTitle: '',
      metaDescription: '',
      keywords: [],
      googleAnalyticsId: '',
      facebookPixelId: ''
    };
  }

  /**
   * Get default social media settings
   * @returns {Object} - Default social media settings
   */
  _getDefaultSocialMedia() {
    return {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      linkedin: '',
      pinterest: ''
    };
  }

  /**
   * Get default notification settings
   * @returns {Object} - Default notification settings
   */
  _getDefaultNotifications() {
    return {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      orderUpdates: true,
      promotionalEmails: true,
      lowStockAlerts: true
    };
  }

  /**
   * Get default shipping option
   * @returns {Object|null} - Default shipping option or null
   */
  getDefaultShippingOption() {
    const defaultOption = this.business.shippingOptions.find(option => option.isDefault);
    return defaultOption || (this.business.shippingOptions.length > 0 ? this.business.shippingOptions[0] : null);
  }

  /**
   * Check if payment method is enabled
   * @param {string} method - Payment method name
   * @returns {boolean} - Whether payment method is enabled
   */
  hasPaymentMethod(method) {
    return this.business.paymentMethods[method] === true;
  }

  /**
   * Get all enabled payment methods
   * @returns {Array} - Array of enabled payment methods
   */
  getEnabledPaymentMethods() {
    const methods = [];
    const paymentMethods = this.business.paymentMethods;
    
    for (const [key, enabled] of Object.entries(paymentMethods)) {
      if (enabled) {
        methods.push(key);
      }
    }
    
    return methods;
  }

  /**
   * Get theme colors
   * @returns {Object} - Theme colors
   */
  getThemeColors() {
    return {
      primary: this.theme.primaryColor,
      secondary: this.theme.secondaryColor,
      accent: this.theme.accentColor
    };
  }

  /**
   * Create new vendor settings
   * @param {Object} data - Vendor settings data
   * @returns {Promise<VendorSettings>} - Created vendor settings
   */
  static async create(data) {
    const settings = new VendorSettings(data);
    const row = settings.toDatabaseRow();
    
    try {
      // تحويل قيم undefined إلى null
      const values = [row.vendor_id, row.theme, row.layout, row.business, row.seo, row.social_media, row.notifications];
      const cleanValues = values.map(value => value === undefined ? null : value);
      
      const [result] = await db.execute(
        'INSERT INTO vendor_settings (vendor_id, theme, layout, business, seo, social_media, notifications) VALUES (?, ?, ?, ?, ?, ?, ?)',
        cleanValues
      );
      
      settings.id = result.insertId;
      return settings;
    } catch (error) {
      console.error('Error creating vendor settings:', error);
      throw error;
    }
  }

  /**
   * Find vendor settings by vendor ID
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<VendorSettings|null>} - Found vendor settings or null
   */
  static async findByVendorId(vendorId) {
    try {
      const [rows] = await db.execute('SELECT * FROM vendor_settings WHERE vendor_id = ?', [vendorId]);
      return rows.length ? VendorSettings.fromDatabaseRow(rows[0]) : null;
    } catch (error) {
      console.error('Error finding vendor settings:', error);
      throw error;
    }
  }

  /**
   * Update vendor settings
   * @param {string} vendorId - Vendor ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<VendorSettings|null>} - Updated vendor settings or null
   */
  static async update(vendorId, updateData) {
    try {
      // First get the current settings
      const currentSettings = await VendorSettings.findByVendorId(vendorId);
      if (!currentSettings) return null;
      
      // Merge the update data with current settings
      const updatedSettings = new VendorSettings({
        ...currentSettings,
        ...updateData,
        // Merge nested objects if they exist in the update data
        theme: updateData.theme ? { ...currentSettings.theme, ...updateData.theme } : currentSettings.theme,
        layout: updateData.layout ? { ...currentSettings.layout, ...updateData.layout } : currentSettings.layout,
        business: updateData.business ? { ...currentSettings.business, ...updateData.business } : currentSettings.business,
        seo: updateData.seo ? { ...currentSettings.seo, ...updateData.seo } : currentSettings.seo,
        social_media: updateData.social_media ? { ...currentSettings.social_media, ...updateData.social_media } : currentSettings.social_media,
        notifications: updateData.notifications ? { ...currentSettings.notifications, ...updateData.notifications } : currentSettings.notifications
      });
      
      const row = updatedSettings.toDatabaseRow();
      
      // تحويل قيم undefined إلى null
      const values = [row.theme, row.layout, row.business, row.seo, row.social_media, row.notifications, vendorId];
      const cleanValues = values.map(value => value === undefined ? null : value);
      
      await db.execute(
        'UPDATE vendor_settings SET theme = ?, layout = ?, business = ?, seo = ?, social_media = ?, notifications = ? WHERE vendor_id = ?',
        cleanValues
      );
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating vendor settings:', error);
      throw error;
    }
  }

  /**
   * Delete vendor settings
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<boolean>} - Whether deletion was successful
   */
  static async delete(vendorId) {
    try {
      const [result] = await db.execute('DELETE FROM vendor_settings WHERE vendor_id = ?', [vendorId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting vendor settings:', error);
      throw error;
    }
  }

  /**
   * Get or create vendor settings
   * @param {string} vendorId - Vendor ID
   * @returns {Promise<VendorSettings>} - Vendor settings
   */
  static async getOrCreate(vendorId) {
    try {
      let settings = await VendorSettings.findByVendorId(vendorId);
      
      if (!settings) {
        settings = await VendorSettings.create({ vendor_id: vendorId });
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting or creating vendor settings:', error);
      throw error;
    }
  }
}

module.exports = {
  VendorSettings,
  constants: {
    THEME_COLORS,
    LAYOUT_TYPES,
    CURRENCY_OPTIONS
  }
};