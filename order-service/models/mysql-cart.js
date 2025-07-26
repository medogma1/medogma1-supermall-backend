// order-service/models/mysql-cart.js
const { pool } = require('../config/database');
require('dotenv').config();

/**
 * إنشاء عربة تسوق جديدة للمستخدم
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function createCart(userId) {
  try {
    // التحقق من وجود عربة للمستخدم
    const [existingCarts] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ? AND status = "active"',
      [userId]
    );
    
    if (existingCarts.length > 0) {
      return { success: true, cart: existingCarts[0] };
    }
    
    // إنشاء عربة جديدة
    const [result] = await pool.execute(
      'INSERT INTO carts (user_id, subtotal, total_items, status) VALUES (?, 0, 0, "active")',
      [userId]
    );
    
    const [newCart] = await pool.execute(
      'SELECT * FROM carts WHERE id = ?',
      [result.insertId]
    );
    
    return { success: true, cart: newCart[0] };
  } catch (error) {
    console.error('خطأ في إنشاء عربة التسوق:', error);
    return { success: false, error: error.message };
  }
}

/**
 * الحصول على عربة التسوق النشطة للمستخدم مع العناصر
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function getUserCart(userId) {
  try {
    // الحصول على العربة
    const [carts] = await pool.execute(
      'SELECT * FROM carts WHERE user_id = ? AND status = "active"',
      [userId]
    );
    
    if (carts.length === 0) {
      // إنشاء عربة جديدة إذا لم تكن موجودة
      return await createCart(userId);
    }
    
    const cart = carts[0];
    
    // الحصول على عناصر العربة
    const [items] = await pool.execute(
      `SELECT ci.*, p.name, p.image, v.name as vendor_name 
       FROM cart_items ci 
       LEFT JOIN products p ON ci.product_id = p.id 
       LEFT JOIN vendors v ON p.vendor_id = v.id 
       WHERE ci.cart_id = ?`,
      [cart.id]
    );
    
    // تحويل البيانات المخزنة بتنسيق JSON إلى كائنات JavaScript
    const formattedItems = items.map(item => ({
      ...item,
      variant: item.variant ? JSON.parse(item.variant) : null
    }));
    
    return { 
      success: true, 
      cart: {
        ...cart,
        items: formattedItems
      }
    };
  } catch (error) {
    console.error('خطأ في الحصول على عربة التسوق:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إضافة عنصر إلى عربة التسوق
 * @param {number} userId - معرف المستخدم
 * @param {Object} itemData - بيانات العنصر
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function addItemToCart(userId, itemData) {
  try {
    const { product_id, price, quantity, variant } = itemData;
    
    // الحصول على العربة أو إنشاء واحدة جديدة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    const subtotal = price * quantity;
    
    // التحقق مما إذا كان العنصر موجودًا بالفعل
    const variantJSON = variant ? JSON.stringify(variant) : null;
    const [existingItems] = await pool.execute(
      'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ? AND variant = ?',
      [cart.id, product_id, variantJSON]
    );
    
    if (existingItems.length > 0) {
      // تحديث العنصر الموجود
      const existingItem = existingItems[0];
      const newQuantity = existingItem.quantity + quantity;
      const newSubtotal = price * newQuantity;
      
      await pool.execute(
        'UPDATE cart_items SET quantity = ?, subtotal = ? WHERE id = ?',
        [newQuantity, newSubtotal, existingItem.id]
      );
    } else {
      // إضافة عنصر جديد
      await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, price, quantity, variant, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [cart.id, product_id, price, quantity, variantJSON, subtotal]
      );
    }
    
    // تحديث إجماليات العربة
    await updateCartTotals(cart.id);
    
    // إعادة الحصول على العربة المحدثة
    return await getUserCart(userId);
  } catch (error) {
    console.error('خطأ في إضافة عنصر إلى العربة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث كمية عنصر في العربة
 * @param {number} userId - معرف المستخدم
 * @param {number} itemId - معرف العنصر
 * @param {number} quantity - الكمية الجديدة
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function updateCartItemQuantity(userId, itemId, quantity) {
  try {
    // التحقق من وجود العربة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    
    // التحقق من وجود العنصر
    const [items] = await pool.execute(
      'SELECT * FROM cart_items WHERE id = ? AND cart_id = ?',
      [itemId, cart.id]
    );
    
    if (items.length === 0) {
      return { success: false, error: 'العنصر غير موجود في العربة' };
    }
    
    const item = items[0];
    
    if (quantity <= 0) {
      // إزالة العنصر إذا كانت الكمية صفرًا أو أقل
      return await removeCartItem(userId, itemId);
    }
    
    // تحديث الكمية والمجموع الفرعي
    const subtotal = item.price * quantity;
    await pool.execute(
      'UPDATE cart_items SET quantity = ?, subtotal = ? WHERE id = ?',
      [quantity, subtotal, itemId]
    );
    
    // تحديث إجماليات العربة
    await updateCartTotals(cart.id);
    
    // إعادة الحصول على العربة المحدثة
    return await getUserCart(userId);
  } catch (error) {
    console.error('خطأ في تحديث كمية العنصر:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إزالة عنصر من العربة
 * @param {number} userId - معرف المستخدم
 * @param {number} itemId - معرف العنصر
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function removeCartItem(userId, itemId) {
  try {
    // التحقق من وجود العربة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    
    // حذف العنصر
    await pool.execute(
      'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
      [itemId, cart.id]
    );
    
    // تحديث إجماليات العربة
    await updateCartTotals(cart.id);
    
    // إعادة الحصول على العربة المحدثة
    return await getUserCart(userId);
  } catch (error) {
    console.error('خطأ في إزالة العنصر من العربة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تفريغ العربة
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function clearCart(userId) {
  try {
    // التحقق من وجود العربة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    
    // حذف جميع العناصر
    await pool.execute(
      'DELETE FROM cart_items WHERE cart_id = ?',
      [cart.id]
    );
    
    // تحديث إجماليات العربة
    await pool.execute(
      'UPDATE carts SET subtotal = 0, total_items = 0, coupon_code = NULL, discount_amount = 0, updated_at = NOW() WHERE id = ?',
      [cart.id]
    );
    
    // إعادة الحصول على العربة المحدثة
    return await getUserCart(userId);
  } catch (error) {
    console.error('خطأ في تفريغ العربة:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تطبيق كوبون خصم على العربة
 * @param {number} userId - معرف المستخدم
 * @param {string} couponCode - رمز الكوبون
 * @param {number} discountAmount - قيمة الخصم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function applyCoupon(userId, couponCode, discountAmount) {
  try {
    // التحقق من وجود العربة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    
    // تطبيق الكوبون
    await pool.execute(
      'UPDATE carts SET coupon_code = ?, discount_amount = ?, updated_at = NOW() WHERE id = ?',
      [couponCode, discountAmount, cart.id]
    );
    
    // إعادة الحصول على العربة المحدثة
    return await getUserCart(userId);
  } catch (error) {
    console.error('خطأ في تطبيق الكوبون:', error);
    return { success: false, error: error.message };
  }
}

/**
 * إزالة كوبون الخصم من العربة
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function removeCoupon(userId) {
  try {
    // التحقق من وجود العربة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    
    // إزالة الكوبون
    await pool.execute(
      'UPDATE carts SET coupon_code = NULL, discount_amount = 0, updated_at = NOW() WHERE id = ?',
      [cart.id]
    );
    
    // إعادة الحصول على العربة المحدثة
    return await getUserCart(userId);
  } catch (error) {
    console.error('خطأ في إزالة الكوبون:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث إجماليات العربة
 * @param {number} cartId - معرف العربة
 * @returns {Promise<void>}
 */
