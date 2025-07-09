// product-service/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');

const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const searchRoutes = require('./routes/searchRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');

const app = express();

// إعدادات CORS
app.use(cors());

// معالجة البيانات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// روت الصحة
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'خدمة المنتجات تعمل بشكل صحيح' });
});

// مسارات المنتجات
app.use('/products', productRoutes);

// مسارات المراجعات
app.use('/reviews', reviewRoutes);

// مسارات البحث
app.use('/search', searchRoutes);

// مسارات الفئات
app.use('/categories', categoryRoutes);

// مسارات المفضلات
app.use('/favorites', favoriteRoutes);

// معالجة الأخطاء
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'حدث خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'المسار غير موجود'
  });
});

// الاتصال بقاعدة البيانات
testConnection()
  .then(connected => {
    if (!connected) {
      console.error('❌ [Product] فشل الاتصال بقاعدة البيانات MySQL');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ [Product] خطأ في الاتصال بقاعدة البيانات MySQL:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 [Product] الخدمة تعمل على المنفذ ${PORT}`);
});
