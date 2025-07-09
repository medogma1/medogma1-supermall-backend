// user-service/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// نموذج العنوان
const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'الاسم الكامل مطلوب']
  },
  addressLine1: {
    type: String,
    required: [true, 'سطر العنوان الأول مطلوب']
  },
  addressLine2: {
    type: String
  },
  city: {
    type: String,
    required: [true, 'المدينة مطلوبة']
  },
  state: {
    type: String,
    required: [true, 'المحافظة/الولاية مطلوبة']
  },
  postalCode: {
    type: String,
    required: [true, 'الرمز البريدي مطلوب']
  },
  country: {
    type: String,
    required: [true, 'البلد مطلوب']
  },
  phoneNumber: {
    type: String,
    required: [true, 'رقم الهاتف مطلوب']
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

// نموذج المستخدم
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'الاسم الأول مطلوب'],
      trim: true,
      maxlength: [50, 'يجب ألا يتجاوز الاسم الأول 50 حرفًا']
    },
    lastName: {
      type: String,
      required: [true, 'الاسم الأخير مطلوب'],
      trim: true,
      maxlength: [50, 'يجب ألا يتجاوز الاسم الأخير 50 حرفًا']
    },
    username: {
      type: String,
      required: [true, 'اسم المستخدم مطلوب'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'يجب أن يكون اسم المستخدم على الأقل 3 أحرف'],
      maxlength: [30, 'يجب ألا يتجاوز اسم المستخدم 30 حرفًا'],
      match: [/^[a-zA-Z0-9_\.]+$/, 'اسم المستخدم يمكن أن يحتوي فقط على أحرف وأرقام ونقاط وشرطات سفلية']
    },
    email: {
      type: String,
      required: [true, 'البريد الإلكتروني مطلوب'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'يرجى إدخال بريد إلكتروني صالح']
    },
    password: {
      type: String,
      required: [true, 'كلمة المرور مطلوبة'],
      minlength: [8, 'يجب أن تكون كلمة المرور على الأقل 8 أحرف'],
      select: false // لا يتم استرجاع كلمة المرور في الاستعلامات
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: 'https://res.cloudinary.com/supermall/image/upload/v1/avatars/default-avatar.png'
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'vendor', 'moderator'],
      default: 'user'
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addresses: [addressSchema],
    defaultAddress: {
      type: mongoose.Schema.Types.ObjectId
    },
    preferences: {
      language: {
        type: String,
        enum: ['ar', 'en'],
        default: 'ar'
      },
      currency: {
        type: String,
        enum: ['EGP', 'USD', 'EUR', 'GBP'],
        default: 'EGP'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: true
        },
        push: {
          type: Boolean,
          default: true
        }
      },
      marketing: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        }
      }
    },
    lastLogin: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
    },
    passwordResetToken: {
      type: String
    },
    passwordResetExpires: {
      type: Date
    },
    emailVerificationToken: {
      type: String
    },
    emailVerificationExpires: {
      type: Date
    },
    phoneVerificationToken: {
      type: String
    },
    phoneVerificationExpires: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
  // فقط إذا تم تعديل كلمة المرور أو كان المستخدم جديدًا
  if (!this.isModified('password')) return next();
  
  // تشفير كلمة المرور
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // تحديث تاريخ تغيير كلمة المرور إذا لم يكن المستخدم جديدًا
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000; // خصم ثانية واحدة لضمان إنشاء الرمز المميز بعد تغيير كلمة المرور
  }
  
  next();
});

// دالة للتحقق من صحة كلمة المرور
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// دالة لإنشاء رمز مميز للمصادقة
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// دالة للتحقق مما إذا تم تغيير كلمة المرور بعد إصدار الرمز المميز
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  
  // كلمة المرور لم تتغير
  return false;
};

// دالة لإنشاء رمز إعادة تعيين كلمة المرور
userSchema.methods.createPasswordResetToken = function() {
  // إنشاء رمز عشوائي
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // تشفير الرمز وتخزينه في قاعدة البيانات
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // تعيين وقت انتهاء صلاحية الرمز (10 دقائق)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
  // إرجاع الرمز غير المشفر
  return resetToken;
};