async function updateCartTotals(cartId) {
  try {
    // حساب المجموع الفرعي وعدد العناصر
    const [subtotalResult] = await pool.execute(
      'SELECT SUM(subtotal) as subtotal, SUM(quantity) as total_items FROM cart_items WHERE cart_id = ?',
      [cartId]
    );
    
    const subtotal = subtotalResult[0].subtotal || 0;
    const totalItems = subtotalResult[0].total_items || 0;
    
    // تحديث العربة
    await pool.execute(
      'UPDATE carts SET subtotal = ?, total_items = ?, updated_at = NOW() WHERE id = ?',
      [subtotal, totalItems, cartId]
    );
  } catch (error) {
    console.error('خطأ في تحديث إجماليات العربة:', error);
    throw error;
  }
}

/**
 * التحقق من صلاحية عناصر العربة
 * @param {number} userId - معرف المستخدم
 * @returns {Promise<Object>} - نتيجة العملية
 */
async function validateCartItems(userId) {
  try {
    // التحقق من وجود العربة
    const cartResult = await getUserCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }
    
    const cart = cartResult.cart;
    
    // الحصول على عناصر العربة
    const [items] = await pool.execute(
      `SELECT ci.*, p.name, p.stock, p.status 
       FROM cart_items ci 
       LEFT JOIN products p ON ci.product_id = p.id 
       WHERE ci.cart_id = ?`,
      [cart.id]
    );
    
    // التحقق من صلاحية كل عنصر
    const invalidItems = [];
    for (const item of items) {
      // التحقق من توفر المخزون
      if (item.stock < item.quantity) {
        invalidItems.push({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          reason: 'الكمية المطلوبة غير متوفرة في المخزون',
          available: item.stock
        });
      }
      
      // التحقق من حالة المنتج
      if (item.status !== 'active') {
        invalidItems.push({
          id: item.id,
          product_id: item.product_id,
          name: item.name,
          reason: 'المنتج غير متاح حاليًا'
        });
      }
    }
    
    return { 
      success: true, 
      validationResult: {
        cart,
        invalidItems,
        isValid: invalidItems.length === 0
      }
    };
  } catch (error) {
    console.error('خطأ في التحقق من صلاحية عناصر العربة:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  pool,
  createCart,
  getUserCart,
  addItemToCart,
  updateCartItemQuantity,
  removeItemFromCart: removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  validateCartItems
};