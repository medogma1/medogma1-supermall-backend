// api-gateway/index.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors    = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../utils/config');
const localConfig = require('./config/config');
const { errorMiddleware } = require('../utils/auth/errorHandler');
const { authenticate, restrictTo } = require('./middleware/authMiddleware');
const app = express();

// Function to get additional allowed origins from environment variables
function getAdditionalAllowedOrigins() {
  const additionalOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (additionalOrigins) {
    return additionalOrigins.split(',').map(origin => origin.trim());
  }
  return [];
}

// Configure CORS with specific options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check against allowed origins from config
    if (localConfig.cors && Array.isArray(localConfig.cors.origin)) {
      // Check exact matches first
      if (localConfig.cors.origin.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // Check if origin matches the frontend URL from main config
    if (config.server && config.server.frontendUrl && origin === config.server.frontendUrl) {
      return callback(null, true);
    }
    
    // Check against additional allowed origins from environment variables
    const additionalOrigins = getAdditionalAllowedOrigins();
    if (additionalOrigins.length > 0 && additionalOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check for wildcard matches (localhost with any port)
    if (origin.startsWith('http://localhost:') || 
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Silently reject other origins to reduce terminal noise
     return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Accept-Language',
    'Content-Language',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'x-app-version',
    'X-CSRF-Token',
    'X-Requested-With',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match',
    'User-Agent',
    'Referer',
    'DNT',
    'X-Forwarded-For',
    'X-Real-IP'
  ],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Log CORS configuration on startup
const configuredOrigins = [
  ...(localConfig.cors && Array.isArray(localConfig.cors.origin) ? localConfig.cors.origin : []),
  ...(config.server && config.server.frontendUrl ? [config.server.frontendUrl] : []),
  ...getAdditionalAllowedOrigins()
];
console.log('🔒 CORS configured with the following origins:', configuredOrigins);

// Add a CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is properly configured for this origin',
    origin: req.headers.origin || 'No origin header found',
    timestamp: new Date().toISOString()
  });
});

// Configure auth service proxy BEFORE body parsing to avoid conflicts
const authServiceUrl = config.getServiceUrl('auth');
console.log('🔗 Auth Service URL:', authServiceUrl);

app.use(
  '/auth',
  createProxyMiddleware({
    target: authServiceUrl,
    changeOrigin: true,
    secure: false,
    ws: false,
    xfwd: true,
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    selfHandleResponse: false,
    parseReqBody: false,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بالخدمة',
          error: err.message
        });
      }
    }
  })
);

// JSON parsing middleware will be applied selectively to non-proxied routes
// Removed global body parsing to avoid conflicts with proxy middleware

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({
      status: 'error',
      message: 'تنسيق JSON غير صحيح',
      error: 'Invalid JSON format'
    });
  }
  next(err);
});

// Early middleware to block IPFS/P2P requests before any other processing
let ipfsBlockedCount = 0;
app.use((req, res, next) => {
  // Block IPFS/P2P requests immediately
  if (req.originalUrl.startsWith('/api/v0/')) {
    ipfsBlockedCount++;
    // Log message only once every 10 requests to reduce noise
    if (ipfsBlockedCount === 1 || ipfsBlockedCount % 10 === 0) {
      console.log(`[Gateway] Blocked ${ipfsBlockedCount} IPFS/P2P requests (${req.method} ${req.originalUrl})`);
    }
    return res.status(403).json({ 
      error: 'IPFS/P2P requests are not allowed',
      blocked: true
    });
  }
  
  // Log legitimate requests only
  console.log(`[Gateway] ${req.method} ${req.originalUrl}`);
  next();
});

/* ---------------------------------------------------------------
   Helper function that re-adds the prefix after Express removes it
   prefix = '/auth' or '/vendors' or '/products'  */
// Removed keepPrefix function - now using object-style pathRewrite
/* ------------------------------------------------------------- */

/* ============ 1)  Auth Service (5000)  ============ */
// Debug: Log service URLs to identify any invalid URLs
console.log('Service URLs:');
console.log('Auth:', config.getServiceUrl('auth'));
console.log('Vendor:', config.getServiceUrl('vendor'));
console.log('User:', config.getServiceUrl('user'));
console.log('Product:', config.getServiceUrl('product'));
console.log('Order:', config.getServiceUrl('order'));
console.log('Support:', config.getServiceUrl('support'));
console.log('Chat:', config.getServiceUrl('chat'));
console.log('Notification:', config.getServiceUrl('notification'));
console.log('Upload:', config.getServiceUrl('upload'));
console.log('Analytics:', config.getServiceUrl('analytics'));

