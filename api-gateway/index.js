require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// متغيرات البيئة
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const VENDOR_SERVICE_URL = process.env.VENDOR_SERVICE_URL;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;

app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.originalUrl}`);
  next();
});

// AUTH
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' }
  })
);

// VENDOR
app.use(
  '/api/vendors',
  createProxyMiddleware({
    target: VENDOR_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/vendors': '' }
  })
);

// PRODUCT ✅ أضف هذا الجزء لو مش موجود
app.use(
  '/api/products',
  createProxyMiddleware({
    target: PRODUCT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/products': '' }
  })
);

// Default Route
app.get('/', (req, res) => {
  res.send('API Gateway is running!');
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
