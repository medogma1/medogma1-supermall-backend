const Product = require('../models/Product');
const mongoose = require('mongoose');

// البحث العام عن المنتجات
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'يرجى إدخال كلمة البحث' });

    const products = await Product.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .populate('categoryId', 'name')
      .populate('vendorId', 'username storeName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء البحث عن المنتجات', error: error.message });
  }
};

// البحث عن المنتجات حسب الفئة
exports.searchProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { q } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'معرف الفئة غير صالح' });
    }

    let query = { categoryId: mongoose.Types.ObjectId(categoryId) };

    // إضافة البحث النصي إذا تم توفير استعلام
    if (q) {
      query.$text = { $search: q };
    }

    const products = await Product.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .populate('categoryId', 'name')
      .populate('vendorId', 'username storeName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء البحث عن المنتجات في الفئة', error: error.message });
  }
};

// البحث عن المنتجات حسب البائع
exports.searchProductsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { q } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ message: 'معرف البائع غير صالح' });
    }

    let query = { vendorId: mongoose.Types.ObjectId(vendorId) };

    // إضافة البحث النصي إذا تم توفير استعلام
    if (q) {
      query.$text = { $search: q };
    }

    const products = await Product.find(query)
      .sort(q ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .populate('categoryId', 'name')
      .populate('vendorId', 'username storeName');

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء البحث عن منتجات البائع', error: error.message });
  }
};

// تصفية المنتجات
exports.filterProducts = async (req, res) => {
  try {
    const { 
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    
    // تصفية حسب الفئة
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.categoryId = mongoose.Types.ObjectId(category);
    }
    
    // تصفية حسب السعر
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // تصفية حسب المخزون
    if (inStock === 'true') query.stockQuantity = { $gt: 0 };

    // خيارات الترتيب
    let sortOptions = { createdAt: -1 }; // الافتراضي: الأحدث أولاً
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortOptions = { price: 1 };
          break;
        case 'price_desc':
          sortOptions = { price: -1 };
          break;
        case 'rating':
          sortOptions = { rating: -1 };
          break;
      }
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('categoryId', 'name')
        .populate('vendorId', 'username storeName'),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تصفية المنتجات', error: error.message });
  }
};