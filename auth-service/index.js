require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// اتصال بقاعدة البيانات
mongoose.connect('mongodb://127.0.0.1:27017/supermall')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// استدعاء الراوتات مباشرة (بدون بادئة /api/auth هنا)
app.use(require('./routes/authRoutes'));

// راوت تراك بسيطة للتأكد من تشغيل السيرفر
app.get('/', (req, res) => {
  res.send('Auth Service is running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
