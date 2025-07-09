// analytics-service/models/mysql-performance.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات MySQL الموحدة
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'xx100100',
  database: process.env.DB_NAME || 'supermall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// إنشاء تجمع اتصالات
const pool = mysql.createPool(dbConfig);

/**
 * وظائف أداء التطبيق
 */
async function createAppPerformance(performanceData) {
  try {
    const { loadTime, memoryUsage, cpuUsage, endpoint, responseTime, statusCode, userAgent, ipAddress } = performanceData;
    
    const [result] = await pool.query(
      `INSERT INTO app_performance 
       (load_time, memory_usage, cpu_usage, endpoint, response_time, status_code, user_agent, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [loadTime, memoryUsage, cpuUsage, endpoint, responseTime, statusCode, userAgent, ipAddress]
    );
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('خطأ في إنشاء سجل أداء التطبيق:', error);
    return { success: false, error: error.message };
  }
}

async function getAppPerformanceStats(query = {}) {
  try {
    let sqlQuery = 'SELECT * FROM app_performance';
    const params = [];
    
    if (query.startDate && query.endDate) {
      sqlQuery += ' WHERE created_at BETWEEN ? AND ?';
      params.push(query.startDate, query.endDate);
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    const [rows] = await pool.query(sqlQuery, params);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على إحصائيات أداء التطبيق:', error);
    return [];
  }
}

async function getAverageAppPerformance(query = {}) {
  try {
    let sqlQuery = `
      SELECT 
        AVG(load_time) as avg_load_time,
        AVG(response_time) as avg_response_time,
        AVG(memory_usage) as avg_memory_usage,
        AVG(cpu_usage) as avg_cpu_usage
      FROM app_performance
    `;
    const params = [];
    
    if (query.startDate && query.endDate) {
      sqlQuery += ' WHERE created_at BETWEEN ? AND ?';
      params.push(query.startDate, query.endDate);
    }
    
    const [rows] = await pool.query(sqlQuery, params);
    return rows[0];
  } catch (error) {
    console.error('خطأ في الحصول على متوسط أداء التطبيق:', error);
    return null;
  }
}

/**
 * وظائف سجل الأخطاء
 */
async function createErrorLog(errorData) {
  try {
    const { errorType, errorMessage, stackTrace, endpoint, userAgent, ipAddress, userId, isFatal } = errorData;
    
    const [result] = await pool.query(
      `INSERT INTO error_logs 
       (error_type, error_message, stack_trace, endpoint, user_agent, ip_address, user_id, is_fatal) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [errorType, errorMessage, stackTrace, endpoint, userAgent, ipAddress, userId, isFatal ? 1 : 0]
    );
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('خطأ في إنشاء سجل خطأ:', error);
    return { success: false, error: error.message };
  }
}

