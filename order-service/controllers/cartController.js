// order-service/controllers/cartController.js
const cartModel = require('../models/mysql-cart');

// إنشاء أو الحصول على عربة المستخدم
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم مطلوب'
      });
    }
    
    // البحث عن عربة المستخدم أو إنشاء واحدة جديدة إذا لم تكن موجودة
    const result = await cartModel.getUserCart(userId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في الحصول على عربة المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب عربة المستخدم',
      error: error.message
    });
  }
};

// إضافة عنصر إلى العربة
exports.addItemToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id, price, quantity, variant } = req.body;
    
    if (!userId || !product_id || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول المطلوبة غير متوفرة'
      });
    }
    
    // إضافة العنصر إلى العربة باستخدام نموذج MySQL
    const result = await cartModel.addItemToCart(userId, {
      product_id,
      price,
      quantity,
      variant
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تمت إضافة العنصر إلى العربة بنجاح',
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في إضافة عنصر إلى العربة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة العنصر إلى العربة',
      error: error.message
    });
  }
};

// تحديث كمية عنصر في العربة
exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (!userId || !itemId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول المطلوبة غير متوفرة'
      });
    }
    
    // تحديث كمية العنصر في العربة باستخدام نموذج MySQL
    const result = await cartModel.updateCartItemQuantity(userId, itemId, quantity);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: quantity <= 0 ? 'تمت إزالة العنصر من العربة بنجاح' : 'تم تحديث كمية العنصر بنجاح',
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في تحديث كمية العنصر في العربة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث كمية العنصر',
      error: error.message
    });
  }
};

// إزالة عنصر من العربة
exports.removeItemFromCart = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم ومعرف العنصر مطلوبان'
      });
    }
    
    // إزالة العنصر من العربة باستخدام نموذج MySQL
    const result = await cartModel.removeItemFromCart(userId, itemId);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تمت إزالة العنصر من العربة بنجاح',
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في إزالة عنصر من العربة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إزالة العنصر من العربة',
      error: error.message
    });
  }
};

// تفريغ العربة
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم مطلوب'
      });
    }
    
    // تفريغ العربة باستخدام نموذج MySQL
    const result = await cartModel.clearCart(userId);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تفريغ العربة بنجاح',
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في تفريغ العربة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تفريغ العربة',
      error: error.message
    });
  }
};

// تطبيق كوبون على العربة
exports.applyCoupon = async (req, res) => {
  try {
    const { userId } = req.params;
    const { couponCode, discount } = req.body;
    
    if (!userId || !couponCode || !discount) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول المطلوبة غير متوفرة'
      });
    }
    
    // تطبيق الكوبون على العربة باستخدام نموذج MySQL
    const result = await cartModel.applyCoupon(userId, couponCode, discount);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تطبيق الكوبون بنجاح',
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في تطبيق الكوبون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تطبيق الكوبون',
      error: error.message
    });
  }
};

// إزالة كوبون الخصم من العربة
exports.removeCoupon = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم مطلوب'
      });
    }
    
    // إزالة الكوبون من العربة باستخدام نموذج MySQL
    const result = await cartModel.removeCoupon(userId);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم إزالة الكوبون بنجاح',
      data: result.cart
    });
  } catch (error) {
    console.error('خطأ في إزالة الكوبون:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إزالة الكوبون',
      error: error.message
    });
  }
};

// التحقق من صلاحية عناصر العربة
exports.validateCartItems = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم مطلوب'
      });
    }
    
    // التحقق من صلاحية عناصر العربة باستخدام نموذج MySQL
    const result = await cartModel.validateCartItems(userId);
    
    if (!result.success) {
      return res.status(result.status || 500).json({
        success: false,
        message: result.error
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.validationResult
    });
  } catch (error) {
    console.error('خطأ في التحقق من صلاحية عناصر العربة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من صلاحية عناصر العربة',
      error: error.message
    });
  }
};