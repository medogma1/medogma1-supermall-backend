-- Fix vendor_settings table schema to match VendorSettings.js model
-- vendor-service/database/fix-vendor-settings-schema.sql

USE supermall;

-- Add missing columns that VendorSettings.js model expects
ALTER TABLE vendor_settings 
ADD COLUMN theme JSON DEFAULT NULL COMMENT 'Theme settings as JSON',
ADD COLUMN layout JSON DEFAULT NULL COMMENT 'Layout settings as JSON',
ADD COLUMN business JSON DEFAULT NULL COMMENT 'Business settings as JSON',
ADD COLUMN seo JSON DEFAULT NULL COMMENT 'SEO settings as JSON',
ADD COLUMN notifications JSON DEFAULT NULL COMMENT 'Notification settings as JSON';

-- Update existing records to have default JSON values
UPDATE vendor_settings 
SET 
  theme = JSON_OBJECT(
    'primaryColor', COALESCE(theme_color, '#3498db'),
    'secondaryColor', '#2ecc71',
    'accentColor', '#e74c3c',
    'fontFamily', 'Roboto',
    'darkMode', false,
    'customCss', COALESCE(custom_css, '')
  ),
  layout = JSON_OBJECT(
    'type', COALESCE(layout_type, 'standard'),
    'sidebar', true,
    'headerStyle', 'modern',
    'footerStyle', 'simple',
    'productGridColumns', 3,
    'showBreadcrumbs', true,
    'showSearchBar', true
  ),
  business = JSON_OBJECT(
    'storeCurrency', 'EGP',
    'taxRate', 14,
    'shippingOptions', JSON_ARRAY(),
    'paymentMethods', JSON_OBJECT(
      'cashOnDelivery', true,
      'creditCard', false,
      'bankTransfer', false,
      'applePay', false,
      'googlePay', false
    ),
    'businessHours', COALESCE(business_hours, JSON_OBJECT()),
    'returnPolicy', '30 days',
    'shippingPolicy', 'Free shipping on orders over 500 EGP'
  ),
  seo = JSON_OBJECT(
    'metaTitle', '',
    'metaDescription', '',
    'metaKeywords', '',
    'ogTitle', '',
    'ogDescription', '',
    'ogImage', '',
    'twitterCard', 'summary_large_image'
  ),
  notifications = JSON_OBJECT(
    'emailNotifications', true,
    'smsNotifications', false,
    'pushNotifications', true,
    'orderUpdates', true,
    'promotionalEmails', false,
    'weeklyReports', true
  )
WHERE theme IS NULL OR layout IS NULL OR business IS NULL OR seo IS NULL OR notifications IS NULL;

-- Show updated table structure
DESCRIBE vendor_settings;