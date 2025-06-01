// Array لتخزين المتاجر مؤقتًا في الذاكرة
let vendors = [];

// تسجيل متجر جديد
exports.registerVendor = (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const newVendor = {
    id: vendors.length + 1,
    name,
    email,
    phone
  };

  vendors.push(newVendor);

  res.status(201).json({ message: 'Vendor registered successfully', vendor: newVendor });
};

// جلب كل المتاجر
exports.getAllVendors = (req, res) => {
  res.json(vendors);
};

// جلب متجر معين
exports.getVendorById = (req, res) => {
  const { id } = req.params;
  const vendor = vendors.find(v => v.id == id);

  if (!vendor) {
    return res.status(404).json({ message: 'Vendor not found' });
  }

  res.json(vendor);
};
// تعديل بيانات متجر
exports.updateVendor = (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const vendorIndex = vendors.findIndex(v => v.id == id);

  if (vendorIndex === -1) {
    return res.status(404).json({ message: 'Vendor not found' });
  }

  if (!name && !email && !phone) {
    return res.status(400).json({ message: 'No update fields provided' });
  }

  // تحديث الحقول لو اتبعتت
  if (name) vendors[vendorIndex].name = name;
  if (email) vendors[vendorIndex].email = email;
  if (phone) vendors[vendorIndex].phone = phone;

  res.json({ message: 'Vendor updated successfully', vendor: vendors[vendorIndex] });
};
// حذف متجر
exports.deleteVendor = (req, res) => {
  const { id } = req.params;
  const vendorIndex = vendors.findIndex(v => v.id == id);

  if (vendorIndex === -1) {
    return res.status(404).json({ message: 'Vendor not found' });
  }

  // نحذف المتجر من المصفوفة
  const deletedVendor = vendors.splice(vendorIndex, 1)[0];
  res.json({ message: 'Vendor deleted successfully', vendor: deletedVendor });
};