// Add /api/auth route for API compatibility (must come before /auth)
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: config.getServiceUrl('auth'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/auth': '/auth'
    },
    // إضافة خيارات متقدمة للتعامل مع مشكلات الاتصال
    timeout: 60000, // زيادة مهلة الاتصال إلى 60 ثانية
    proxyTimeout: 60000, // زيادة مهلة الوكيل إلى 60 ثانية
    followRedirects: true, // متابعة إعادة التوجيه
    // تكوين وكيل HTTP مخصص
    agent: new http.Agent({
      keepAlive: true, // الحفاظ على الاتصال مفتوحًا
      maxSockets: 100, // زيادة عدد المقابس المتاحة
      keepAliveMsecs: 60000, // مدة الحفاظ على الاتصال (60 ثانية)
      timeout: 60000, // مهلة المقبس
    }),
    // معالجة الأخطاء
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بالخدمة',
          error: err.message
        });
      }
    }
  })
);

// تحسين تكوين وكيل خدمة المصادقة لمعالجة مشكلات الاتصال

// Auth proxy is now configured before body parsing middleware

// Add /api/health route for health check
app.use(
  '/api/health',
  createProxyMiddleware({
    target: config.getServiceUrl('auth'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/health': '/health'
    }
  })
);

// Add direct /health route for health check
app.use(
  '/health',
  createProxyMiddleware({
    target: config.getServiceUrl('auth'),
    changeOrigin: true,
    logLevel: 'debug'
  })
);

// Add missing login routes
app.use(
  '/auth/login',
  createProxyMiddleware({
    target: config.getServiceUrl('auth'),
    changeOrigin: true,
    logLevel: 'debug',
    // إضافة خيارات متقدمة للتعامل مع مشكلات الاتصال
    timeout: 60000, // زيادة مهلة الاتصال إلى 60 ثانية
      proxyTimeout: 60000, // زيادة مهلة الوكيل إلى 60 ثانية
    followRedirects: true, // متابعة إعادة التوجيه
    // تكوين وكيل HTTP مخصص
    agent: new http.Agent({
      keepAlive: true, // الحفاظ على الاتصال مفتوحًا
      maxSockets: 100, // زيادة عدد المقابس المتاحة
      keepAliveMsecs: 60000, // مدة الحفاظ على الاتصال (60 ثانية)
      timeout: 60000, // مهلة المقبس
    }),
    // معالجة الأخطاء
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بالخدمة',
          error: err.message
        });
      }
    }
  })
);

app.use(
  '/auth/login/vendor',
  createProxyMiddleware({
    target: config.getServiceUrl('auth'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path) => '/login/vendor',
    // إضافة خيارات متقدمة للتعامل مع مشكلات الاتصال
    timeout: 60000, // زيادة مهلة الاتصال إلى 60 ثانية
      proxyTimeout: 60000, // زيادة مهلة الوكيل إلى 60 ثانية
    followRedirects: true, // متابعة إعادة التوجيه
    // تكوين وكيل HTTP مخصص
    agent: new http.Agent({
      keepAlive: true, // الحفاظ على الاتصال مفتوحًا
      maxSockets: 100, // زيادة عدد المقابس المتاحة
      keepAliveMsecs: 60000, // مدة الحفاظ على الاتصال (60 ثانية)
      timeout: 60000, // مهلة المقبس
    }),
    // معالجة الأخطاء
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بالخدمة',
          error: err.message
        });
      }
    }
  })
);

/* ============ 2)  Vendor Service (5005) ============ */
// Apply authentication to vendor routes except public read routes
app.use(
  '/vendors',
  (req, res, next) => {
    // Allow public access for GET requests (reading public data)
    if (req.method === 'GET' && !req.originalUrl.includes('/admin')) {
      return next();
    }
    // Apply authentication to other requests
    authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: config.getServiceUrl('vendor'),
    changeOrigin: true,
    secure: false,
    ws: false,
    xfwd: true,
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    selfHandleResponse: false,
    parseReqBody: false,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    pathRewrite: {
      '^/vendors': '/vendors'
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying request to vendor service: ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل vendor service:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة البائعين',
          error: err.message
        });
      }
    }
  })
);

// Add active vendors route
app.use(
  '/vendors/active',
  createProxyMiddleware({
    target: config.getServiceUrl('vendor'),
    changeOrigin: true,
    secure: false,
    ws: false,
    xfwd: true,
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    selfHandleResponse: false,
    parseReqBody: false,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    pathRewrite: (path) => '/api/v1/vendors/public',
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل vendor service:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة البائعين',
          error: err.message
        });
      }
    }
  })
);

