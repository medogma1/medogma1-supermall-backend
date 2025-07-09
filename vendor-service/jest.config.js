/**
 * تكوين Jest لاختبارات وحدة البائعين
 */

module.exports = {
  // المسار الأساسي للمشروع
  rootDir: './',
  
  // أنماط الملفات التي سيتم اعتبارها اختبارات
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // الملفات التي سيتم تجاهلها
  testPathIgnorePatterns: [
    '/node_modules/',
    '/cypress/'
  ],
  
  // بيئة الاختبار
  testEnvironment: 'node',
  
  // إعدادات التغطية
  collectCoverage: true,
  coverageDirectory: './tests/reports/jest/coverage',
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**'
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // إعدادات المراقب
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/cypress/'
  ],
  
  // إعدادات التقارير
  reporters: [
    'default',
    ['./node_modules/jest-html-reporter', {
      pageTitle: 'تقرير اختبارات Jest',
      outputPath: './tests/reports/jest/test-report.html',
      includeFailureMsg: true,
      includeConsoleLog: true,
      dateFormat: 'yyyy-mm-dd HH:MM:ss',
      executionTimeWarningThreshold: 5,
      executionTimeErrorThreshold: 10,
      openReport: false
    }]
  ],
  
  // الوقت المستقطع للاختبارات (بالمللي ثانية)
  testTimeout: 10000,
  
  // إعدادات المحاكاة
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  
  // إعدادات التصحيح
  verbose: true,
  
  // إعدادات البيئة
  setupFiles: ['./tests/jest.setup.js']
};