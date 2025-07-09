const mongoose = require('mongoose');

// تعريف الثوابت
const MIN_AMOUNT = 0.0;
const MAX_AMOUNT = 1000000.0;
const DEFAULT_CURRENCY = 'EGP';
const EXPIRY_HOURS = 24;
const SUPPORTED_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP'];

// تعريف نموذج الدفع
const paymentSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: MIN_AMOUNT,
    max: MAX_AMOUNT
  },
  currency: {
    type: String,
    enum: SUPPORTED_CURRENCIES,
    default: DEFAULT_CURRENCY
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  method: {
    type: String,
    enum: ['creditCard', 'debitCard', 'bankTransfer', 'cashOnDelivery', 'wallet', 'applePay', 'googlePay'],
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  paymentGateway: {
    type: String,
    default: null
  },
  gatewayResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  errorMessage: {
    type: String,
    default: null
  },
  refundReason: {
    type: String,
    default: null
  },
  refundAmount: {
    type: Number,
    default: null,
    validate: {
      validator: function(value) {
        return value === null || (value > 0 && value <= this.amount);
      },
      message: 'مبلغ الاسترداد غير صالح'
    }
  },
  refundDate: {
    type: Date,
    default: null,
    validate: {
      validator: function(value) {
        return value === null || value >= this.createdAt;
      },
      message: 'تاريخ الاسترداد يجب أن يكون بعد تاريخ الإنشاء'
    }
  }
}, { timestamps: true });

// التحقق من صحة العملة
paymentSchema.path('currency').validate(function(value) {
  return SUPPORTED_CURRENCIES.includes(value);
}, 'العملة غير مدعومة');

// إضافة طرق مساعدة
paymentSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

paymentSchema.methods.isFailed = function() {
  return this.status === 'failed';
};

paymentSchema.methods.isPending = function() {
  return this.status === 'pending';
};

paymentSchema.methods.isProcessing = function() {
  return this.status === 'processing';
};

paymentSchema.methods.isRefunded = function() {
  return this.status === 'refunded';
};

paymentSchema.methods.isCancelled = function() {
  return this.status === 'cancelled';
};

paymentSchema.methods.isOnlinePayment = function() {
  return ['creditCard', 'debitCard', 'bankTransfer', 'applePay', 'googlePay'].includes(this.method);
};

paymentSchema.methods.isCashPayment = function() {
  return this.method === 'cashOnDelivery';
};

paymentSchema.methods.isWalletPayment = function() {
  return this.method === 'wallet';
};

paymentSchema.methods.isDigitalWalletPayment = function() {
  return ['applePay', 'googlePay'].includes(this.method);
};

paymentSchema.methods.isExpired = function() {
  const now = new Date();
  const createdAt = this.createdAt;
  const diffHours = Math.abs(now - createdAt) / 36e5; // 36e5 is the number of milliseconds in an hour
  return diffHours >= EXPIRY_HOURS;
};

paymentSchema.methods.canBeRefunded = function() {
  return this.isCompleted() && !this.isRefunded() && !this.isCancelled();
};

paymentSchema.methods.hasError = function() {
  return this.errorMessage !== null && this.errorMessage.trim() !== '';
};

paymentSchema.methods.getRefundPercentage = function() {
  return this.refundAmount !== null ? (this.refundAmount / this.amount) * 100 : 0;
};

paymentSchema.methods.getStatusText = function() {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'completed': 'مكتمل',
    'failed': 'فشل',
    'refunded': 'مسترد',
    'cancelled': 'ملغي'
  };
  return statusMap[this.status] || this.status;
};

paymentSchema.methods.getMethodText = function() {
  const methodMap = {
    'creditCard': 'بطاقة ائتمان',
    'debitCard': 'بطاقة خصم',
    'bankTransfer': 'تحويل بنكي',
    'cashOnDelivery': 'الدفع عند الاستلام',
    'wallet': 'المحفظة',
    'applePay': 'Apple Pay',
    'googlePay': 'Google Pay'
  };
  return methodMap[this.method] || this.method;
};

// إنشاء النموذج
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;