// Add API v1 active vendors route
app.use(
  '/api/v1/vendors/active',
  createProxyMiddleware({
    target: config.getServiceUrl('vendor'),
    changeOrigin: true,
    secure: false,
    ws: false,
    xfwd: true,
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    selfHandleResponse: false,
    parseReqBody: false,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    pathRewrite: (path) => '/api/v1/vendors/public',
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل vendor service:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة البائعين',
          error: err.message
        });
      }
    }
  })
);
app.use(
  '/api/v1/vendors',
  (req, res, next) => {
    // Allow public access for GET requests (reading public data)
    if (req.method === 'GET' && !req.originalUrl.includes('/admin')) {
      return next();
    }
    // Apply authentication to other requests
    authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: config.getServiceUrl('vendor'),
    changeOrigin: true,
    secure: false,
    ws: false,
    xfwd: true,
    logLevel: 'debug',
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    selfHandleResponse: false,
    parseReqBody: false,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    pathRewrite: (path, req) => {
      // Keep the /api/v1 prefix since vendor service now expects it
      console.log('Keeping path as-is:', path);
      return path;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying request to vendor service:', req.method, req.url);
    },
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل vendor service:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة البائعين',
          error: err.message
        });
      }
    }
  })
);

/* ============ 3)  Product Service (5003) =========== */
app.use(
  '/products',
  (req, res, next) => {
    // Allow public access for GET requests (reading products)
    if (req.method === 'GET' && !req.originalUrl.includes('/admin')) {
      return next();
    }
    // Apply authentication to other requests
    authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: config.getServiceUrl('product'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/products': '/products'
    }
  })
);

// Add API v1 products routes
app.use(
  '/api/v1/products',
  (req, res, next) => {
    // Allow public access for GET requests (reading products)
    if (req.method === 'GET' && !req.originalUrl.includes('/admin')) {
      return next();
    }
    // Apply authentication to other requests
    authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: config.getServiceUrl('product'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/v1/products': '/products'
    }
  })
);

// Add search routes
app.use(
  '/search',
  createProxyMiddleware({
    target: config.getServiceUrl('product'),
    changeOrigin: true,
    logLevel: 'debug'
  })
);

app.use(
  '/api/v1/search',
  createProxyMiddleware({
    target: config.getServiceUrl('product'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/v1/search': '/search'
    }
  })
);

/* ============ 4)  User Service (5002) =========== */
app.use(
  '/users',
  authenticate, // Apply authentication to all user routes
  createProxyMiddleware({
    target: config.getServiceUrl('user'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/users': '/users'
    }
  })
);
app.use(
  '/api/v1/users',
  authenticate, // Apply authentication to all user routes
  createProxyMiddleware({
    target: config.getServiceUrl('user'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => path.replace('/api/v1', ''),
  })
);

/* ============ 5)  Order Service (5004) ============ */
app.use(
  '/orders',
  authenticate, // Apply authentication to all order routes
  createProxyMiddleware({
    target: config.getServiceUrl('order'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/orders': '/orders'
    }
  })
);

/* ============ 5.1)  Cart Service (5004) ============ */
app.use(
  '/cart',
  authenticate, // Apply authentication to all cart routes
  createProxyMiddleware({
    target: config.getServiceUrl('order'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/cart': '/cart'
    }
  })
);

/* ============ 6)  Chat Service (5007) ============ */
app.use(
  '/chat',
  authenticate, // Apply authentication to all chat routes
  createProxyMiddleware({
    target: config.getServiceUrl('chat'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/chat': '/chat'
    }
  })
);

/* ============ 7)  Notification Service (5006) ============ */
app.use(
  '/notifications',
  authenticate, // Apply authentication to all notification routes
  createProxyMiddleware({
    target: config.getServiceUrl('notification'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/notifications': '/notifications'
    }
  })
);

/* ============ 8)  Support Service (5006) ============ */
app.use(
  '/support',
  (req, res, next) => {
    // Allow public access for creating support tickets and FAQ
    if (req.method === 'POST' && req.originalUrl === '/support/tickets' ||
        req.method === 'GET' && req.originalUrl === '/support/faq') {
      return next();
    }
    // Apply authentication to other requests
    authenticate(req, res, next);
  },
  createProxyMiddleware({
    target: config.getServiceUrl('support'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/support': '/support'
    }
  })
);

// Add FAQ route
app.use(
  '/support/faq',
  createProxyMiddleware({
    target: config.getServiceUrl('support'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path) => '/faqs'
  })
);

/* ============ 8)  Upload Service (5009) ============ */
app.use(
  '/upload',
  authenticate, // Apply authentication to all upload routes
  createProxyMiddleware({
    target: config.getServiceUrl('upload'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/upload': '/upload'
    }
  })
);

/* ============ 8.1)  API Upload Service (5009) ============ */
app.use(
  '/api/upload',
  authenticate, // Apply authentication to all upload routes
  createProxyMiddleware({
    target: config.getServiceUrl('upload'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api/upload': '/upload'
    }
  })
);

/* ============ 9)  Analytics Service (5010) ============ */
app.use(
  '/analytics',
  authenticate, // Apply authentication to all analytics routes
  restrictTo('admin', 'vendor'), // Restrict access to admins and vendors only
  createProxyMiddleware({
    target: config.getServiceUrl('analytics'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/analytics': '/analytics'
    }
  })
);

// Public upload endpoint (no authentication required)
app.use(
  '/public/upload',
  createProxyMiddleware({
    target: config.getServiceUrl('upload'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/public/upload': '/upload'
    }
  })
);

// API Gateway doesn't need JSON parsing - it's just a proxy
// JSON parsing will be handled by individual services

/* ---------------- Simple local routes ---------------- */
app.get('/',       (_, res) => res.send('API Gateway is running!'));
app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Global error handler
app.use((error, req, res, next) => {
  if (error.message === 'Not allowed by CORS') {
    // Silently handle CORS errors without logging
    return res.status(403).json({ error: 'CORS policy violation' });
  } else {
    console.error('❌ [Gateway] Unhandled error:', error);
    res.status(500).json({
      status: 'error',
      message: 'حدث خطأ في الخادم',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Admin routes - require authentication and admin role
// Order admin routes - require authentication and admin role
app.use(
  '/admin/orders',
  authenticate, // Apply authentication to all admin routes
  restrictTo('admin'), // Restrict access to admins only
  createProxyMiddleware({
    target: config.getServiceUrl('order'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/admin/orders': '/admin/orders' // Keep admin path for order-service
    },
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل Order Admin API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة إدارة الطلبات',
          error: err.message
        });
      }
    }
  })
);

// Product admin routes - require authentication and admin role
app.use(
  '/admin/products',
  authenticate, // Apply authentication to all admin routes
  restrictTo('admin'), // Restrict access to admins only
  createProxyMiddleware({
    target: config.getServiceUrl('product'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/admin/products': '/admin/products' // Keep admin path for product-service
    },
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل Product Admin API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة إدارة المنتجات',
          error: err.message
        });
      }
    }
  })
);

