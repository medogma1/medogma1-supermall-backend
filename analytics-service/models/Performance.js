// analytics-service/models/Performance.js
// تم تحديث هذا الملف لاستخدام MySQL بدلاً من MongoDB

// استيراد نموذج الأداء من MySQL
const performanceModel = require('./mysql-performance');

// تصدير النماذج من ملف mysql-performance
module.exports = {
  // أداء التطبيق
  AppPerformance: {
    create: performanceModel.createAppPerformance,
    find: performanceModel.getAppPerformanceStats,
    getAverage: performanceModel.getAverageAppPerformance
  },
  
  // سجل الأخطاء
  ErrorLog: {
    create: performanceModel.createErrorLog,
    find: performanceModel.getErrorLogs
  },
  
  // مشاركة المستخدم
  UserEngagement: {
    create: performanceModel.createUserEngagement,
    find: performanceModel.getUserEngagement
  },
  
  // أداء API
  ApiPerformance: {
    create: performanceModel.createApiPerformance,
    find: performanceModel.getApiPerformance,
    getAverage: performanceModel.getAverageApiPerformance
  }
};