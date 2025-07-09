const mongoose = require('mongoose');

// نموذج معاملات النقاط
const pointsTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'expire', 'adjustment'],
    required: true
  },
  source: {
    type: String,
    enum: ['purchase', 'referral', 'review', 'promotion', 'manual', 'refund', 'other'],
    required: true
  },
  referenceId: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// نموذج نقاط الولاء
const loyaltyPointsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  lifetimePoints: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  transactions: [pointsTransactionSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// نموذج الكوبونات
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: String
  }],
  applicableProducts: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// نموذج برنامج الإحالة
const referralProgramSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: true
  },
  referrerReward: {
    type: Number,
    required: true,
    min: 0
  },
  refereeReward: {
    type: Number,
    required: true,
    min: 0
  },
  maxReferrals: {
    type: Number,
    default: null
  },
  validDays: {
    type: Number,
    default: 30
  },
  minimumPurchaseAmount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  termsAndConditions: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// إنشاء النماذج
const LoyaltyPoints = mongoose.model('LoyaltyPoints', loyaltyPointsSchema);
const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const ReferralProgram = mongoose.model('ReferralProgram', referralProgramSchema);

module.exports = {
  LoyaltyPoints,
  PointsTransaction,
  Coupon,
  ReferralProgram
};