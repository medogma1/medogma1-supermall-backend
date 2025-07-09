// models/Order.js
const mongoose = require('mongoose');

// Constants
const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned'
};

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  productId: {
    type: String,
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.PENDING,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'EGP',
    enum: ['EGP', 'USD', 'EUR', 'GBP']
  },
  shippingAddressId: {
    type: String,
    required: [true, 'Shipping address ID is required']
  },
  paymentId: {
    type: String
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  discountApplied: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  couponCode: {
    type: String
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  estimatedDeliveryDate: {
    type: Date
  }
}, { timestamps: true });

// Helper methods
orderSchema.methods.isPending = function() {
  return this.status === STATUS.PENDING;
};

orderSchema.methods.isConfirmed = function() {
  return this.status === STATUS.CONFIRMED;
};

orderSchema.methods.isShipped = function() {
  return this.status === STATUS.SHIPPED;
};

orderSchema.methods.isDelivered = function() {
  return this.status === STATUS.DELIVERED;
};

orderSchema.methods.isCancelled = function() {
  return this.status === STATUS.CANCELLED;
};

orderSchema.methods.isReturned = function() {
  return this.status === STATUS.RETURNED;
};

orderSchema.methods.getStatusText = function() {
  switch (this.status) {
    case STATUS.PENDING: return 'Pending';
    case STATUS.CONFIRMED: return 'Confirmed';
    case STATUS.SHIPPED: return 'Shipped';
    case STATUS.DELIVERED: return 'Delivered';
    case STATUS.CANCELLED: return 'Cancelled';
    case STATUS.RETURNED: return 'Returned';
    default: return 'Unknown';
  }
};

orderSchema.methods.calculateTotalAmount = function() {
  return (this.price * this.quantity) - this.discountApplied + this.taxAmount;
};

orderSchema.methods.canBeCancelled = function() {
  return this.status === STATUS.PENDING || this.status === STATUS.CONFIRMED;
};

orderSchema.methods.canBeReturned = function() {
  return this.status === STATUS.DELIVERED;
};

// Pre-save hook to calculate total amount if not provided
orderSchema.pre('save', function(next) {
  if (!this.totalAmount) {
    this.totalAmount = this.calculateTotalAmount();
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = {
  Order,
  STATUS
};
