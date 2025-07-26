-- Update vendor_settings with default JSON values
-- vendor-service/database/update-vendor-settings-data.sql

USE supermall;

-- Update layout column
UPDATE vendor_settings 
SET layout = '{"type": "standard", "sidebar": true, "headerStyle": "modern", "footerStyle": "simple", "productGridColumns": 3, "showBreadcrumbs": true, "showSearchBar": true}' 
WHERE layout IS NULL;

-- Update business column
UPDATE vendor_settings 
SET business = '{"storeCurrency": "EGP", "taxRate": 14, "shippingOptions": [], "paymentMethods": {"cashOnDelivery": true, "creditCard": false, "bankTransfer": false, "applePay": false, "googlePay": false}, "returnPolicy": "30 days", "shippingPolicy": "Free shipping on orders over 500 EGP"}' 
WHERE business IS NULL;

-- Update seo column
UPDATE vendor_settings 
SET seo = '{"metaTitle": "", "metaDescription": "", "metaKeywords": "", "ogTitle": "", "ogDescription": "", "ogImage": "", "twitterCard": "summary_large_image"}' 
WHERE seo IS NULL;

-- Update notifications column
UPDATE vendor_settings 
SET notifications = '{"emailNotifications": true, "smsNotifications": false, "pushNotifications": true, "orderUpdates": true, "promotionalEmails": false, "weeklyReports": true}' 
WHERE notifications IS NULL;

-- Show updated records
SELECT vendor_id, 
       CASE WHEN theme IS NOT NULL THEN 'SET' ELSE 'NULL' END as theme_status,
       CASE WHEN layout IS NOT NULL THEN 'SET' ELSE 'NULL' END as layout_status,
       CASE WHEN business IS NOT NULL THEN 'SET' ELSE 'NULL' END as business_status,
       CASE WHEN seo IS NOT NULL THEN 'SET' ELSE 'NULL' END as seo_status,
       CASE WHEN notifications IS NOT NULL THEN 'SET' ELSE 'NULL' END as notifications_status
FROM vendor_settings;