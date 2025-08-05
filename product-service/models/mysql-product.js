// models/mysql-product.js
const { pool } = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.price = data.price;
    this.priceType = data.price_type || data.priceType || 'fixed';
    this.vendorId = data.vendor_id || data.vendorId;
    this.categoryId = data.category_id || data.categoryId;
    this.imageUrl = data.image_url || data.imageUrl;
    this.stockQuantity = data.stock_quantity || data.stockQuantity || 0;
    this.rating = data.rating || 0;
    this.reviewCount = data.review_count || data.reviewCount || 0;
    this.isActive = data.is_active !== undefined ? data.is_active : data.isActive;
    this.isFeatured = data.is_featured !== undefined ? data.is_featured : data.isFeatured || false;
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
    this.tags = data.tags || [];
  }

  // إنشاء منتج جديد
  static async create(productData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // التحقق من صحة البيانات
      if (!productData.name || productData.name.trim().length === 0) {
        throw new Error('Product name is required');
      }
      
      // التحقق من نوع السعر والسعر
      const priceType = productData.priceType || 'fixed';
      if (priceType === 'fixed' && (!productData.price || productData.price < 0)) {
        throw new Error('Valid price is required when price type is fixed');
      }
      if (priceType === 'contact' && productData.price) {
        productData.price = null; // إزالة السعر إذا كان النوع "تواصل"
      }
      
      if (!productData.vendorId) {
        throw new Error('Vendor ID is required');
      }
      if (!productData.categoryId) {
        throw new Error('Category ID is required');
      }

      // إدراج المنتج
      const [result] = await connection.execute(
        `INSERT INTO products 
        (name, description, price, price_type, vendor_id, category_id, image_url, stock_quantity, 
         rating, review_count, is_active, is_featured, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          productData.name.trim(),
          productData.description || null,
          productData.price,
          priceType,
          productData.vendorId,
          productData.categoryId,
          productData.imageUrl || null,
          productData.stockQuantity || 0,
          0, // rating
          0, // review_count
          productData.isActive !== undefined ? productData.isActive : true,
          productData.isFeatured || false
        ]
      );

      if (!result.insertId) {
        throw new Error('Failed to create product');
      }

      // إضافة العلامات إذا كانت موجودة
      if (productData.tags && Array.isArray(productData.tags) && productData.tags.length > 0) {
        await this.addTags(connection, result.insertId, productData.tags);
      }

      await connection.commit();
      return this.findById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // البحث عن منتج بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM products WHERE id = ?', [id]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const product = new Product(rows[0]);
      
      // جلب العلامات
      product.tags = await this.getProductTags(id);
      
      return product;
    } catch (error) {
      throw error;
    }
  }

  // الحصول على جميع المنتجات مع دعم الصفحات والتصفية
  static async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sortBy = 'created_at', 
        sortOrder = 'DESC', 
        filters = {} 
      } = options;
      
      const offset = (page - 1) * limit;
      
      // بناء شروط التصفية
      let whereClause = 'WHERE 1=1';
      const filterValues = [];
      
      if (filters.categoryId) {
        whereClause += ' AND category_id = ?';
        filterValues.push(filters.categoryId);
      }
      
      if (filters.vendorId) {
        whereClause += ' AND vendor_id = ?';
        filterValues.push(filters.vendorId);
      }
      
      if (filters.minPrice !== undefined) {
        whereClause += ' AND price >= ?';
        filterValues.push(filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        whereClause += ' AND price <= ?';
        filterValues.push(filters.maxPrice);
      }
      
      if (filters.isActive !== undefined) {
        whereClause += ' AND is_active = ?';
        filterValues.push(filters.isActive);
      }
      
      if (filters.isFeatured !== undefined) {
        whereClause += ' AND is_featured = ?';
        filterValues.push(filters.isFeatured);
      }
      
      if (filters.inStock) {
        whereClause += ' AND stock_quantity > 0';
      }
      
      // التحقق من صحة sortBy
      const allowedSortFields = ['id', 'name', 'price', 'rating', 'created_at', 'updated_at'];
      const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
      const safeSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      // استعلام الحصول على المنتجات
      const query = `
        SELECT * FROM products 
        ${whereClause} 
        ORDER BY ${safeSortBy} ${safeSortOrder} 
        LIMIT ? OFFSET ?
      `;
      
      // استعلام العدد الإجمالي
      const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
      
      const [rows] = await pool.execute(query, [...filterValues, parseInt(limit), offset]);
      const [countRows] = await pool.execute(countQuery, filterValues);
      
      // تحويل النتائج إلى كائنات Product وجلب العلامات
      const products = [];
      for (const row of rows) {
        const product = new Product(row);
        product.tags = await this.getProductTags(product.id);
        products.push(product);
      }
      
      return {
        products,
        pagination: {
          total: countRows[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // البحث عن المنتجات بالنص
  static async search(searchQuery, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      // استخدام حقل tags JSON بدلاً من جدول منفصل
      const query = `
        SELECT * FROM products p
        WHERE (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
        AND p.is_active = 1
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total FROM products p
        WHERE (p.name LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
        AND p.is_active = 1
      `;
      
      const searchParam = `%${searchQuery}%`;
      
      const [rows] = await pool.execute(query, [searchParam, searchParam, searchParam, parseInt(limit), offset]);
      const [countRows] = await pool.execute(countQuery, [searchParam, searchParam, searchParam]);
      
      // تحويل النتائج إلى كائنات Product
      const products = [];
      for (const row of rows) {
        const product = new Product(row);
        // تحويل tags من JSON إلى مصفوفة
        try {
          product.tags = JSON.parse(row.tags || '[]');
        } catch (e) {
          product.tags = [];
        }
        products.push(product);
      }
      
      return {
        products,
        pagination: {
          total: countRows[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // تحديث منتج
  static async update(id, updateData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // التحقق من وجود المنتج
      const existingProduct = await this.findById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      
      // تحديد الحقول المسموح بتحديثها
      const allowedFields = {
        'name': 'name',
        'description': 'description',
        'price': 'price',
        'categoryId': 'category_id',
        'imageUrl': 'image_url',
        'stockQuantity': 'stock_quantity',
        'isActive': 'is_active',
        'isFeatured': 'is_featured'
      };
      
      const updates = [];
      const values = [];
      
      // إنشاء جزء SET من الاستعلام
      Object.keys(updateData).forEach(key => {
        if (allowedFields[key] && updateData[key] !== undefined) {
          updates.push(`${allowedFields[key]} = ?`);
          values.push(updateData[key]);
        }
      });
      
      // تحديث المنتج إذا كان هناك تحديثات
      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        values.push(id);
        
        await connection.execute(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
      
      // تحديث العلامات إذا كانت موجودة
      if (updateData.tags && Array.isArray(updateData.tags)) {
        await this.updateProductTags(connection, id, updateData.tags);
      }
      
      await connection.commit();
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // حذف منتج
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // حذف العلامات أولاً
      await connection.execute('DELETE FROM product_tags WHERE product_id = ?', [id]);
      
      // حذف المنتج
      const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [id]);
      
      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // تحديث تقييم المنتج
  static async updateRating(id, rating, reviewCount) {
    try {
      const [result] = await pool.execute(
        'UPDATE products SET rating = ?, review_count = ?, updated_at = NOW() WHERE id = ?',
        [rating, reviewCount, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // جلب علامات المنتج
  static async getProductTags(productId) {
    try {
      const [rows] = await pool.execute(
        'SELECT tag FROM product_tags WHERE product_id = ? ORDER BY tag',
        [productId]
      );
      return rows.map(row => row.tag);
    } catch (error) {
      throw error;
    }
  }

  // إضافة علامات للمنتج
  static async addTags(connection, productId, tags) {
    if (!Array.isArray(tags) || tags.length === 0) return;
    
    const values = tags
      .filter(tag => tag && tag.trim().length > 0)
      .map(tag => [productId, tag.trim().toLowerCase()]);
    
    if (values.length > 0) {
      const placeholders = values.map(() => '(?, ?)').join(', ');
      const flatValues = values.flat();
      
      await connection.execute(
        `INSERT INTO product_tags (product_id, tag) VALUES ${placeholders}`,
        flatValues
      );
    }
  }

  // تحديث علامات المنتج
  static async updateProductTags(connection, productId, tags) {
    // حذف العلامات الحالية
    await connection.execute('DELETE FROM product_tags WHERE product_id = ?', [productId]);
    
    // إضافة العلامات الجديدة
    if (Array.isArray(tags) && tags.length > 0) {
      await this.addTags(connection, productId, tags);
    }
  }

  // البحث بالعلامات
  static async findByTags(tags, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      if (!Array.isArray(tags) || tags.length === 0) {
        return { products: [], pagination: { total: 0, page, limit, pages: 0 } };
      }
      
      const placeholders = tags.map(() => '?').join(',');
      
      const query = `
        SELECT DISTINCT p.* FROM products p
        INNER JOIN product_tags pt ON p.id = pt.product_id
        WHERE pt.tag IN (${placeholders})
        AND p.is_active = TRUE
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total FROM products p
        INNER JOIN product_tags pt ON p.id = pt.product_id
        WHERE pt.tag IN (${placeholders})
        AND p.is_active = TRUE
      `;
      
      const [rows] = await pool.execute(query, [...tags, parseInt(limit), offset]);
      const [countRows] = await pool.execute(countQuery, tags);
      
      // تحويل النتائج إلى كائنات Product وجلب العلامات
      const products = [];
      for (const row of rows) {
        const product = new Product(row);
        product.tags = await this.getProductTags(product.id);
        products.push(product);
      }
      
      return {
        products,
        pagination: {
          total: countRows[0].total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // تحويل إلى JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      vendorId: this.vendorId,
      categoryId: this.categoryId,
      imageUrl: this.imageUrl,
      stockQuantity: this.stockQuantity,
      rating: this.rating,
      reviewCount: this.reviewCount,
      isActive: this.isActive,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Helper methods
  isInStock() {
    return this.stockQuantity > 0;
  }

  isAvailable() {
    return this.isActive && this.isInStock();
  }

  getFormattedPrice() {
    return `${this.price} EGP`;
  }

  hasTag(tagName) {
    return this.tags.includes(tagName.toLowerCase());
  }
}

module.exports = Product;