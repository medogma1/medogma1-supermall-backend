require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// لا تضع app.use(express.json()) هنا!

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

// لوج لأي طلب جاي للبوابة
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/', (req, res) => {
  res.send('API Gateway is running!');
});

// حل مشاكل JSON body في proxy:
app.use(
  '/api/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '' },
    onProxyReq: (proxyReq, req, res) => {
      if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
        let bodyData = '';
        req.on('data', chunk => {
          bodyData += chunk;
        });
        req.on('end', () => {
          if (bodyData) {
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            proxyReq.write(bodyData);
          }
        });
      }
    }
  })
);

// (لو عندك خدمات تانية أضفها بنفس الطريقة)

// تشغيل البوابة
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
