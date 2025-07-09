const Product = require('../models/Product');

// إنشاء منتج جديد
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      vendorId,
      categoryId,
      imageUrl,
      stockQuantity,
      tags 
    } = req.body;

    if (!name || !description || !price || !vendorId || !categoryId || !imageUrl) {
      return res.status(400).json({ message: 'جميع الحقول الأساسية مطلوبة' });
    }

    const newProduct = new Product({ 
      name, 
      description, 
      price, 
      vendorId,
      categoryId,
      imageUrl,
      stockQuantity: stockQuantity || 0,
      tags: tags || []
    });

    await newProduct.save();
    res.status(201).json({ message: 'تم إنشاء المنتج بنجاح', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء المنتج', error: error.message });
  }
};

// جلب كل المنتجات مع خيارات التصفية
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      category,
      minPrice,
      maxPrice,
      inStock,
      vendor,
      sortBy,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = {};
    
    // تصفية حسب الفئة
    if (category) query.categoryId = category;
    
    // تصفية حسب السعر
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // تصفية حسب المخزون
    if (inStock === 'true') query.stockQuantity = { $gt: 0 };
    
    // تصفية حسب البائع
    if (vendor) query.vendorId = vendor;

    // البحث في النص
    if (search) {
      query.$text = { $search: search };
    }

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
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتجات', error: error.message });
  }
};

// جلب منتج معين
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('vendorId', 'username storeName');

    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتج', error: error.message });
  }
};

// تحديث منتج
exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json({ message: 'تم تحديث المنتج بنجاح', product });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث المنتج', error: error.message });
  }
};

// حذف منتج
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json({ message: 'تم حذف المنتج بنجاح', product });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج', error: error.message });
  }
};

// البحث عن المنتجات
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
