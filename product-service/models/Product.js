// product-service/models/Product.js
const { pool } = require('../config/database');

class Product {
  // إنشاء منتج جديد
  static async create(productData) {
    try {
      const { name, description, price, vendorId, categoryId, imageUrl, stockQuantity = 0, tags = [], isActive = true } = productData;
      
      // تحويل المصفوفة إلى نص JSON
      const tagsJson = JSON.stringify(tags);
      
      const [result] = await pool.query(
        `INSERT INTO products 
        (name, description, price, vendor_id, category_id, image_url, stock_quantity, tags, rating, review_count, is_active, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, vendorId, categoryId, imageUrl, stockQuantity, tagsJson, 0, 0, isActive, new Date()]
      );
      
      if (result.insertId) {
        return this.findById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء المنتج:', error);
      throw error;
    }
  }

  // البحث عن منتج بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      // تحويل النص JSON إلى مصفوفة
      const product = rows[0];
      product.tags = JSON.parse(product.tags || '[]');
      
      return product;
    } catch (error) {
      console.error('خطأ في البحث عن المنتج بواسطة المعرف:', error);
      throw error;
    }
  }

  // الحصول على جميع المنتجات مع دعم الصفحات
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', filters = {} } = options;
      const offset = (page - 1) * limit;
      
      // بناء شروط التصفية
      let whereClause = '';
      const filterValues = [];
      
      if (Object.keys(filters).length > 0) {
        const filterConditions = [];
        
        if (filters.categoryId) {
          filterConditions.push('category_id = ?');
          filterValues.push(filters.categoryId);
        }
        
        if (filters.vendorId) {
          filterConditions.push('vendor_id = ?');
          filterValues.push(filters.vendorId);
        }
        
        if (filters.minPrice) {
          filterConditions.push('price >= ?');
          filterValues.push(filters.minPrice);
        }
        
        if (filters.maxPrice) {
          filterConditions.push('price <= ?');
          filterValues.push(filters.maxPrice);
        }
        
        if (filters.isActive !== undefined) {
          filterConditions.push('is_active = ?');
          filterValues.push(filters.isActive);
        }
        
        if (filterConditions.length > 0) {
          whereClause = 'WHERE ' + filterConditions.join(' AND ');
        }
      }
      
      // استعلام الحصول على المنتجات
      const query = `
        SELECT * FROM products 
        ${whereClause} 
        ORDER BY ${sortBy} ${sortOrder} 
        LIMIT ? OFFSET ?
      `;
      
      // استعلام العدد الإجمالي
      const countQuery = `
        SELECT COUNT(*) as total FROM products ${whereClause}
      `;
      
      const [rows] = await pool.query(query, [...filterValues, limit, offset]);
      const [countRows] = await pool.query(countQuery, filterValues);
      
      // تحويل حقل tags من JSON إلى مصفوفة لكل منتج
      const products = rows.map(product => {
        product.tags = JSON.parse(product.tags || '[]');
        return product;
      });
      
      return {
        products,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في الحصول على المنتجات:', error);
      throw error;
    }
  }

  // البحث عن المنتجات بالنص
  static async search(query, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      // استخدام LIKE للبحث في الاسم والوصف
      const searchQuery = `
        SELECT * FROM products 
        WHERE name LIKE ? OR description LIKE ? OR tags LIKE ? 
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM products 
        WHERE name LIKE ? OR description LIKE ? OR tags LIKE ?
      `;
      
      const searchParam = `%${query}%`;
      
      const [rows] = await pool.query(searchQuery, [searchParam, searchParam, searchParam, limit, offset]);
      const [countRows] = await pool.query(countQuery, [searchParam, searchParam, searchParam]);
      
      // تحويل حقل tags من JSON إلى مصفوفة لكل منتج
      const products = rows.map(product => {
        product.tags = JSON.parse(product.tags || '[]');
        return product;
      });
      
      return {
        products,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في البحث عن المنتجات:', error);
      throw error;
    }
  }

  // تحديث منتج
  static async update(id, updateData) {
    try {
      // تحديد الحقول المسموح بتحديثها
      const allowedFields = [
        'name', 'description', 'price', 'category_id', 'image_url',
        'stock_quantity', 'tags', 'is_active'
      ];
      
      const updates = [];
      const values = [];
      
      // إنشاء جزء SET من الاستعلام
      for (const [key, value] of Object.entries(updateData)) {
        // تحويل camelCase إلى snake_case
        const fieldName = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        
        if (allowedFields.includes(fieldName)) {
          // معالجة خاصة لحقل tags
          if (fieldName === 'tags' && Array.isArray(value)) {
            updates.push(`${fieldName} = ?`);
            values.push(JSON.stringify(value));
          } else {
            updates.push(`${fieldName} = ?`);
            values.push(value);
          }
        }
      }
      
      // إذا كان هناك تحديثات
      if (updates.length > 0) {
        values.push(id); // إضافة معرف المنتج للشرط WHERE
        
        const [result] = await pool.query(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
        
        if (result.affectedRows > 0) {
          return this.findById(id);
        }
      }
      
      return null;
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
      throw error;
    }
  }

  // حذف منتج
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      throw error;
    }
  }

  // تحديث تقييم المنتج
  static async updateRating(id, rating, reviewCount) {
    try {
      const [result] = await pool.query(
        'UPDATE products SET rating = ?, review_count = ? WHERE id = ?',
        [rating, reviewCount, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في تحديث تقييم المنتج:', error);
      throw error;
    }
  }
}

module.exports = Product;
