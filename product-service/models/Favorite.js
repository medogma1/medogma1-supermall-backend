// product-service/models/Favorite.js
const { pool } = require('../config/database');

class Favorite {
  // إنشاء مفضلة جديدة
  static async create(favoriteData) {
    try {
      const { userId, itemType, itemId, itemModel, itemData, notes } = favoriteData;
      
      // التحقق من صحة البيانات
      if (!userId || !itemType || !itemId || !itemModel || !itemData) {
        throw new Error('جميع الحقول المطلوبة يجب توفيرها');
      }
      
      if (!['product', 'service'].includes(itemType)) {
        throw new Error('نوع العنصر غير صالح');
      }
      
      if (!['Product', 'Service'].includes(itemModel)) {
        throw new Error('نموذج العنصر غير صالح');
      }
      
      if (notes && notes.length > 500) {
        throw new Error('يجب ألا تتجاوز الملاحظات 500 حرف');
      }
      
      // التحقق من عدم وجود العنصر بالفعل في المفضلة
      const existingFavorite = await this.findOne(userId, itemType, itemId);
      if (existingFavorite) {
        throw new Error('هذا العنصر موجود بالفعل في المفضلة');
      }
      
      // تحويل بيانات العنصر إلى JSON
      const itemDataJson = JSON.stringify(itemData);
      
      // إنشاء المفضلة
      const [result] = await pool.execute(
        `INSERT INTO favorites 
        (user_id, item_type, item_id, item_model, item_data, notes, added_at, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [userId, itemType, itemId, itemModel, itemDataJson, notes || null]
      );
      
      if (result.insertId) {
        return this.findById(result.insertId);
      }
      return null;
    } catch (error) {
      console.error('خطأ في إنشاء المفضلة:', error);
      throw error;
    }
  }

  // البحث عن مفضلة بواسطة المعرف
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM favorites WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      
      return this.formatFavorite(rows[0]);
    } catch (error) {
      console.error('خطأ في البحث عن المفضلة بواسطة المعرف:', error);
      throw error;
    }
  }

  // البحث عن مفضلة بواسطة المستخدم ونوع العنصر ومعرف العنصر
  static async findOne(userId, itemType, itemId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM favorites WHERE user_id = ? AND item_type = ? AND item_id = ?',
        [userId, itemType, itemId]
      );
      
      if (rows.length === 0) return null;
      
      return this.formatFavorite(rows[0]);
    } catch (error) {
      console.error('خطأ في البحث عن المفضلة:', error);
      throw error;
    }
  }

  // الحصول على مفضلات المستخدم
  static async getUserFavorites(userId, itemType, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT * FROM favorites WHERE user_id = ?';
      const queryParams = [userId];
      
      if (itemType) {
        query += ' AND item_type = ?';
        queryParams.push(itemType);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
      
      const [rows] = await pool.execute(query, queryParams);
      
      // تنسيق المفضلات
      const favorites = rows.map(row => this.formatFavorite(row));
      
      // الحصول على العدد الإجمالي للمفضلات
      let countQuery = 'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?';
      const countParams = [userId];
      
      if (itemType) {
        countQuery += ' AND item_type = ?';
        countParams.push(itemType);
      }
      
      const [countRows] = await pool.execute(countQuery, countParams);
      
      return {
        favorites,
        pagination: {
          total: countRows[0].total,
          page,
          limit,
          pages: Math.ceil(countRows[0].total / limit)
        }
      };
    } catch (error) {
      console.error('خطأ في الحصول على مفضلات المستخدم:', error);
      throw error;
    }
  }

  // التحقق مما إذا كان العنصر مفضلاً
  static async checkIsFavorite(userId, itemType, itemId) {
    try {
      const favorite = await this.findOne(userId, itemType, itemId);
      return !!favorite;
    } catch (error) {
      console.error('خطأ في التحقق من المفضلة:', error);
      throw error;
    }
  }

  // تبديل حالة المفضلة (إضافة/إزالة)
  static async toggleFavorite(userId, itemType, itemId, itemModel, itemData, notes) {
    try {
      const favorite = await this.findOne(userId, itemType, itemId);
      
      if (favorite) {
        // إذا كان العنصر موجودًا بالفعل في المفضلة، قم بإزالته
        await pool.execute('DELETE FROM favorites WHERE id = ?', [favorite.id]);
        return { action: 'removed', favorite: null };
      } else {
        // إذا لم يكن العنصر موجودًا في المفضلة، قم بإضافته
        const newFavorite = await this.create({
          userId,
          itemType,
          itemId,
          itemModel,
          itemData,
          notes
        });
        return { action: 'added', favorite: newFavorite };
      }
    } catch (error) {
      console.error('خطأ في تبديل حالة المفضلة:', error);
      throw error;
    }
  }

  // حذف مفضلة
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM favorites WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('خطأ في حذف المفضلة:', error);
      throw error;
    }
  }

  // تنسيق المفضلة (تحويل snake_case إلى camelCase وتحويل البيانات من JSON)
  static formatFavorite(favorite) {
    // تحويل بيانات العنصر من JSON إلى كائن
    const itemData = JSON.parse(favorite.item_data || '{}');
    
    return {
      id: favorite.id,
      userId: favorite.user_id,
      itemType: favorite.item_type,
      itemId: favorite.item_id,
      itemModel: favorite.item_model,
      itemData,
      notes: favorite.notes,
      addedAt: favorite.added_at,
      createdAt: favorite.created_at,
      updatedAt: favorite.updated_at
    };
  }
}

module.exports = Favorite;