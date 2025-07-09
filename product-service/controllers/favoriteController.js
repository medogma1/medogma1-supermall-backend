// product-service/controllers/favoriteController.js
const Favorite = require('../models/Favorite');
const Product = require('../models/Product');

// إضافة عنصر إلى المفضلة
exports.addToFavorites = async (req, res) => {
  try {
    const { userId, itemType, itemId, notes } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المستخدم ونوع العنصر ومعرف العنصر'
      });
    }
    
    // التحقق من وجود العنصر في المفضلة
    const existingFavorite = await Favorite.findOne({ user: userId, itemType, itemId });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'العنصر موجود بالفعل في المفضلة'
      });
    }
    
    // الحصول على بيانات العنصر
    let itemData = {};
    let itemModel = '';
    
    if (itemType === 'product') {
      const product = await Product.findById(itemId);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'لم يتم العثور على المنتج'
        });
      }
      
      itemModel = 'Product';
      itemData = {
        name: product.name,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
        price: product.price,
        currency: product.currency,
        vendor: product.vendor,
        rating: product.rating
      };
    } else if (itemType === 'service') {
      // هنا يمكن إضافة منطق للحصول على بيانات الخدمة
      // سنفترض أن هناك نموذج Service يمكن استخدامه
      const Service = require('../../vendor-service/models/Service');
      const service = await Service.findById(itemId);
      
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'لم يتم العثور على الخدمة'
        });
      }
      
      itemModel = 'Service';
      itemData = {
        name: service.name,
        image: service.images && service.images.length > 0 ? service.images[0] : '',
        price: service.price,
        currency: service.currency,
        vendor: service.vendor,
        rating: service.rating
      };
    } else {
      return res.status(400).json({
        success: false,
        message: 'نوع العنصر غير صالح'
      });
    }
    
    // إنشاء عنصر مفضل جديد
    const favorite = new Favorite({
      user: userId,
      itemType,
      itemId,
      itemModel,
      itemData,
      notes
    });
    
    await favorite.save();
    
    res.status(201).json({
      success: true,
      data: favorite
    });
  } catch (error) {
    console.error('خطأ في إضافة عنصر إلى المفضلة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة العنصر إلى المفضلة',
      error: error.message
    });
  }
};

// إزالة عنصر من المفضلة
exports.removeFromFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    
    const favorite = await Favorite.findByIdAndDelete(id);
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على العنصر في المفضلة'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تمت إزالة العنصر من المفضلة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في إزالة عنصر من المفضلة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إزالة العنصر من المفضلة',
      error: error.message
    });
  }
};

// تبديل حالة العنصر في المفضلة (إضافة أو إزالة)
exports.toggleFavorite = async (req, res) => {
  try {
    const { userId, itemType, itemId } = req.body;
    
    // التحقق من البيانات المطلوبة
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المستخدم ونوع العنصر ومعرف العنصر'
      });
    }
    
    // التحقق من وجود العنصر في المفضلة
    const existingFavorite = await Favorite.findOne({ user: userId, itemType, itemId });
    
    if (existingFavorite) {
      // إذا كان العنصر موجودًا بالفعل، قم بإزالته
      await Favorite.findByIdAndDelete(existingFavorite._id);
      
      return res.status(200).json({
        success: true,
        action: 'removed',
        message: 'تمت إزالة العنصر من المفضلة بنجاح'
      });
    } else {
      // إذا لم يكن العنصر موجودًا، قم بإضافته
      // الحصول على بيانات العنصر
      let itemData = {};
      let itemModel = '';
      
      if (itemType === 'product') {
        const product = await Product.findById(itemId);
        
        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'لم يتم العثور على المنتج'
          });
        }
        
        itemModel = 'Product';
        itemData = {
          name: product.name,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          price: product.price,
          currency: product.currency,
          vendor: product.vendor,
          rating: product.rating
        };
      } else if (itemType === 'service') {
        // هنا يمكن إضافة منطق للحصول على بيانات الخدمة
        const Service = require('../../vendor-service/models/Service');
        const service = await Service.findById(itemId);
        
        if (!service) {
          return res.status(404).json({
            success: false,
            message: 'لم يتم العثور على الخدمة'
          });
        }
        
        itemModel = 'Service';
        itemData = {
          name: service.name,
          image: service.images && service.images.length > 0 ? service.images[0] : '',
          price: service.price,
          currency: service.currency,
          vendor: service.vendor,
          rating: service.rating
        };
      } else {
        return res.status(400).json({
          success: false,
          message: 'نوع العنصر غير صالح'
        });
      }
      
      // إنشاء عنصر مفضل جديد
      const favorite = new Favorite({
        user: userId,
        itemType,
        itemId,
        itemModel,
        itemData
      });
      
      await favorite.save();
      
      return res.status(201).json({
        success: true,
        action: 'added',
        data: favorite,
        message: 'تمت إضافة العنصر إلى المفضلة بنجاح'
      });
    }
  } catch (error) {
    console.error('خطأ في تبديل حالة العنصر في المفضلة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تبديل حالة العنصر في المفضلة',
      error: error.message
    });
  }
};

// الحصول على جميع العناصر المفضلة للمستخدم
exports.getUserFavorites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemType } = req.query;
    
    // إنشاء فلتر للبحث
    const filter = { user: userId };
    
    // إضافة فلتر لنوع العنصر إذا تم تحديده
    if (itemType) {
      filter.itemType = itemType;
    }
    
    // الحصول على العناصر المفضلة
    const favorites = await Favorite.find(filter).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: favorites.length,
      data: favorites
    });
  } catch (error) {
    console.error('خطأ في الحصول على العناصر المفضلة للمستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب العناصر المفضلة',
      error: error.message
    });
  }
};

// التحقق مما إذا كان العنصر مفضلاً للمستخدم
exports.checkIsFavorite = async (req, res) => {
  try {
    const { userId, itemType, itemId } = req.query;
    
    // التحقق من البيانات المطلوبة
    if (!userId || !itemType || !itemId) {
      return res.status(400).json({
        success: false,
        message: 'يرجى توفير معرف المستخدم ونوع العنصر ومعرف العنصر'
      });
    }
    
    // التحقق من وجود العنصر في المفضلة
    const favorite = await Favorite.findOne({ user: userId, itemType, itemId });
    
    res.status(200).json({
      success: true,
      isFavorite: !!favorite,
      favoriteId: favorite ? favorite._id : null
    });
  } catch (error) {
    console.error('خطأ في التحقق من حالة العنصر في المفضلة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من حالة العنصر',
      error: error.message
    });
  }
};

// تحديث ملاحظات العنصر المفضل
exports.updateFavoriteNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const favorite = await Favorite.findByIdAndUpdate(
      id,
      { notes },
      { new: true, runValidators: true }
    );
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على العنصر في المفضلة'
      });
    }
    
    res.status(200).json({
      success: true,
      data: favorite
    });
  } catch (error) {
    console.error('خطأ في تحديث ملاحظات العنصر المفضل:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الملاحظات',
      error: error.message
    });
  }
};