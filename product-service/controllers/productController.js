const Product = require('../models/Product');

// إنشاء منتج جديد
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, vendorId } = req.body;

    if (!name || !description || !price || !vendorId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      vendorId
    });

    await newProduct.save();
    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// جلب كل المنتجات
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

// جلب منتج معين
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

// تحديث منتج معين
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, vendorId } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, description, price, vendorId },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// حذف منتج معين
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};
