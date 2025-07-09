// order-service/models/Cart.js
const mongoose = require('mongoose');

// نموذج عنصر العربة
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'السعر لا يمكن أن يكون سالبًا']
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'الكمية يجب أن تكون على الأقل 1'],
    default: 1
  },
  variant: {
    color: String,
    size: String,
    style: String,
    other: mongoose.Schema.Types.Mixed
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  inStock: {
    type: Boolean,
    default: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// نموذج العربة
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0
    },
    totalItems: {
      type: Number,
      default: 0
    },
    couponCode: {
      type: String
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

// دالة لحساب المجموع الفرعي والعدد الإجمالي للعناصر
cartSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  this.totalItems = this.items.reduce((count, item) => count + item.quantity, 0);
  return this;
};

// دالة لإضافة عنصر إلى العربة
cartSchema.methods.addItem = function(item) {
  // البحث عن العنصر في العربة
  const existingItemIndex = this.items.findIndex(
    i => i.product.toString() === item.product.toString() && 
    JSON.stringify(i.variant) === JSON.stringify(item.variant)
  );
  
  if (existingItemIndex > -1) {
    // إذا كان العنصر موجودًا بالفعل، قم بزيادة الكمية
    this.items[existingItemIndex].quantity += item.quantity;
    this.items[existingItemIndex].subtotal = this.items[existingItemIndex].price * this.items[existingItemIndex].quantity;
  } else {
    // إذا لم يكن العنصر موجودًا، أضفه إلى العربة
    item.subtotal = item.price * item.quantity;
    this.items.push(item);
  }
  
  // تحديث المجموع الفرعي والعدد الإجمالي للعناصر
  this.calculateTotals();
  this.lastActive = new Date();
  
  return this;
};

// دالة لتحديث كمية عنصر في العربة
cartSchema.methods.updateItemQuantity = function(itemId, quantity) {
  const item = this.items.id(itemId);
  
  if (!item) {
    throw new Error('العنصر غير موجود في العربة');
  }
  
  if (quantity <= 0) {
    // إذا كانت الكمية صفرًا أو أقل، قم بإزالة العنصر
    return this.removeItem(itemId);
  }
  
  // تحديث الكمية والمجموع الفرعي للعنصر
  item.quantity = quantity;
  item.subtotal = item.price * quantity;
  
  // تحديث المجموع الفرعي والعدد الإجمالي للعناصر
  this.calculateTotals();
  this.lastActive = new Date();
  
  return this;
};

// دالة لإزالة عنصر من العربة
cartSchema.methods.removeItem = function(itemId) {
  this.items.pull(itemId);
  
  // تحديث المجموع الفرعي والعدد الإجمالي للعناصر
  this.calculateTotals();
  this.lastActive = new Date();
  
  return this;
};

// دالة لتفريغ العربة
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.subtotal = 0;
  this.totalItems = 0;
  this.couponCode = null;
  this.discountAmount = 0;
  this.lastActive = new Date();
  
  return this;
};

// دالة لتطبيق كوبون خصم
cartSchema.methods.applyCoupon = function(couponCode, discountAmount) {
  this.couponCode = couponCode;
  this.discountAmount = discountAmount;
  
  return this;
};

// دالة لإزالة كوبون الخصم
cartSchema.methods.removeCoupon = function() {
  this.couponCode = null;
  this.discountAmount = 0;
  
  return this;
};

// دالة للتحقق من صلاحية العناصر في العربة
cartSchema.methods.validateItems = async function() {
  const Product = mongoose.model('Product');
  const invalidItems = [];
  
  for (const item of this.items) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      // إذا لم يعد المنتج موجودًا
      invalidItems.push({
        item,
        reason: 'المنتج غير موجود'
      });
      continue;
    }
    
    if (!product.inStock) {
      // إذا لم يعد المنتج متوفرًا في المخزون
      item.inStock = false;
      invalidItems.push({
        item,
        reason: 'المنتج غير متوفر في المخزون'
      });
      continue;
    }
    
    if (product.stockQuantity < item.quantity) {
      // إذا كانت كمية المنتج المتوفرة أقل من الكمية المطلوبة
      invalidItems.push({
        item,
        reason: 'الكمية المطلوبة غير متوفرة',
        availableQuantity: product.stockQuantity
      });
      continue;
    }
    
    if (product.price !== item.price) {
      // إذا تغير سعر المنتج
      item.price = product.price;
      item.subtotal = item.price * item.quantity;
      invalidItems.push({
        item,
        reason: 'تم تحديث السعر',
        oldPrice: item.price,
        newPrice: product.price
      });
    }
  }
  
  // تحديث المجموع الفرعي والعدد الإجمالي للعناصر
  this.calculateTotals();
  this.lastActive = new Date();
  
  return invalidItems;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;