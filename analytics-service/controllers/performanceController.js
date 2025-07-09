// analytics-service/controllers/performanceController.js
const performanceModel = require('../models/mysql-performance');

/**
 * @desc    تسجيل أداء التطبيق
 * @route   POST /performance/app
 * @access  Private
 */
const logAppPerformance = async (req, res) => {
  try {
    const { loadTime, memoryUsage, cpuUsage, endpoint, responseTime, statusCode, userAgent, ipAddress } = req.body;

    if (!loadTime || !endpoint || !responseTime || !statusCode) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير جميع البيانات المطلوبة'
      });
    }

    const result = await performanceModel.createAppPerformance({
      loadTime,
      memoryUsage,
      cpuUsage,
      endpoint,
      responseTime,
      statusCode,
      userAgent,
      ipAddress
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تسجيل بيانات الأداء',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم تسجيل بيانات الأداء بنجاح',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('خطأ في تسجيل أداء التطبيق:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل بيانات الأداء',
      error: error.message
    });
  }
};

/**
 * @desc    تسجيل خطأ
 * @route   POST /performance/error
 * @access  Private
 */
const logError = async (req, res) => {
  try {
    const { errorType, errorMessage, stackTrace, endpoint, userAgent, ipAddress, userId, isFatal } = req.body;

    if (!errorType || !errorMessage) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير نوع الخطأ ورسالة الخطأ'
      });
    }

    const result = await performanceModel.createErrorLog({
      errorType,
      errorMessage,
      stackTrace,
      endpoint,
      userAgent,
      ipAddress,
      userId,
      isFatal
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تسجيل الخطأ',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الخطأ بنجاح',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('خطأ في تسجيل الخطأ:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخطأ',
      error: error.message
    });
  }
};

/**
 * @desc    تسجيل مشاركة المستخدم
 * @route   POST /performance/engagement
 * @access  Private
 */
const logUserEngagement = async (req, res) => {
  try {
    const { userId, sessionId, startTime, endTime, duration, pagesVisited, events, device, platform, browser } = req.body;

    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المستخدم ومعرف الجلسة'
      });
    }

    const result = await performanceModel.createUserEngagement({
      userId,
      sessionId,
      startTime,
      endTime,
      duration,
      pagesVisited,
      events,
      device,
      platform,
      browser
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تسجيل مشاركة المستخدم',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم تسجيل مشاركة المستخدم بنجاح',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('خطأ في تسجيل مشاركة المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل مشاركة المستخدم',
      error: error.message
    });
  }
};

/**
 * @desc    تسجيل أداء API
 * @route   POST /performance/api
 * @access  Private
 */
const logApiPerformance = async (req, res) => {
  try {
    const { endpoint, method, responseTime, statusCode, requestSize, responseSize, userId, ipAddress } = req.body;

    if (!endpoint || !method || !responseTime || !statusCode) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير جميع البيانات المطلوبة'
      });
    }

    const result = await performanceModel.createApiPerformance({
      endpoint,
      method,
      responseTime,
      statusCode,
      requestSize,
      responseSize,
      userId,
      ipAddress
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'حدث خطأ أثناء تسجيل أداء API',
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم تسجيل أداء API بنجاح',
      data: { id: result.id }
    });
  } catch (error) {
    console.error('خطأ في تسجيل أداء API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل أداء API',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على إحصائيات أداء التطبيق
 * @route   GET /performance/app
 * @access  Private
 */
const getAppPerformanceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.startDate = new Date(startDate);
      query.endDate = new Date(endDate);
    }

    // الحصول على متوسط وقت التحميل والاستجابة
    const avgPerformance = await performanceModel.getAverageAppPerformance(query);
    
    // الحصول على سجلات الأداء
    const performanceStats = await performanceModel.getAppPerformanceStats(query);

    res.status(200).json({
      success: true,
      data: {
        averages: avgPerformance,
        records: performanceStats
      }
    });
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات أداء التطبيق:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على إحصائيات أداء التطبيق',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على سجلات الأخطاء
 * @route   GET /performance/errors
 * @access  Private
 */
const getErrorLogs = async (req, res) => {
  try {
    const { startDate, endDate, errorType, isFatal, limit } = req.query;
    const query = {};

    if (startDate && endDate) {
      query.startDate = new Date(startDate);
      query.endDate = new Date(endDate);
    }

    if (errorType) {
      query.errorType = errorType;
    }

    if (isFatal !== undefined) {
      query.isFatal = isFatal === 'true';
    }

    if (limit) {
      query.limit = parseInt(limit);
    }

    const errorLogs = await performanceModel.getErrorLogs(query);

    res.status(200).json({
      success: true,
      count: errorLogs.length,
      data: errorLogs
    });
  } catch (error) {
    console.error('خطأ في الحصول على سجلات الأخطاء:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على سجلات الأخطاء',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على إحصائيات مشاركة المستخدم
 * @route   GET /performance/engagement
 * @access  Private
 */
const getUserEngagementStats = async (req, res) => {
  try {
    const { userId, sessionId, startDate, endDate, limit } = req.query;
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (sessionId) {
      query.sessionId = sessionId;
    }

    if (startDate && endDate) {
      query.startDate = new Date(startDate);
      query.endDate = new Date(endDate);
    }

    if (limit) {
      query.limit = parseInt(limit);
    }

    const engagementStats = await performanceModel.getUserEngagement(query);

    res.status(200).json({
      success: true,
      count: engagementStats.length,
      data: engagementStats
    });
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات مشاركة المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على إحصائيات مشاركة المستخدم',
      error: error.message
    });
  }
};

/**
 * @desc    الحصول على إحصائيات أداء API
 * @route   GET /performance/api
 * @access  Private
 */
const getApiPerformanceStats = async (req, res) => {
  try {
    const { endpoint, method, statusCode, startDate, endDate, limit } = req.query;
    const query = {};

    if (endpoint) {
      query.endpoint = endpoint;
    }

    if (method) {
      query.method = method;
    }

    if (statusCode) {
      query.statusCode = parseInt(statusCode);
    }

    if (startDate && endDate) {
      query.startDate = new Date(startDate);
      query.endDate = new Date(endDate);
    }

    if (limit) {
      query.limit = parseInt(limit);
    }

    // الحصول على متوسط أداء API
    const avgApiPerformance = await performanceModel.getAverageApiPerformance(query);
    
    // الحصول على سجلات أداء API
    const apiPerformanceStats = await performanceModel.getApiPerformance(query);

    res.status(200).json({
      success: true,
      data: {
        averages: avgApiPerformance,
        records: apiPerformanceStats
      }
    });
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات أداء API:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء الحصول على إحصائيات أداء API',
      error: error.message
    });
  }
};

module.exports = {
  logAppPerformance,
  logError,
  logUserEngagement,
  logApiPerformance,
  getAppPerformanceStats,
  getErrorLogs,
  getUserEngagementStats,
  getApiPerformanceStats
};