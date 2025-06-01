const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // مهم لتحليل JSON في body

// استدعاء راوتات المنتجات
const productRoutes = require('./routes/productRoutes');
app.use('/', productRoutes);

// راوت رئيسي للتجربة
app.get('/', (req, res) => {
  res.send('Product Service is running!');
});

// تشغيل السيرفر على بورت مختلف عن الخدمات الأخرى (مثلاً 5002)
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Product Service is running on port ${PORT}`);
});
