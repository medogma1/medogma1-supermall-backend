// في الذاكرة مؤقتًا، تخزين المنتجات كمصفوفة
let products = [];

// إنشاء منتج جديد
exports.createProduct = (req, res) => {
  const { name, description, price, vendorId } = req.body;
  // vendorId هو معرّف البائع الذي يملك هذا المنتج

  // التحقق من الحقول المطلوبة
  if (!name || !description || !price || !vendorId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // إنشاء كائن المنتج
  const newProduct = {
    id: products.length + 1,
    name,
    description,
    price,
    vendorId,      // يمكن فيما بعد التأكد من وجود البائع
    createdAt: new Date().toISOString()
  };

  products.push(newProduct);
  res.status(201).json({ message: 'Product created successfully', product: newProduct });
};

// جلب كل المنتجات
exports.getAllProducts = (req, res) => {
  res.json(products);
};

// جلب منتج معين بناءً على ID
exports.getProductById = (req, res) => {
  const { id } = req.params;
  const product = products.find(p => p.id == id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
};

// تعديل منتج معين
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, description, price, vendorId } = req.body;

  const index = products.findIndex(p => p.id == id);
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // لا بد من وجود حقل واحد على الأقل للتعديل
  if (!name && !description && !price && !vendorId) {
    return res.status(400).json({ message: 'No update fields provided' });
  }

  if (name) products[index].name = name;
  if (description) products[index].description = description;
  if (price) products[index].price = price;
  if (vendorId) products[index].vendorId = vendorId;

  res.json({ message: 'Product updated successfully', product: products[index] });
};

// حذف منتج معين
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const index = products.findIndex(p => p.id == id);
  if (index === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const deleted = products.splice(index, 1)[0];
  res.json({ message: 'Product deleted successfully', product: deleted });
};
