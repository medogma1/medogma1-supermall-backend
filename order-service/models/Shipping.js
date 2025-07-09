const mongoose = require('mongoose');

// تعريف نموذج عنوان الشحن
const shippingAddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  buildingNumber: {
    type: String,
    trim: true
  },
  apartmentNumber: {
    type: String,
    trim: true
  },
  landmark: {
    type: String,
    trim: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  }
});

// تعريف نموذج الشحن
const shippingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  deliveryAddress: {
    type: shippingAddressSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'inTransit', 'outForDelivery', 'delivered', 'failed', 'returned', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: {
    type: String,
    default: null
  },
  carrier: {
    type: String,
    default: null
  },
  estimatedDeliveryTime: {
    type: Number,
    default: null
  },
  shippingCost: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryNotes: {
    type: String,
    default: null
  }
}, { timestamps: true });

// إضافة طرق مساعدة
shippingSchema.methods.getStatusText = function() {
  const statusMap = {
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'inTransit': 'في الطريق',
    'outForDelivery': 'خارج للتوصيل',
    'delivered': 'تم التوصيل',
    'failed': 'فشل التوصيل',
    'returned': 'تم الإرجاع',
    'cancelled': 'تم الإلغاء'
  };
  return statusMap[this.status] || this.status;
};

shippingSchema.methods.getFullAddress = function() {
  const address = this.deliveryAddress;
  let fullAddress = `${address.street}`;
  
  if (address.buildingNumber) {
    fullAddress += `, مبنى ${address.buildingNumber}`;
  }
  
  if (address.apartmentNumber) {
    fullAddress += `, شقة ${address.apartmentNumber}`;
  }
  
  fullAddress += `, ${address.city}, ${address.state}, ${address.country}, ${address.postalCode}`;
  
  if (address.landmark) {
    fullAddress += ` (بالقرب من ${address.landmark})`;
  }
  
  return fullAddress;
};

shippingSchema.methods.isDelivered = function() {
  return this.status === 'delivered';
};

shippingSchema.methods.isInTransit = function() {
  return ['inTransit', 'outForDelivery'].includes(this.status);
};

shippingSchema.methods.isFailed = function() {
  return this.status === 'failed';
};

shippingSchema.methods.isReturned = function() {
  return this.status === 'returned';
};

shippingSchema.methods.isCancelled = function() {
  return this.status === 'cancelled';
};

shippingSchema.methods.hasTrackingInfo = function() {
  return this.trackingNumber !== null && this.trackingNumber.trim() !== '';
};

// إنشاء النموذج
const ShippingAddress = mongoose.model('ShippingAddress', shippingAddressSchema);
const Shipping = mongoose.model('Shipping', shippingSchema);

module.exports = {
  ShippingAddress,
  Shipping
};