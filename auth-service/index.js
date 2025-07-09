// auth-service/index.js
require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('DB_HOST:', process.env.DB_HOST);
const express = require('express');
const { pool, testConnection } = require('./config/database');
const { User } = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
app.use(express.json());

// روت صحيّة (اختياري) يردّ نصًّا بسيطًا عند GET /
app.get('/', (req, res) => {
  res.send('✅ Auth Service is running!');
});

// هنا نثبت كل مسارات المصادقة تحت البادئة /auth
app.use('/auth', authRoutes);

// مسارات البروفايل (محميّة بالتوكن) تحت نفس البادئة /auth (داخل authRoutes يستعمل profileRoutes)
app.use('/auth', profileRoutes);

// اختبار الاتصال بقاعدة البيانات MySQL
testConnection()
  .then(() => {
    console.log('✅ [Auth] Connected to MySQL');
    
    // إنشاء حساب المسؤول إذا لم يكن موجودًا
    User.createAdminIfNotExists()
      .then(created => {
        if (created) {
          console.log('✅ [Auth] تم إنشاء حساب المسؤول بنجاح');
        } else {
          console.log('ℹ️ [Auth] حساب المسؤول موجود بالفعل');
        }
      })
      .catch(err => console.error('❌ [Auth] خطأ في إنشاء حساب المسؤول:', err));
  })
  .catch(err => console.error('❌ [Auth] MySQL connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 [Auth] Service running on port ${PORT}`);
});
