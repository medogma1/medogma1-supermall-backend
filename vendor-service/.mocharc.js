/**
 * تكوين Mocha لاختبارات وحدة البائعين
 */

module.exports = {
  // أنماط الملفات التي سيتم اعتبارها اختبارات
  spec: [
    'tests/**/*.test.js',
    'tests/controllers.test.js',
    'tests/models.test.js',
    'tests/test-create-vendor-supertest.js'
  ],
  
  // الوقت المستقطع للاختبارات (بالمللي ثانية)
  timeout: 10000,
  
  // تمكين الوعود
  asyncOnly: false,
  
  // تمكين الانتظار التلقائي
  delay: false,
  
  // إظهار الأخطاء الكاملة
  fullTrace: true,
  
  // تمكين الألوان في التقارير
  color: true,
  
  // نوع التقرير
  reporter: 'spec',
  
  // خيارات التقرير
  reporterOptions: {
    reportDir: './tests/reports/mocha',
    reportFilename: 'mocha-report',
    quiet: false
  },
  
  // عدد المحاولات
  retries: 0,
  
  // تمكين الإيقاف عند أول فشل
  bail: false,
  
  // تمكين التنفيذ المتسلسل
  parallel: false,
  
  // ملف الإعداد
  require: ['./tests/mocha.setup.js']
};