async function getErrorLogs(query = {}) {
  try {
    let sqlQuery = 'SELECT * FROM error_logs';
    const params = [];
    const conditions = [];
    
    if (query.startDate && query.endDate) {
      conditions.push('created_at BETWEEN ? AND ?');
      params.push(query.startDate, query.endDate);
    }
    
    if (query.errorType) {
      conditions.push('error_type = ?');
      params.push(query.errorType);
    }
    
    if (query.isFatal !== undefined) {
      conditions.push('is_fatal = ?');
      params.push(query.isFatal ? 1 : 0);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    if (query.limit) {
      sqlQuery += ' LIMIT ?';
      params.push(parseInt(query.limit));
    }
    
    const [rows] = await pool.query(sqlQuery, params);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على سجلات الأخطاء:', error);
    return [];
  }
}

/**
 * وظائف مشاركة المستخدم
 */
async function createUserEngagement(engagementData) {
  try {
    const { userId, sessionId, startTime, endTime, duration, device, platform, browser } = engagementData;
    
    const [result] = await pool.query(
      `INSERT INTO user_engagement 
       (user_id, session_id, start_time, end_time, duration, device, platform, browser) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, sessionId, startTime, endTime, duration, device, platform, browser]
    );
    
    const engagementId = result.insertId;
    
    // إذا كان هناك صفحات تمت زيارتها، قم بإدراجها
    if (engagementData.pagesVisited && engagementData.pagesVisited.length > 0) {
      const pagesValues = engagementData.pagesVisited.map(page => [
        engagementId,
        page.page,
        page.timestamp,
        page.duration
      ]);
      
      await pool.query(
        `INSERT INTO user_engagement_pages 
         (engagement_id, page, timestamp, duration) 
         VALUES ?`,
        [pagesValues]
      );
    }
    
    // إذا كان هناك أحداث، قم بإدراجها
    if (engagementData.events && engagementData.events.length > 0) {
      const eventsValues = engagementData.events.map(event => [
        engagementId,
        event.eventName,
        event.timestamp,
        JSON.stringify(event.properties || {})
      ]);
      
      await pool.query(
        `INSERT INTO user_engagement_events 
         (engagement_id, event_name, timestamp, properties) 
         VALUES ?`,
        [eventsValues]
      );
    }
    
    return { success: true, id: engagementId };
  } catch (error) {
    console.error('خطأ في إنشاء سجل مشاركة المستخدم:', error);
    return { success: false, error: error.message };
  }
}

async function getUserEngagement(query = {}) {
  try {
    let sqlQuery = 'SELECT * FROM user_engagement';
    const params = [];
    const conditions = [];
    
    if (query.userId) {
      conditions.push('user_id = ?');
      params.push(query.userId);
    }
    
    if (query.sessionId) {
      conditions.push('session_id = ?');
      params.push(query.sessionId);
    }
    
    if (query.startDate && query.endDate) {
      conditions.push('start_time BETWEEN ? AND ?');
      params.push(query.startDate, query.endDate);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    sqlQuery += ' ORDER BY start_time DESC';
    
    if (query.limit) {
      sqlQuery += ' LIMIT ?';
      params.push(parseInt(query.limit));
    }
    
    const [engagements] = await pool.query(sqlQuery, params);
    
    // الحصول على الصفحات والأحداث لكل مشاركة
    for (const engagement of engagements) {
      // الحصول على الصفحات التي تمت زيارتها
      const [pages] = await pool.query(
        'SELECT * FROM user_engagement_pages WHERE engagement_id = ? ORDER BY timestamp',
        [engagement.id]
      );
      engagement.pagesVisited = pages;
      
      // الحصول على الأحداث
      const [events] = await pool.query(
        'SELECT * FROM user_engagement_events WHERE engagement_id = ? ORDER BY timestamp',
        [engagement.id]
      );
      engagement.events = events.map(event => ({
        ...event,
        properties: JSON.parse(event.properties)
      }));
    }
    
    return engagements;
  } catch (error) {
    console.error('خطأ في الحصول على سجلات مشاركة المستخدم:', error);
    return [];
  }
}

/**
 * وظائف أداء API
 */
async function createApiPerformance(performanceData) {
  try {
    const { endpoint, method, responseTime, statusCode, requestSize, responseSize, userId, ipAddress } = performanceData;
    
    const [result] = await pool.query(
      `INSERT INTO api_performance 
       (endpoint, method, response_time, status_code, request_size, response_size, user_id, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [endpoint, method, responseTime, statusCode, requestSize, responseSize, userId, ipAddress]
    );
    
    return { success: true, id: result.insertId };
  } catch (error) {
    console.error('خطأ في إنشاء سجل أداء API:', error);
    return { success: false, error: error.message };
  }
}

async function getApiPerformance(query = {}) {
  try {
    let sqlQuery = 'SELECT * FROM api_performance';
    const params = [];
    const conditions = [];
    
    if (query.endpoint) {
      conditions.push('endpoint = ?');
      params.push(query.endpoint);
    }
    
    if (query.method) {
      conditions.push('method = ?');
      params.push(query.method);
    }
    
    if (query.statusCode) {
      conditions.push('status_code = ?');
      params.push(query.statusCode);
    }
    
    if (query.startDate && query.endDate) {
      conditions.push('created_at BETWEEN ? AND ?');
      params.push(query.startDate, query.endDate);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    sqlQuery += ' ORDER BY created_at DESC';
    
    if (query.limit) {
      sqlQuery += ' LIMIT ?';
      params.push(parseInt(query.limit));
    }
    
    const [rows] = await pool.query(sqlQuery, params);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على سجلات أداء API:', error);
    return [];
  }
}

async function getAverageApiPerformance(query = {}) {
  try {
    let sqlQuery = `
      SELECT 
        endpoint,
        method,
        AVG(response_time) as avg_response_time,
        COUNT(*) as request_count,
        SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
      FROM api_performance
    `;
    const params = [];
    const conditions = [];
    
    if (query.startDate && query.endDate) {
      conditions.push('created_at BETWEEN ? AND ?');
      params.push(query.startDate, query.endDate);
    }
    
    if (conditions.length > 0) {
      sqlQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    sqlQuery += ' GROUP BY endpoint, method ORDER BY avg_response_time DESC';
    
    const [rows] = await pool.query(sqlQuery, params);
    return rows;
  } catch (error) {
    console.error('خطأ في الحصول على متوسط أداء API:', error);
    return [];
  }
}

module.exports = {
  // أداء التطبيق
  createAppPerformance,
  getAppPerformanceStats,
  getAverageAppPerformance,
  
  // سجل الأخطاء
  createErrorLog,
  getErrorLogs,
  
  // مشاركة المستخدم
  createUserEngagement,
  getUserEngagement,
  
  // أداء API
  createApiPerformance,
  getApiPerformance,
  getAverageApiPerformance,
  
  // تصدير تجمع الاتصالات للاستخدام المباشر إذا لزم الأمر
  pool
};