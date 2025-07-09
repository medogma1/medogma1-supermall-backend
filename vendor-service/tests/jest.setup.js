/**
 * ملف إعداد Jest
 * يتم تنفيذ هذا الملف قبل تشغيل اختبارات Jest
 */

// تعيين متغيرات البيئة للاختبارات
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'supermall_test';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.PORT = process.env.PORT || '3000';

// إضافة توقعات مخصصة لـ Jest إذا لزم الأمر
expect.extend({
  // مثال على توقع مخصص
  toBeValidVendor: (received) => {
    const pass = (
      received &&
      typeof received === 'object' &&
      typeof received.id === 'number' &&
      typeof received.name === 'string' &&
      typeof received.email === 'string' &&
      typeof received.phone === 'string' &&
      typeof received.user_id === 'number' &&
      typeof received.business_type === 'string'
    );
    
    if (pass) {
      return {
        message: () => `توقع أن لا يكون ${received} بائعًا صالحًا`,
        pass: true
      };
    } else {
      return {
        message: () => `توقع أن يكون ${received} بائعًا صالحًا`,
        pass: false
      };
    }
  }
});

// تعطيل سجلات وحدة التحكم أثناء الاختبارات
// يمكن إزالة هذا التعليق إذا كنت تريد رؤية سجلات وحدة التحكم أثناء الاختبارات
/*
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = jest.fn();
*/

// تنظيف المحاكاة بعد كل اختبار
afterEach(() => {
  jest.clearAllMocks();
});