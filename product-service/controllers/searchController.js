const Product = require('../models/Product');

// البحث العام عن المنتجات
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'يرجى إدخال كلمة البحث' });

    const products = await Product.search(q);

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

    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ message: 'معرف الفئة غير صالح' });
    }

    const filters = { category_id: categoryId };
    const products = await Product.findAll({ filters, searchQuery: q });

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

    if (!vendorId || isNaN(vendorId)) {
      return res.status(400).json({ message: 'معرف البائع غير صالح' });
    }

    const filters = { vendor_id: vendorId };
    const products = await Product.findAll({ filters, searchQuery: q });

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

    const filters = {};
    
    // تصفية حسب الفئة
    if (category && !isNaN(category)) {
      filters.category_id = category;
    }
    
    // تصفية حسب السعر
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    
    // تصفية حسب المخزون
    if (inStock === 'true') filters.inStock = true;

    // خيارات الترتيب
    let sortBy_field = 'created_at';
    let sortOrder = 'DESC';
    if (sortBy) {
      switch (sortBy) {
        case 'price_asc':
          sortBy_field = 'price';
          sortOrder = 'ASC';
          break;
        case 'price_desc':
          sortBy_field = 'price';
          sortOrder = 'DESC';
          break;
        case 'rating':
          sortBy_field = 'rating';
          sortOrder = 'DESC';
          break;
      }
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sortBy: sortBy_field,
      sortOrder,
      filters
    };

    const result = await Product.findAll(options);

    res.json({
      products: result.products || result,
      currentPage: Number(page),
      totalPages: result.totalPages || Math.ceil((result.total || result.length) / limit),
      totalProducts: result.total || result.length
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تصفية المنتجات', error: error.message });
  }
};