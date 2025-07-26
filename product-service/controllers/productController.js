const Product = require('../models/mysql-product');

// إنشاء منتج جديد
exports.createProduct = async (req, res) => {
  try {
    console.log('[Products] Creating product with data:', req.body);
    console.log('[Products] User info:', req.user);
    
    const { 
      name, 
      description, 
      price, 
      categoryId,
      imageUrl,
      vendorId,
      stock,
      sku,
      weight,
      dimensions,
      stockQuantity,
      tags 
    } = req.body;

    // التحقق من البيانات الأساسية
    if (!name || !description || !price || !categoryId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'جميع الحقول الأساسية مطلوبة (name, description, price, categoryId, imageUrl)',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // التحقق من صحة السعر
    if (price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'السعر يجب أن يكون أكبر من صفر',
        error: 'INVALID_PRICE'
      });
    }

    // التحقق من وجود vendorId
    const finalVendorId = vendorId || req.user?.vendorId || req.user?.id;
    if (!finalVendorId) {
      return res.status(400).json({
        success: false,
        message: 'معرف البائع مطلوب',
        error: 'MISSING_VENDOR_ID'
      });
    }

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      categoryId: parseInt(categoryId),
      imageUrl: imageUrl.trim(),
      vendorId: parseInt(finalVendorId),
      stock: parseInt(stock) || parseInt(stockQuantity) || 0,
      sku: sku || `SKU-${Date.now()}`,
      weight: weight ? parseFloat(weight) : null,
      dimensions: dimensions || null,
      stockQuantity: parseInt(stock) || parseInt(stockQuantity) || 0,
      tags: tags || [],
      isActive: true,
      createdAt: new Date()
    };

    console.log('[Products] Product data to create:', productData);
    const savedProduct = await Product.create(productData);
    console.log('[Products] Product created successfully:', savedProduct);
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المنتج بنجاح',
      data: savedProduct,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Products] Failed to create product:', error);
    console.error('[Products] Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء إنشاء المنتج',
      error: 'INTERNAL_SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

// تحديث حالة المنتج (للمدير)
exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'pending', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة غير صحيحة'
      });
    }

    const updatedProduct = await Product.update(id, { status });
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة المنتج بنجاح',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة المنتج',
      error: error.message
    });
  }
};

