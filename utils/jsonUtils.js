/**
 * مساعدات JSON للتعامل مع تحليل البيانات بشكل آمن
 * JSON utilities for safe data parsing
 */

/**
 * تحليل حقل JSON بشكل آمن مع معالجة الأخطاء
 * Safely parse JSON field with error handling
 * @param {any} field - الحقل المراد تحليله
 * @param {any} defaultValue - القيمة الافتراضية في حالة الفشل
 * @returns {any} البيانات المحللة أو القيمة الافتراضية
 */
function parseJsonField(field, defaultValue = null) {
  try {
    if (field === null || field === undefined) {
      return defaultValue;
    }
    
    // إذا كان الحقل نص، حاول تحليله
    if (typeof field === 'string') {
      // تجاهل النصوص الفارغة
      if (field.trim() === '') {
        return defaultValue;
      }
      return JSON.parse(field);
    }
    
    // إذا كان الحقل كائن بالفعل، أرجعه كما هو
    if (typeof field === 'object') {
      return field;
    }
    
    // في الحالات الأخرى، أرجع القيمة الافتراضية
    return defaultValue;
  } catch (error) {
    console.error('خطأ في تحليل البيانات JSON:', {
      field: typeof field === 'string' ? field.substring(0, 100) : field,
      error: error.message
    });
    return defaultValue;
  }
}

/**
 * تحويل البيانات إلى JSON string بشكل آمن
 * Safely stringify data to JSON
 * @param {any} data - البيانات المراد تحويلها
 * @param {string} defaultValue - القيمة الافتراضية في حالة الفشل
 * @returns {string} النص JSON أو القيمة الافتراضية
 */
function safeStringify(data, defaultValue = '{}') {
  try {
    if (data === null || data === undefined) {
      return defaultValue;
    }
    return JSON.stringify(data);
  } catch (error) {
    console.error('خطأ في تحويل البيانات إلى JSON:', error.message);
    return defaultValue;
  }
}

/**
 * التحقق من صحة JSON string
 * Validate JSON string
 * @param {string} jsonString - النص JSON المراد التحقق منه
 * @returns {boolean} true إذا كان صحيحاً، false إذا لم يكن
 */
function isValidJson(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * دمج كائنات JSON بشكل آمن
 * Safely merge JSON objects
 * @param {object} target - الكائن الهدف
 * @param {object} source - الكائن المصدر
 * @returns {object} الكائن المدموج
 */
function mergeJsonObjects(target, source) {
  try {
    return { ...target, ...source };
  } catch (error) {
    console.error('خطأ في دمج كائنات JSON:', error.message);
    return target || {};
  }
}

module.exports = {
  parseJsonField,
  safeStringify,
  isValidJson,
  mergeJsonObjects
};