require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// 🌐 ميدل ويرز
app.use(cors());
app.use(express.json());

// 🔗 اتصال بقاعدة البيانات MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supermall', {
  // options ممكن تضيف هنا خيارات زي useNewUrlParser لو نسخ قديمة من Mongo
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// 🛣️ استدعاء الراوتات
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/vendors', vendorRoutes);

// 🔍 راوت افتراضي للتجربة
app.get('/', (req, res) => {
  res.send('✅ Vendor Service is up and running!');
});

// 🚀 تشغيل السيرفر
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Vendor Service is running on port ${PORT}`);
});
