// controllers/orderController.js
const { Order } = require('../models/mysql-order');

// 🟢 إنشاء طلب جديد
exports.createOrder = async (req, res) => {
  try {
    console.log('[Orders] Creating order with data:', req.body);
    const { userId, productId, quantity, price, shippingAddressId, notes, discountApplied, couponCode, taxAmount, currency } = req.body;

    // التحقق من البيانات المطلوبة
    if (!userId) {
      console.error('[Orders] Missing userId');
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required',
        error: 'MISSING_USER_ID'
      });
    }
    if (!productId) {
      console.error('[Orders] Missing productId');
      return res.status(400).json({ 
        success: false,
        message: 'Product ID is required',
        error: 'MISSING_PRODUCT_ID'
      });
    }
    if (!quantity || quantity < 1) {
      console.error('[Orders] Invalid quantity:', quantity);
      return res.status(400).json({ 
        success: false,
        message: 'Quantity must be at least 1',
        error: 'INVALID_QUANTITY'
      });
    }
    if (!price || price < 0) {
      console.error('[Orders] Invalid price:', price);
      return res.status(400).json({ 
        success: false,
        message: 'Price cannot be negative',
        error: 'INVALID_PRICE'
      });
    }
    if (!shippingAddressId) {
      console.error('[Orders] Missing shippingAddressId');
      return res.status(400).json({ 
        success: false,
        message: 'Shipping address ID is required',
        error: 'MISSING_SHIPPING_ADDRESS'
      });
    }

    const orderData = {
      userId: parseInt(userId),
      productId: parseInt(productId),
      quantity: parseInt(quantity),
      price: parseFloat(price),
      shippingAddressId: parseInt(shippingAddressId),
      notes: notes || null,
      discountApplied: discountApplied || 0,
      couponCode: couponCode || null,
      taxAmount: taxAmount || 0,
      currency: currency || 'USD',
      status: 'pending',
      orderDate: new Date()
    };

    console.log('[Orders] Order data to create:', orderData);
    const savedOrder = await Order.create(orderData);
    console.log('[Orders] Order created successfully:', savedOrder);
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: savedOrder
    });
  } catch (err) {
    console.error('[Orders] Failed to create order:', err);
    console.error('[Orders] Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create order',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 🟡 جلب كل الطلبات
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const options = {
      page,
      limit,
      status
    };
    
    const orders = await Order.findAll(options);
    res.json({ orders, pagination: { page, limit } });
  } catch (err) {
    console.error('[Orders] Failed to fetch orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🔵 جلب طلب محدد
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json(order);
  } catch (err) {
    console.error('[Orders] Failed to fetch order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🟠 جلب طلبات المستخدم
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const options = {
      page,
      limit,
      status
    };
    
    const result = await Order.findByUserId(userId, options);
    res.json(result);
  } catch (err) {
    console.error('[Orders] Failed to fetch user orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🔴 تحديث حالة الطلب
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const updatedOrder = await Order.updateStatus(req.params.id, status);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('[Orders] Failed to update order status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🟣 إلغاء الطلب
exports.cancelOrder = async (req, res) => {
  try {
    // التحقق من وجود الطلب وإمكانية إلغاؤه
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (!order.canBeCancelled()) {
      return res.status(400).json({ error: 'Order cannot be cancelled in its current status' });
    }
    
    const cancelledOrder = await Order.updateStatus(req.params.id, 'cancelled');
    res.json(cancelledOrder);
  } catch (err) {
    console.error('[Orders] Failed to cancel order:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// 🟤 إرجاع الطلب
exports.returnOrder = async (req, res) => {
  try {
    // التحقق من وجود الطلب وإمكانية إرجاعه
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (!order.canBeReturned()) {
      return res.status(400).json({ error: 'Order cannot be returned in its current status' });
    }
    
    const returnedOrder = await Order.updateStatus(req.params.id, 'returned');
    res.json(returnedOrder);
  } catch (err) {
    console.error('[Orders] Failed to return order:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// 🟦 تحديث معلومات الشحن
exports.updateShippingInfo = async (req, res) => {
  try {
    const { estimatedDeliveryDate } = req.body;
    
    const updatedOrder = await Order.update(req.params.id, {
      estimatedDeliveryDate
    });
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('[Orders] Failed to update shipping info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🟨 تحديث معلومات الدفع
exports.updatePaymentInfo = async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    const updatedOrder = await Order.update(req.params.id, { paymentId });
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('[Orders] Failed to update payment info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🟩 جلب طلبات البائع
exports.getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const options = {
      page,
      limit,
      status
    };
    
    const orders = await Order.findByVendorId(vendorId, options);
    res.json({ orders, pagination: { page, limit } });
  } catch (err) {
    console.error('[Orders] Failed to fetch vendor orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🔄 تحديث طلب
exports.updateOrder = async (req, res) => {
  try {
    const updateData = req.body;
    
    const updatedOrder = await Order.update(req.params.id, updateData);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('[Orders] Failed to update order:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// 🗑️ حذف طلب
exports.deleteOrder = async (req, res) => {
  try {
    const deleted = await Order.delete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error('[Orders] Failed to delete order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
