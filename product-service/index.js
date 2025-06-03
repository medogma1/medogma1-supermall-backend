require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// الاتصال بقاعدة البيانات
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supermall')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// استدعاء الراوتات
const productRoutes = require('./routes/productRoutes');
app.use('/products', productRoutes);

// راوت للتجربة
app.get('/', (req, res) => {
  res.send('✅ Product Service is up and running!');
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Product Service is running on port ${PORT}`);
});
