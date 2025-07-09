// api-gateway/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// ➊  Middleware يسجّل كل طلب يصل إلى الـ Gateway
app.use((req, res, next) => {
  console.log(`📥 [Gateway] ${req.method} ${req.originalUrl}`);
  next();
});

/* ---------------------------------------------------------------
   دالّة مساعده تعيد إضافة البادئة بعد أن يحذفها Express
   prefix = ‎'/auth' أو ‎'/vendors' أو ‎'/products'  */
const keepPrefix = prefix => (path /* يبدأ دون البادئة */, req) =>
  prefix + path;   // يضيف البادئة ثم يُرجع المسار الكامل
/* ------------------------------------------------------------- */

/* ============ 1)  Auth Service (5000)  ============ */
app.use(
  '/auth',
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:5000',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/auth')   // يرسل  /auth/register  كما هي
  })
);

/* ============ 2)  Vendor Service (5005) ============ */
app.use(
  '/vendors',
  createProxyMiddleware({
    target: process.env.VENDOR_SERVICE_URL || 'http://localhost:5005',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/vendors'),  // 保持 /vendors 前缀
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying request to vendor service: ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error: ${err.message}`);
      res.status(500).json({ error: `Proxy error: ${err.message}` });
    }
  })
);
app.use(
  '/api/v1/vendors',
  createProxyMiddleware({
    target: process.env.VENDOR_SERVICE_URL || 'http://localhost:5005',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => {
      // 将 /api/v1/vendors 替换为 /vendors
      const newPath = path.replace('/api/v1/vendors', '/vendors');
      console.log(`Rewriting API path from ${path} to ${newPath}`);
      return newPath;
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`Proxying API request to vendor service: ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      console.error(`API Proxy error: ${err.message}`);
      res.status(500).json({ error: `API Proxy error: ${err.message}` });
    }
  })
);

/* ============ 3)  Product Service (5003) =========== */
app.use(
  '/products',
  createProxyMiddleware({
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:5003',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/products')
  })
);

/* ============ 4)  User Service (5002) =========== */
app.use(
  '/users',
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:5002',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/users')
  })
);
app.use(
  '/api/v1/users',
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:5002',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => path.replace('/api/v1', ''),
  })
);

/* ============ 5)  Order Service (5004) ============ */
app.use(
  '/orders',
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:5004',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => '/orders' + path
  })
);

/* ============ 6)  Chat Service (5007) ============ */
app.use(
  '/chat',
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL || 'http://localhost:5007',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/chat')
  })
);

/* ============ 7)  Support Service (5008) ============ */
app.use(
  '/support',
  createProxyMiddleware({
    target: process.env.SUPPORT_SERVICE_URL || 'http://localhost:5008',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/support')
  })
);

/* ============ 8)  Upload Service (5009) ============ */
app.use(
  '/upload',
  createProxyMiddleware({
    target: process.env.UPLOAD_SERVICE_URL || 'http://localhost:5009',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: (path, req) => path  // لا نحتاج لإضافة بادئة
  })
);

/* ============ 9)  Analytics Service (5010) ============ */
app.use(
  '/analytics',
  createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5010',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: keepPrefix('/analytics')
  })
);

/* لاحقاً يمكن إضافة body-parser لمسارات محليّة فقط (إن وُجدت)
   app.use(express.json()); */

/* ---------------- مسارات محليّة بسيطة ---------------- */
app.get('/',       (_, res) => res.send('✅ API Gateway is running!'));
app.get('/health', (_, res) => res.json({ status: 'ok' }));

/* ----------------   404 احتياطي   ------------------- */
app.use((req, res) => {
  console.log(`⚠️  [Gateway] No route for ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Route not found in API Gateway' });
});

// تشغيل الخادم
const port = process.env.PORT || 5003;
app.listen(port, () => {
  console.log(`✅ API Gateway is running on port ${port}`);
});
