// Enhanced Performance Monitoring System
const { createLogger } = require('../logger');
const os = require('os');
const process = require('process');

const logger = createLogger('performance');

/**
 * Performance metrics collector
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        slowRequests: 0 // requests > 1000ms
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0
      },
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0]
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      }
    };
    
    this.responseTimes = [];
    this.maxResponseTimes = 1000; // Keep last 1000 response times
    
    // Start system monitoring
    this.startSystemMonitoring();
  }
  
  /**
   * Record request metrics
   */
  recordRequest(duration, statusCode, endpoint, error = null) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }
    
    // Track response times
    this.responseTimes.push(duration);
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
    
    // Calculate average response time
    this.metrics.requests.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    
    // Track slow requests
    if (duration > 1000) {
      this.metrics.requests.slowRequests++;
    }
    
    // Track errors
    if (error) {
      this.metrics.errors.total++;
      
      const errorType = error.name || 'UnknownError';
      this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
      
      this.metrics.errors.byEndpoint[endpoint] = (this.metrics.errors.byEndpoint[endpoint] || 0) + 1;
    }
  }
  
  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    setInterval(() => {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.metrics.memory = {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
        rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100 // MB
      };
      
      // CPU usage
      this.metrics.cpu = {
        usage: Math.round(process.cpuUsage().user / 1000), // microseconds to milliseconds
        loadAverage: os.loadavg()
      };
      
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      responseTimePercentiles: this.getResponseTimePercentiles()
    };
  }
  
  /**
   * Calculate response time percentiles
   */
  getResponseTimePercentiles() {
    if (this.responseTimes.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      p50: sorted[Math.floor(len * 0.5)],
      p90: sorted[Math.floor(len * 0.9)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }
  
  /**
   * Reset metrics
   */
  reset() {
    this.metrics.requests = {
      total: 0,
      successful: 0,
      failed: 0,
      averageResponseTime: 0,
      slowRequests: 0
    };
    this.metrics.errors = {
      total: 0,
      byType: {},
      byEndpoint: {}
    };
    this.responseTimes = [];
  }
}

// Global metrics instance
const globalMetrics = new PerformanceMetrics();

/**
 * Performance monitoring middleware
 */
const performanceMiddleware = (options = {}) => {
  const {
    logSlowRequests = true,
    slowRequestThreshold = 1000,
    logAllRequests = false,
    excludePaths = ['/health', '/metrics'],
    includeUserAgent = false,
    includeIP = false
  } = options;
  
  return (req, res, next) => {
    // Skip monitoring for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();
    
    // Store original end function
    const originalEnd = res.end;
    
    // Override res.end to capture metrics
    res.end = function(chunk, encoding) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);
      
      const duration = endTime - startTime;
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      const cpuDelta = endCpu.user + endCpu.system;
      
      // Prepare request data
      const requestData = {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        memoryDelta: `${Math.round(memoryDelta / 1024 / 1024 * 100) / 100}MB`,
        cpuTime: `${Math.round(cpuDelta / 1000)}ms`,
        timestamp: new Date().toISOString()
      };
      
      // Add optional fields
      if (includeUserAgent) {
        requestData.userAgent = req.headers['user-agent'];
      }
      
      if (includeIP) {
        requestData.ip = req.ip || req.connection.remoteAddress;
      }
      
      // Record metrics
      const error = res.statusCode >= 400 ? new Error(`HTTP ${res.statusCode}`) : null;
      globalMetrics.recordRequest(duration, res.statusCode, req.route?.path || req.path, error);
      
      // Log based on conditions
      if (logAllRequests) {
        logger.info('Request completed', requestData);
      } else if (logSlowRequests && duration > slowRequestThreshold) {
        logger.warn('Slow request detected', {
          ...requestData,
          threshold: `${slowRequestThreshold}ms`,
          performance: {
            memoryUsage: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
            cpuUsage: `${Math.round(cpuDelta / 1000)}ms`
          }
        });
      } else if (res.statusCode >= 400) {
        logger.error('Request failed', {
          ...requestData,
          error: {
            statusCode: res.statusCode,
            statusMessage: res.statusMessage
          }
        });
      }
      
      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };
    
    next();
  };
};

/**
 * Health check middleware
 */