// دالة لإنشاء رمز التحقق من البريد الإلكتروني
userSchema.methods.createEmailVerificationToken = function() {
  // إنشاء رمز عشوائي
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // تشفير الرمز وتخزينه في قاعدة البيانات
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // تعيين وقت انتهاء صلاحية الرمز (24 ساعة)
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  
  // إرجاع الرمز غير المشفر
  return verificationToken;
};

// دالة لإنشاء رمز التحقق من رقم الهاتف
userSchema.methods.createPhoneVerificationToken = function() {
  // إنشاء رمز عشوائي من 6 أرقام
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  
  // تشفير الرمز وتخزينه في قاعدة البيانات
  this.phoneVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // تعيين وقت انتهاء صلاحية الرمز (10 دقائق)
  this.phoneVerificationExpires = Date.now() + 10 * 60 * 1000;
  
  // إرجاع الرمز غير المشفر
  return verificationToken;
};

// دالة لإضافة عنوان جديد
userSchema.methods.addAddress = function(address) {
  // إذا كان هذا هو العنوان الأول، اجعله العنوان الافتراضي
  if (this.addresses.length === 0) {
    address.isDefault = true;
  }
  
  this.addresses.push(address);
  
  // إذا كان العنوان الجديد هو العنوان الافتراضي، قم بتحديث defaultAddress
  if (address.isDefault) {
    // إلغاء تعيين العنوان الافتراضي السابق
    this.addresses.forEach(addr => {
      if (addr._id.toString() !== this.addresses[this.addresses.length - 1]._id.toString()) {
        addr.isDefault = false;
      }
    });
    
    this.defaultAddress = this.addresses[this.addresses.length - 1]._id;
  }
  
  return this;
};

// دالة لتحديث عنوان موجود
userSchema.methods.updateAddress = function(addressId, updatedAddress) {
  const addressIndex = this.addresses.findIndex(addr => addr._id.toString() === addressId);
  
  if (addressIndex === -1) {
    throw new Error('العنوان غير موجود');
  }
  
  // تحديث العنوان
  Object.keys(updatedAddress).forEach(key => {
    this.addresses[addressIndex][key] = updatedAddress[key];
  });
  
  // إذا تم تعيين العنوان كعنوان افتراضي، قم بتحديث defaultAddress
  if (updatedAddress.isDefault) {
    // إلغاء تعيين العنوان الافتراضي السابق
    this.addresses.forEach(addr => {
      if (addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
    
    this.defaultAddress = addressId;
  }
  
  return this;
};

// دالة لحذف عنوان
userSchema.methods.removeAddress = function(addressId) {
  const addressIndex = this.addresses.findIndex(addr => addr._id.toString() === addressId);
  
  if (addressIndex === -1) {
    throw new Error('العنوان غير موجود');
  }
  
  // إذا كان العنوان المراد حذفه هو العنوان الافتراضي، قم بتعيين عنوان آخر كعنوان افتراضي
  if (this.addresses[addressIndex].isDefault && this.addresses.length > 1) {
    // تعيين العنوان الأول كعنوان افتراضي
    const newDefaultIndex = addressIndex === 0 ? 1 : 0;
    this.addresses[newDefaultIndex].isDefault = true;
    this.defaultAddress = this.addresses[newDefaultIndex]._id;
  } else if (this.addresses.length === 1) {
    // إذا كان هذا هو العنوان الوحيد، قم بإزالة العنوان الافتراضي
    this.defaultAddress = undefined;
  }
  
  // حذف العنوان
  this.addresses.splice(addressIndex, 1);
  
  return this;
};

// دالة لتعيين عنوان كعنوان افتراضي
userSchema.methods.setDefaultAddress = function(addressId) {
  const addressIndex = this.addresses.findIndex(addr => addr._id.toString() === addressId);
  
  if (addressIndex === -1) {
    throw new Error('العنوان غير موجود');
  }
  
  // إلغاء تعيين العنوان الافتراضي السابق
  this.addresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId;
  });
  
  this.defaultAddress = addressId;
  
  return this;
};

const User = mongoose.model('User', userSchema);

module.exports = User;