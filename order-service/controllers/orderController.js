// controllers/orderController.js
const { Order } = require('../models/mysql-order');

// 🟢 إنشاء طلب جديد
exports.createOrder = async (req, res) => {
  try {
    const { userId, productId, quantity, price, shippingAddressId, notes, discountApplied, couponCode, taxAmount, currency } = req.body;

    const orderData = {
      userId,
      productId,
      quantity,
      price,
      shippingAddressId,
      notes,
      discountApplied,
      couponCode,
      taxAmount,
      currency
    };

    const savedOrder = await Order.create(orderData);
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('[Orders] Failed to create order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 🟡 جلب كل الطلبات
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder || 'DESC';
    
    const options = {
      page,
      limit,
      status,
      sortBy,
      sortOrder
    };
    
    const result = await Order.findAll(options);
    res.json(result);
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
    const cancelledOrder = await Order.cancelOrder(req.params.id);
    
    if (!cancelledOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(cancelledOrder);
  } catch (err) {
    console.error('[Orders] Failed to cancel order:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// 🟤 إرجاع الطلب
exports.returnOrder = async (req, res) => {
  try {
    const returnedOrder = await Order.returnOrder(req.params.id);
    
    if (!returnedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(returnedOrder);
  } catch (err) {
    console.error('[Orders] Failed to return order:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

// 🟦 تحديث معلومات الشحن
exports.updateShippingInfo = async (req, res) => {
  try {
    const { trackingNumber, carrier, estimatedDeliveryDate } = req.body;
    
    const updatedOrder = await Order.updateShippingInfo(req.params.id, {
      trackingNumber,
      carrier,
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
    
    const updatedOrder = await Order.updatePaymentInfo(req.params.id, paymentId);
    
    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    console.error('[Orders] Failed to update payment info:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