const healthCheckMiddleware = (req, res) => {
  const metrics = globalMetrics.getMetrics();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.round(process.uptime())}s`,
    memory: {
      used: `${metrics.memory.heapUsed}MB`,
      total: `${metrics.memory.heapTotal}MB`,
      usage: `${Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)}%`
    },
    requests: {
      total: metrics.requests.total,
      successful: metrics.requests.successful,
      failed: metrics.requests.failed,
      successRate: metrics.requests.total > 0 
        ? `${Math.round((metrics.requests.successful / metrics.requests.total) * 100)}%` 
        : '0%',
      averageResponseTime: `${Math.round(metrics.requests.averageResponseTime)}ms`
    },
    performance: {
      slowRequests: metrics.requests.slowRequests,
      responseTimePercentiles: metrics.responseTimePercentiles
    }
  };
  
  // Determine health status
  if (metrics.memory.heapUsed > 500) { // > 500MB
    health.status = 'warning';
    health.warnings = health.warnings || [];
    health.warnings.push('High memory usage');
  }
  
  if (metrics.requests.averageResponseTime > 2000) { // > 2s
    health.status = 'warning';
    health.warnings = health.warnings || [];
    health.warnings.push('High average response time');
  }
  
  if (metrics.requests.total > 0 && (metrics.requests.failed / metrics.requests.total) > 0.1) { // > 10% error rate
    health.status = 'unhealthy';
    health.errors = health.errors || [];
    health.errors.push('High error rate');
  }
  
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'warning' ? 200 : 503;
  res.status(statusCode).json(health);
};

/**
 * Metrics endpoint middleware
 */
const metricsMiddleware = (req, res) => {
  const metrics = globalMetrics.getMetrics();
  res.json({
    success: true,
    data: metrics
  });
};

/**
 * Performance alert system
 */
class PerformanceAlerts {
  constructor(options = {}) {
    this.thresholds = {
      memoryUsage: options.memoryThreshold || 400, // MB
      responseTime: options.responseTimeThreshold || 2000, // ms
      errorRate: options.errorRateThreshold || 0.05, // 5%
      slowRequestRate: options.slowRequestRateThreshold || 0.1 // 10%
    };
    
    this.alertCooldown = options.alertCooldown || 300000; // 5 minutes
    this.lastAlerts = {};
  }
  
  checkAlerts() {
    const metrics = globalMetrics.getMetrics();
    const now = Date.now();
    
    // Memory usage alert
    if (metrics.memory.heapUsed > this.thresholds.memoryUsage) {
      this.sendAlert('HIGH_MEMORY_USAGE', {
        current: `${metrics.memory.heapUsed}MB`,
        threshold: `${this.thresholds.memoryUsage}MB`,
        usage: `${Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)}%`
      }, now);
    }
    
    // Response time alert
    if (metrics.requests.averageResponseTime > this.thresholds.responseTime) {
      this.sendAlert('HIGH_RESPONSE_TIME', {
        current: `${Math.round(metrics.requests.averageResponseTime)}ms`,
        threshold: `${this.thresholds.responseTime}ms`,
        p95: `${metrics.responseTimePercentiles.p95}ms`
      }, now);
    }
    
    // Error rate alert
    if (metrics.requests.total > 0) {
      const errorRate = metrics.requests.failed / metrics.requests.total;
      if (errorRate > this.thresholds.errorRate) {
        this.sendAlert('HIGH_ERROR_RATE', {
          current: `${Math.round(errorRate * 100)}%`,
          threshold: `${Math.round(this.thresholds.errorRate * 100)}%`,
          totalRequests: metrics.requests.total,
          failedRequests: metrics.requests.failed
        }, now);
      }
    }
  }
  
  sendAlert(type, data, timestamp) {
    // Check cooldown
    if (this.lastAlerts[type] && (timestamp - this.lastAlerts[type]) < this.alertCooldown) {
      return;
    }
    
    this.lastAlerts[type] = timestamp;
    
    logger.error('Performance Alert', {
      alertType: type,
      severity: 'HIGH',
      data: data,
      timestamp: new Date(timestamp).toISOString(),
      service: process.env.SERVICE_NAME || 'unknown'
    });
    
    // Here you could integrate with external alerting systems
    // like Slack, email, SMS, etc.
  }
  
  startMonitoring(interval = 60000) { // Check every minute
    setInterval(() => {
      this.checkAlerts();
    }, interval);
  }
}

/**
 * Initialize performance monitoring
 */
const initializePerformanceMonitoring = (app, options = {}) => {
  // Add performance middleware
  app.use(performanceMiddleware(options.middleware || {}));
  
  // Add health check endpoint
  app.get('/health', healthCheckMiddleware);
  
  // Add metrics endpoint
  app.get('/metrics', metricsMiddleware);
  
  // Start performance alerts
  if (options.alerts !== false) {
    const alerts = new PerformanceAlerts(options.alerts || {});
    alerts.startMonitoring();
  }
  
  logger.info('Performance monitoring initialized', {
    healthEndpoint: '/health',
    metricsEndpoint: '/metrics',
    alertsEnabled: options.alerts !== false
  });
};

module.exports = {
  performanceMiddleware,
  healthCheckMiddleware,
  metricsMiddleware,
  PerformanceMetrics,
  PerformanceAlerts,
  initializePerformanceMonitoring,
  globalMetrics
};