// التحقق من المنتج (للمدير)
exports.verifyProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.update(id, { 
      status: 'active',
      isVerified: true 
    });
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم التحقق من المنتج بنجاح',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء التحقق من المنتج',
      error: error.message
    });
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

    const filters = {};
    
    // تصفية حسب الفئة
    if (category) filters.categoryId = category;
    
    // تصفية حسب السعر
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    
    // تصفية حسب المخزون
    if (inStock === 'true') filters.inStock = true;
    
    // تصفية حسب البائع
    if (vendor) filters.vendorId = vendor;

    // خيارات الترتيب
    let sortField = 'created_at';
    let sortOrder = 'DESC';
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortField = 'price';
          sortOrder = 'ASC';
          break;
        case 'price_desc':
          sortField = 'price';
          sortOrder = 'DESC';
          break;
        case 'rating':
          sortField = 'rating';
          sortOrder = 'DESC';
          break;
      }
    }

    // إذا كان هناك بحث، استخدم دالة البحث
    if (search) {
      const result = await Product.search(search, { page: Number(page), limit: Number(limit) });
      return res.json({
        success: true,
        message: 'تم جلب المنتجات بنجاح',
        data: {
          products: result.products,
          currentPage: Number(page),
          totalPages: result.pagination.pages,
          totalProducts: result.pagination.total
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await Product.findAll({
      page: Number(page),
      limit: Number(limit),
      sortBy: sortField,
      sortOrder,
      filters
    });

    res.json({
      success: true,
      message: 'تم جلب المنتجات بنجاح',
      data: {
        products: result.products,
        currentPage: Number(page),
        totalPages: result.pagination.pages,
        totalProducts: result.pagination.total
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتجات', error: error.message });
  }
};

// جلب منتج معين
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ 
      success: false,
      message: 'المنتج غير موجود',
      timestamp: new Date().toISOString()
    });
    res.json({
      success: true,
      message: 'تم جلب المنتج بنجاح',
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء جلب المنتج', error: error.message });
  }
};

// تحديث منتج
exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body;
    const product = await Product.update(req.params.id, updates);

    if (!product) return res.status(404).json({ 
      success: false,
      message: 'المنتج غير موجود',
      timestamp: new Date().toISOString()
    });
    res.json({ 
      success: true,
      message: 'تم تحديث المنتج بنجاح', 
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث المنتج', error: error.message });
  }
};

// حذف منتج
exports.deleteProduct = async (req, res) => {
  try {
    const result = await Product.delete(req.params.id);
    if (!result) return res.status(404).json({ message: 'المنتج غير موجود' });
    res.json({ 
      success: true,
      message: 'تم حذف المنتج بنجاح',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف المنتج', error: error.message });
  }
};

// البحث عن المنتجات
exports.searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ message: 'يرجى إدخال كلمة البحث' });

    const result = await Product.search(q, { page: Number(page), limit: Number(limit) });

    res.json({
      success: true,
      message: 'تم البحث بنجاح',
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء البحث عن المنتجات', error: error.message });
  }
};

// البحث بالعلامات
exports.searchByTags = async (req, res) => {
  try {
    const { tags, page = 1, limit = 10 } = req.query;
    
    if (!tags) {
      return res.status(400).json({ 
        success: false,
        message: 'يرجى تحديد العلامات للبحث',
        timestamp: new Date().toISOString()
      });
    }

    // تحويل العلامات إلى مصفوفة
    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
    
    const result = await Product.findByTags(tagArray, { 
      page: Number(page), 
      limit: Number(limit) 
    });

    res.json({
      success: true,
      message: 'تم البحث بالعلامات بنجاح',
      data: {
        products: result.products,
        searchTags: tagArray,
        currentPage: Number(page),
        totalPages: result.pagination.pages,
        totalProducts: result.pagination.total
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء البحث بالعلامات', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// جلب منتجات البائع
exports.getVendorProducts = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const result = await Product.findAll({
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
      filters: { vendorId: Number(vendorId), isActive: true }
    });

    res.json({
      success: true,
      message: 'تم جلب منتجات البائع بنجاح',
      data: {
        vendorId: Number(vendorId),
        products: result.products,
        currentPage: Number(page),
        totalPages: result.pagination.pages,
        totalProducts: result.pagination.total
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب منتجات البائع', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// تحديث تقييم المنتج
exports.updateProductRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewCount } = req.body;

    if (!rating || !reviewCount) {
      return res.status(400).json({ 
        success: false,
        message: 'التقييم وعدد المراجعات مطلوبان',
        timestamp: new Date().toISOString()
      });
    }

    if (rating < 0 || rating > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'التقييم يجب أن يكون بين 0 و 5',
        timestamp: new Date().toISOString()
      });
    }

    const updated = await Product.updateRating(id, rating, reviewCount);
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'المنتج غير موجود',
        timestamp: new Date().toISOString()
      });
    }

    // جلب المنتج المحدث
    const product = await Product.findById(id);

    res.json({
      success: true,
      message: 'تم تحديث تقييم المنتج بنجاح',
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء تحديث تقييم المنتج', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// جلب علامات المنتج
exports.getProductTags = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tags = await Product.getProductTags(id);
    
    res.json({
      success: true,
      message: 'تم جلب علامات المنتج بنجاح',
      data: {
        productId: Number(id),
        tags
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب علامات المنتج', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// إحصائيات المنتجات
exports.getProductStats = async (req, res) => {
  try {
    const { vendorId } = req.query;
    
    let filters = { isActive: true };
    if (vendorId) {
      filters.vendorId = Number(vendorId);
    }

    // جلب جميع المنتجات للإحصائيات
    const result = await Product.findAll({ 
      page: 1, 
      limit: 1000, // حد عالي للحصول على جميع المنتجات
      filters 
    });

    const products = result.products;
    
    const stats = {
      totalProducts: products.length,
      totalValue: products.reduce((sum, product) => sum + (product.price * product.stockQuantity), 0),
      averagePrice: products.length > 0 ? products.reduce((sum, product) => sum + product.price, 0) / products.length : 0,
      averageRating: products.length > 0 ? products.reduce((sum, product) => sum + product.rating, 0) / products.length : 0,
      totalStock: products.reduce((sum, product) => sum + product.stockQuantity, 0),
      outOfStock: products.filter(product => product.stockQuantity === 0).length,
      lowStock: products.filter(product => product.stockQuantity > 0 && product.stockQuantity <= 10).length,
      topRated: products.filter(product => product.rating >= 4).length,
      withReviews: products.filter(product => product.reviewCount > 0).length
    };

    res.json({
      success: true,
      message: 'تم جلب إحصائيات المنتجات بنجاح',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'حدث خطأ أثناء جلب إحصائيات المنتجات', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
