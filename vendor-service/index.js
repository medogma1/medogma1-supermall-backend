// vendor-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// استيراد ملفات التكوين والتسجيل
const config = require('./config');
const logger = require('./logger');
const { testConnection } = require('./config/database');

// استيراد الوسائط البرمجية للمصادقة
const authMiddleware = require('./middleware/authMiddleware');

// استيراد مسارات API
const vendorRoutes = require('./routes/vendorRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

// إنشاء تطبيق Express
const app = express();

// الوسائط البرمجية
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مجلد الملفات الثابتة للصور المرفوعة
app.use('/uploads', express.static(path.join(__dirname, config.uploadsPath)));

// روت صحيّة (اختياري) يردّ نصًّا بسيطًا عند GET /
app.get('/', (req, res) => {
  res.send('✅ Vendor Service is up and running!');
});

// مسار صحي لا يحتاج إلى مصادقة
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'vendor-service' });
});

// هنا نثبت كل مسارات Vendor تحت البادئة /vendors
app.use('/vendors', vendorRoutes);

// هنا نثبت كل مسارات Service تحت البادئة /services
app.use('/services', serviceRoutes);

// اختبار الاتصال بقاعدة البيانات MySQL
async function startServer() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    const connected = await testConnection();
    if (!connected) {
      logger.error('❌ [Vendor] Failed to connect to MySQL database. Exiting...');
      process.exit(1);
    }
    
    // بدء تشغيل الخادم
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.info(`🚀 [Vendor] Service running on port ${PORT} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    logger.error(`❌ [Vendor] Server startup error: ${error.message}`);
    process.exit(1);
  }
}

// بدء تشغيل الخادم
startServer();
