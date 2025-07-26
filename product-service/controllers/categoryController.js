// product-service/controllers/categoryController.js
const Category = require('../models/Category');
const slugify = require('slugify');

// إنشاء فئة جديدة
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, icon, color, isActive, isFeatured, displayOrder } = req.body;
    
    // التحقق من وجود الاسم
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم الفئة مطلوب'
      });
    }
    
    // إنشاء slug من الاسم
    const slug = slugify(name, { lower: true });
    
    // التحقق من وجود فئة بنفس الاسم
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'توجد فئة بنفس الاسم بالفعل'
      });
    }
    
    // إنشاء فئة جديدة
    const category = new Category({
      name,
      slug,
      description,
      image,
      icon,
      color,
      isActive,
      isFeatured,
      displayOrder
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في إنشاء فئة جديدة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الفئة',
      error: error.message
    });
  }
};

// الحصول على جميع الفئات
exports.getAllCategories = async (req, res) => {
  try {
    const { active, featured } = req.query;
    
    // إنشاء خيارات للبحث
    const options = {
      includeSubCategories: true,
      onlyActive: active === 'true'
    };
    
    // الحصول على الفئات مع الفرز حسب ترتيب العرض
    const categories = await Category.findAll(options);
    
    // تصفية الفئات المميزة إذا تم تحديدها
    let filteredCategories = categories;
    if (featured !== undefined) {
      filteredCategories = categories.filter(cat => 
        featured === 'true' ? cat.is_featured : !cat.is_featured
      );
    }
    
    res.status(200).json({
      success: true,
      count: filteredCategories.length,
      data: filteredCategories
    });
  } catch (error) {
    console.error('خطأ في الحصول على الفئات:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفئات',
      error: error.message
    });
  }
};

// الحصول على فئة واحدة بواسطة المعرف
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في الحصول على الفئة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفئة',
      error: error.message
    });
  }
};

// الحصول على فئة واحدة بواسطة الاسم المستعار (slug)
exports.getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ slug });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في الحصول على الفئة بواسطة الاسم المستعار:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفئة',
      error: error.message
    });
  }
};

// تحديث فئة
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // إذا تم تحديث الاسم، قم بتحديث الاسم المستعار أيضًا
    if (updates.name) {
      updates.slug = slugify(updates.name, { lower: true });
    }
    
    const category = await Category.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في تحديث الفئة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الفئة',
      error: error.message
    });
  }
};

// حذف فئة
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByIdAndDelete(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'تم حذف الفئة بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الفئة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الفئة',
      error: error.message
    });
  }
};

// إضافة فئة فرعية
exports.addSubCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;
    
    // التحقق من وجود الاسم
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'اسم الفئة الفرعية مطلوب'
      });
    }
    
    // إنشاء slug من الاسم
    const slug = slugify(name, { lower: true });
    
    // البحث عن الفئة الرئيسية
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة الرئيسية'
      });
    }
    
    // التحقق من وجود فئة فرعية بنفس الاسم
    const existingSubCategory = category.subCategories.find(sub => sub.slug === slug);
    if (existingSubCategory) {
      return res.status(400).json({
        success: false,
        message: 'توجد فئة فرعية بنفس الاسم بالفعل'
      });
    }
    
    // إضافة الفئة الفرعية
    category.subCategories.push({
      name,
      slug,
      description,
      image,
      isActive
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في إضافة فئة فرعية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة الفئة الفرعية',
      error: error.message
    });
  }
};

// تحديث فئة فرعية
exports.updateSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    const updates = req.body;
    
    // البحث عن الفئة الرئيسية
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة الرئيسية'
      });
    }
    
    // البحث عن الفئة الفرعية
    const subCategory = category.subCategories.id(subCategoryId);
    
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة الفرعية'
      });
    }
    
    // تحديث الفئة الفرعية
    if (updates.name) {
      subCategory.name = updates.name;
      subCategory.slug = slugify(updates.name, { lower: true });
    }
    
    if (updates.description !== undefined) {
      subCategory.description = updates.description;
    }
    
    if (updates.image !== undefined) {
      subCategory.image = updates.image;
    }
    
    if (updates.isActive !== undefined) {
      subCategory.isActive = updates.isActive;
    }
    
    await category.save();
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('خطأ في تحديث الفئة الفرعية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الفئة الفرعية',
      error: error.message
    });
  }
};

// حذف فئة فرعية
exports.deleteSubCategory = async (req, res) => {
  try {
    const { categoryId, subCategoryId } = req.params;
    
    // البحث عن الفئة الرئيسية
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة الرئيسية'
      });
    }
    
    // البحث عن الفئة الفرعية
    const subCategory = category.subCategories.id(subCategoryId);
    
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'لم يتم العثور على الفئة الفرعية'
      });
    }
    
    // حذف الفئة الفرعية
    subCategory.remove();
    
    await category.save();
    
    res.status(200).json({
      success: true,
      message: 'تم حذف الفئة الفرعية بنجاح'
    });
  } catch (error) {
    console.error('خطأ في حذف الفئة الفرعية:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الفئة الفرعية',
      error: error.message
    });
  }
};

// الحصول على الفئات المميزة
exports.getFeaturedCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isFeatured: true, isActive: true })
      .sort({ displayOrder: 1 });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('خطأ في الحصول على الفئات المميزة:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الفئات المميزة',
      error: error.message
    });
  }
};