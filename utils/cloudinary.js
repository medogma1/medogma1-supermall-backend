const cloudinary = require('cloudinary').v2;
const config = require('./config');

// تكوين Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

/**
 * رفع صورة إلى Cloudinary
 * @param {string} filePath - مسار الملف المحلي
 * @param {object} options - خيارات إضافية للرفع
 * @returns {Promise<object>} - نتيجة الرفع
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'supermall', // مجلد افتراضي
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    const result = await cloudinary.uploader.upload(filePath, uploadOptions);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('خطأ في رفع الصورة إلى Cloudinary:', error);
    throw new Error(`فشل في رفع الصورة: ${error.message}`);
  }
};

/**
 * رفع صورة من buffer
 * @param {Buffer} buffer - بيانات الصورة
 * @param {object} options - خيارات إضافية للرفع
 * @returns {Promise<object>} - نتيجة الرفع
 */
const uploadImageFromBuffer = async (buffer, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'supermall',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto'
    };

    const uploadOptions = { ...defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('خطأ في رفع الصورة من buffer:', error);
            reject(new Error(`فشل في رفع الصورة: ${error.message}`));
          } else {
            resolve({
              success: true,
              url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              bytes: result.bytes
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('خطأ في رفع الصورة من buffer:', error);
    throw new Error(`فشل في رفع الصورة: ${error.message}`);
  }
};

/**
 * حذف صورة من Cloudinary
 * @param {string} publicId - معرف الصورة العام
 * @returns {Promise<object>} - نتيجة الحذف
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('خطأ في حذف الصورة من Cloudinary:', error);
    throw new Error(`فشل في حذف الصورة: ${error.message}`);
  }
};

/**
 * إنشاء رابط محسن للصورة
 * @param {string} publicId - معرف الصورة العام
 * @param {object} transformations - تحويلات الصورة
 * @returns {string} - رابط الصورة المحسن
 */
const getOptimizedUrl = (publicId, transformations = {}) => {
  const defaultTransformations = {
    fetch_format: 'auto',
    quality: 'auto'
  };

  const finalTransformations = { ...defaultTransformations, ...transformations };
  
  return cloudinary.url(publicId, finalTransformations);
};

/**
 * إنشاء رابط صورة مربعة (للصور المصغرة)
 * @param {string} publicId - معرف الصورة العام
 * @param {number} size - حجم الصورة المربعة
 * @returns {string} - رابط الصورة المربعة
 */
const getSquareUrl = (publicId, size = 300) => {
  return cloudinary.url(publicId, {
    crop: 'fill',
    gravity: 'auto',
    width: size,
    height: size,
    fetch_format: 'auto',
    quality: 'auto'
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadImageFromBuffer,
  deleteImage,
  getOptimizedUrl,
  getSquareUrl
};