const mongoose = require('mongoose');

// نموذج المبيعات اليومية
const dailySalesSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  revenue: {
    type: Number,
    required: true,
    default: 0
  },
  orders: {
    type: Number,
    required: true,
    default: 0
  }
});

// نموذج أداء المنتج
const productPerformanceSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  totalSales: {
    type: Number,
    required: true,
    default: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    default: 0
  },
  totalUnits: {
    type: Number,
    required: true,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  }
});

// نموذج شريحة العملاء
const customerSegmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    required: true,
    default: 0
  },
  percentage: {
    type: Number,
    required: true,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  }
});

// نموذج تحليلات المبيعات
const salesAnalyticsSchema = new mongoose.Schema({
  storeId: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalRevenue: {
    type: Number,
    required: true,
    default: 0
  },
  totalOrders: {
    type: Number,
    required: true,
    default: 0
  },
  averageOrderValue: {
    type: Number,
    default: 0
  },
  revenueByCategory: {
    type: Map,
    of: Number,
    default: {}
  },
  ordersByStatus: {
    type: Map,
    of: Number,
    default: {}
  },
  dailySales: [dailySalesSchema]
}, { timestamps: true });

// نموذج تحليلات العملاء
const customerAnalyticsSchema = new mongoose.Schema({
  storeId: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  totalCustomers: {
    type: Number,
    required: true,
    default: 0
  },
  newCustomers: {
    type: Number,
    required: true,
    default: 0
  },
  repeatCustomers: {
    type: Number,
    required: true,
    default: 0
  },
  customerRetentionRate: {
    type: Number,
    default: 0
  },
  customersByRegion: {
    type: Map,
    of: Number,
    default: {}
  },
  segments: [customerSegmentSchema]
}, { timestamps: true });

// نموذج تحليلات المخزون
const inventoryAnalyticsSchema = new mongoose.Schema({
  storeId: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalProducts: {
    type: Number,
    required: true,
    default: 0
  },
  totalStockValue: {
    type: Number,
    required: true,
    default: 0
  },
  lowStockProducts: {
    type: Number,
    required: true,
    default: 0
  },
  outOfStockProducts: {
    type: Number,
    required: true,
    default: 0
  },
  stockByCategory: {
    type: Map,
    of: Number,
    default: {}
  },
  topPerformingProducts: [productPerformanceSchema],
  lowPerformingProducts: [productPerformanceSchema]
}, { timestamps: true });

// إنشاء النماذج
const DailySales = mongoose.model('DailySales', dailySalesSchema);
const ProductPerformance = mongoose.model('ProductPerformance', productPerformanceSchema);
const CustomerSegment = mongoose.model('CustomerSegment', customerSegmentSchema);
const SalesAnalytics = mongoose.model('SalesAnalytics', salesAnalyticsSchema);
const CustomerAnalytics = mongoose.model('CustomerAnalytics', customerAnalyticsSchema);
const InventoryAnalytics = mongoose.model('InventoryAnalytics', inventoryAnalyticsSchema);

module.exports = {
  DailySales,
  ProductPerformance,
  CustomerSegment,
  SalesAnalytics,
  CustomerAnalytics,
  InventoryAnalytics
};