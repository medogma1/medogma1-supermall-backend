const Vendor = require('../models/Vendor');
const bcrypt = require('bcryptjs');

// تسجيل بائع جديد
exports.registerVendor = async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingVendor = await Vendor.findOne({ email });
    if (existingVendor) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newVendor = new Vendor({
      username,
      email,
      password: hashedPassword,
      phone,
      address
    });

    await newVendor.save();

    res.status(201).json({
      message: 'Vendor registered successfully',
      vendor: {
        id: newVendor._id,
        username: newVendor.username,
        email: newVendor.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// جلب كل البائعين
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.status(200).json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
};
