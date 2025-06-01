const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // <-- مهم جدًا جدًا

// استدعاء راوتات المتاجر
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/', vendorRoutes);

// راوت رئيسي بسيط للتجربة
app.get('/', (req, res) => {
  res.send('Vendor Service is running!');
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Vendor Service is running on port ${PORT}`);
});