// User admin routes - require authentication and admin role
app.use(
  '/admin/users',
  authenticate, // Apply authentication to all admin routes
  restrictTo('admin'), // Restrict access to admins only
  createProxyMiddleware({
    target: config.getServiceUrl('user'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/admin/users': '/' // Map /admin/users to / in user-service
    },
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل User Admin API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة إدارة المستخدمين',
          error: err.message
        });
      }
    }
  })
);

// Vendor admin routes (stores/vendors) - require authentication and admin role
app.use(
  '/admin/stores',
  authenticate, // Apply authentication to all admin routes
  restrictTo('admin'), // Restrict access to admins only
  createProxyMiddleware({
    target: config.getServiceUrl('vendor'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/admin/stores': '/api/v1/vendors' // Map /admin/stores to /api/v1/vendors in vendor-service
    },
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل Vendor Admin API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة إدارة المتاجر',
          error: err.message
        });
      }
    }
  })
);

app.use(
  '/admin/vendors',
  authenticate, // Apply authentication to all admin routes
  restrictTo('admin'), // Restrict access to admins only
  createProxyMiddleware({
    target: config.getServiceUrl('vendor'),
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/admin/vendors': '/api/v1/vendors' // Map /admin/vendors to /api/v1/vendors in vendor-service
    },
    timeout: 60000,
    proxyTimeout: 60000,
    followRedirects: true,
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 100,
      keepAliveMsecs: 60000,
      timeout: 60000,
    }),
    onError: (err, req, res) => {
      console.error('❌ خطأ في وكيل Vendor Admin API Gateway:', err);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'حدث خطأ في الاتصال بخدمة إدارة البائعين',
          error: err.message
        });
      }
    }
  })
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'المسار غير موجود',
    error: 'Route not found'
  });
});

/* ----------------   Block IPFS/P2P requests   ------------------- */
// IPFS/P2P blocking logic has been moved to early middleware at the beginning of the file

/* ----------------   404 fallback   ------------------- */
app.use((req, res) => {
  console.log(`[Gateway] No route for ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found in API Gateway' });
});

// Add error handling middleware
app.use(errorMiddleware('api-gateway'));

// Start the server
const port = config.getServicePort('gateway') || 5001;
app.listen(port, () => {
  console.log(`API Gateway is running on port ${port}`);
  console.log(`API Gateway: Environment: ${config.server.nodeEnv}`);
});
