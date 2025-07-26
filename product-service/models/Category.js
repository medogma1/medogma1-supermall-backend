// product-service/models/Category.js
const { pool } = require('../config/database');
const slugify = require('slugify');

class Category {
  // إنشاء فئة جديدة
  static async create(categoryData) {
    try {
      const { name, description = '', image = '', icon = '', color = '#000000', isActive = true, isFeatured = false, displayOrder = 0 } = categoryData;
      
      // إنشاء slug من الاسم
      const slug = slugify(name, { lower: true });
      
      // تحويل البيانات الوصفية إلى JSON إذا وجدت
      const metadata = categoryData.metadata ? JSON.stringify(categoryData.metadata) : '{}';
      
      const [result] = await pool.execute(
        `INSERT INTO categories 
        (name, slug, description, image, icon, color, is_active, is_featured, display_order, products, metadata, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, slug, description, image, icon, color, isActive, isFeatured, displayOrder, 0, metadata]
      );
      
      if (result.insertId) {
        return this.findById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء الفئة:', error);
      throw error;
    }
  }

  // إنشاء فئة فرعية
  static async createSubCategory(parentId, subCategoryData) {
    try {
      const { name, description = '', image = '', isActive = true } = subCategoryData;
      
      // إنشاء slug من الاسم
      const slug = slugify(name, { lower: true });
      
      // تحويل البيانات الوصفية إلى JSON إذا وجدت
      const metadata = subCategoryData.metadata ? JSON.stringify(subCategoryData.metadata) : '{}';
      
      const [result] = await pool.execute(
        `INSERT INTO sub_categories 
        (parent_id, name, slug, description, image, is_active, products, metadata, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [parentId, name, slug, description, image, isActive, 0, metadata]
      );
      
      if (result.insertId) {
        return this.findSubCategoryById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء الفئة الفرعية:', error);
      throw error;
    }
  }

  // البحث عن فئة بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT c.*, 
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count 
        FROM categories c WHERE c.id = ?`,
        [id]
      );
      
      if (rows.length === 0) return null;
      
      const category = rows[0];
      
      // تحويل البيانات الوصفية من JSON إلى كائن
      if (category.metadata) {
        category.metadata = JSON.parse(category.metadata);
      } else {
        category.metadata = {};
      }
      
      // الحصول على الفئات الفرعية
      const [subCategories] = await pool.execute(
        `SELECT *, 
        (SELECT COUNT(*) FROM products WHERE sub_category_id = id) as product_count 
        FROM sub_categories WHERE parent_id = ?`,
        [id]
      );
      
      // تحويل البيانات الوصفية للفئات الفرعية
      category.subCategories = subCategories.map(sub => {
        if (sub.metadata) {
          sub.metadata = JSON.parse(sub.metadata);
        } else {
          sub.metadata = {};
        }
        return sub;
      });
      
      return category;
    } catch (error) {
      console.error('خطأ في البحث عن الفئة بواسطة المعرف:', error);
      throw error;
    }
  }

  // البحث عن فئة فرعية بواسطة المعرف
  static async findSubCategoryById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT *, 
        (SELECT COUNT(*) FROM products WHERE sub_category_id = id) as product_count 
        FROM sub_categories WHERE id = ?`,
        [id]
      );
      
      if (rows.length === 0) return null;
      
      const subCategory = rows[0];
      
      // تحويل البيانات الوصفية من JSON إلى كائن
      if (subCategory.metadata) {
        subCategory.metadata = JSON.parse(subCategory.metadata);
      } else {
        subCategory.metadata = {};
      }
      
      return subCategory;
    } catch (error) {
      console.error('خطأ في البحث عن الفئة الفرعية بواسطة المعرف:', error);
      throw error;
    }
  }

  // الحصول على جميع الفئات
  static async findAll(options = {}) {
    try {
      const { includeSubCategories = true, onlyActive = false } = options;
      
      let query = `
        SELECT c.*, 
        (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count 
        FROM categories c
      `;
      
      if (onlyActive) {
        query += ' WHERE c.is_active = true';
      }
      
      query += ' ORDER BY c.display_order ASC, c.name ASC';
      
      const [rows] = await pool.execute(query);
      
      // تحويل البيانات الوصفية وإضافة الفئات الفرعية
      const categories = [];
      
      for (const category of rows) {
        // تحويل البيانات الوصفية من JSON إلى كائن
        if (category.metadata) {
          category.metadata = JSON.parse(category.metadata);
        } else {
          category.metadata = {};
        }
        
        // إضافة الفئات الفرعية إذا كان مطلوبًا
        if (includeSubCategories) {
          let subQuery = `
            SELECT *, 
            (SELECT COUNT(*) FROM products WHERE sub_category_id = id) as product_count 
            FROM sub_categories 
            WHERE parent_id = ?
          `;
          
          if (onlyActive) {
            subQuery += ' AND is_active = true';
          }
          
          subQuery += ' ORDER BY name ASC';
          
          const [subCategories] = await pool.execute(subQuery, [category.id]);
          
          // تحويل البيانات الوصفية للفئات الفرعية
          category.subCategories = subCategories.map(sub => {
            if (sub.metadata) {
              sub.metadata = JSON.parse(sub.metadata);
            } else {
              sub.metadata = {};
            }
            return sub;
          });
        } else {
          category.subCategories = [];
        }
        
        categories.push(category);
      }
      
      return categories;
    } catch (error) {
      console.error('خطأ في الحصول على الفئات:', error);
      throw error;
    }
  }

  // تحديث فئة
  static async update(id, updateData) {
    try {
      // تحديد الحقول المسموح بتحديثها
      const allowedFields = [
        'name', 'description', 'image', 'icon', 'color',
        'is_active', 'is_featured', 'display_order', 'metadata'
      ];
      
      const updates = [];
      const values = [];
      
      // إنشاء جزء SET من الاستعلام
      for (const [key, value] of Object.entries(updateData)) {
        // تحويل camelCase إلى snake_case
        const fieldName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        if (allowedFields.includes(fieldName)) {
          // معالجة خاصة لحقل metadata
          if (fieldName === 'metadata' && typeof value === 'object') {
            updates.push(`${fieldName} = ?`);
            values.push(JSON.stringify(value));
          } else {
            updates.push(`${fieldName} = ?`);
            values.push(value);
          }
        }
      }
      
      // إذا تم تحديث الاسم، قم بتحديث slug أيضًا
      if (updateData.name) {
        updates.push('slug = ?');
        values.push(slugify(updateData.name, { lower: true }));
      }
      
      // إضافة تاريخ التحديث
      updates.push('updated_at = NOW()');
      
      // إذا كان هناك تحديثات
      if (updates.length > 0) {
        values.push(id); // إضافة معرف الفئة للشرط WHERE
        
        const [result] = await pool.execute(
          `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
        
        if (result.affectedRows > 0) {
          return this.findById(id);
        }
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في تحديث الفئة:', error);
      throw error;
    }
  }

  // تحديث فئة فرعية
  static async updateSubCategory(id, updateData) {
    try {
      // تحديد الحقول المسموح بتحديثها
      const allowedFields = [
        'name', 'description', 'image', 'is_active', 'metadata'
      ];
      
      const updates = [];
      const values = [];
      
      // إنشاء جزء SET من الاستعلام
      for (const [key, value] of Object.entries(updateData)) {
        // تحويل camelCase إلى snake_case
        const fieldName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        if (allowedFields.includes(fieldName)) {
          // معالجة خاصة لحقل metadata
          if (fieldName === 'metadata' && typeof value === 'object') {
            updates.push(`${fieldName} = ?`);
            values.push(JSON.stringify(value));
          } else {
            updates.push(`${fieldName} = ?`);
            values.push(value);
          }
        }
      }
      
      // إذا تم تحديث الاسم، قم بتحديث slug أيضًا
      if (updateData.name) {
        updates.push('slug = ?');
        values.push(slugify(updateData.name, { lower: true }));
      }
      
      // إضافة تاريخ التحديث
      updates.push('updated_at = NOW()');
      
      // إذا كان هناك تحديثات
      if (updates.length > 0) {
        values.push(id); // إضافة معرف الفئة الفرعية للشرط WHERE
        
        const [result] = await pool.execute(
          `UPDATE sub_categories SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
        
        if (result.affectedRows > 0) {
          return this.findSubCategoryById(id);
        }
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في تحديث الفئة الفرعية:', error);
      throw error;
    }
  }

  // حذف فئة
  static async delete(id) {
    try {
      // حذف الفئات الفرعية أولاً
      await pool.execute('DELETE FROM sub_categories WHERE parent_id = ?', [id]);
      
      // ثم حذف الفئة الرئيسية
      const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في حذف الفئة:', error);
      throw error;
    }
  }

  // حذف فئة فرعية
  static async deleteSubCategory(id) {
    try {
      const [result] = await pool.execute('DELETE FROM sub_categories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في حذف الفئة الفرعية:', error);
      throw error;
    }
  }

  // تحديث عدد المنتجات في الفئة
  static async updateProductCount(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
        [id]
      );
      
      const count = rows[0].count;
      
      await pool.execute(
        'UPDATE categories SET products = ? WHERE id = ?',
        [count, id]
      );
      
      return count;
    } catch (error) {
      console.error('خطأ في تحديث عدد المنتجات في الفئة:', error);
      throw error;
    }
  }

  // تحديث عدد المنتجات في الفئة الفرعية
  static async updateSubCategoryProductCount(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM products WHERE sub_category_id = ?',
        [id]
      );
      
      const count = rows[0].count;
      
      await pool.execute(
        'UPDATE sub_categories SET products = ? WHERE id = ?',
        [count, id]
      );
      
      return count;
    } catch (error) {
      console.error('خطأ في تحديث عدد المنتجات في الفئة الفرعية:', error);
      throw error;
    }
  }
}

module.exports = Category;