const mysql = require('mysql2/promise');
const config = require('../../utils/config');

class Banner {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.imageUrl = data.imageUrl || data.image_url || '';
    this.link = data.link || '';
    this.isActive = data.isActive !== undefined ? data.isActive : data.is_active !== undefined ? data.is_active : true;
    this.position = data.position || 0;
    this.startDate = data.startDate || data.start_date || null;
    this.endDate = data.endDate || data.end_date || null;
    this.createdAt = data.createdAt || data.created_at || null;
    this.updatedAt = data.updatedAt || data.updated_at || null;
  }

  // إنشاء اتصال بقاعدة البيانات
  static async getConnection() {
    return await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name
    });
  }

  // إنشاء بنر جديد
  static async create(bannerData) {
    const connection = await this.getConnection();
    try {
      const banner = new Banner(bannerData);
      
      const [result] = await connection.execute(
        `INSERT INTO banners (title, description, image_url, link, is_active, position, start_date, end_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          banner.title,
          banner.description,
          banner.imageUrl,
          banner.link,
          banner.isActive,
          banner.position,
          banner.startDate,
          banner.endDate
        ]
      );

      banner.id = result.insertId;
      return banner;
    } finally {
      await connection.end();
    }
  }

  // جلب جميع البنرات
  static async findAll(options = {}) {
    const connection = await this.getConnection();
    try {
      let query = 'SELECT * FROM banners';
      const params = [];
      const conditions = [];

      if (options.isActive !== undefined) {
        conditions.push('is_active = ?');
        params.push(options.isActive);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY position ASC, created_at DESC';

      if (options.limit) {
        query += ' LIMIT ?';
        params.push(options.limit);
      }

      const [rows] = await connection.execute(query, params);
      return rows.map(row => new Banner(row));
    } finally {
      await connection.end();
    }
  }

  // جلب بنر بواسطة المعرف
  static async findById(id) {
    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM banners WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return new Banner(rows[0]);
    } finally {
      await connection.end();
    }
  }

  // تحديث بنر
  static async update(id, updateData) {
    const connection = await this.getConnection();
    try {
      const fields = [];
      const params = [];

      if (updateData.title !== undefined) {
        fields.push('title = ?');
        params.push(updateData.title);
      }
      if (updateData.description !== undefined) {
        fields.push('description = ?');
        params.push(updateData.description);
      }
      if (updateData.imageUrl !== undefined) {
        fields.push('image_url = ?');
        params.push(updateData.imageUrl);
      }
      if (updateData.link !== undefined) {
        fields.push('link = ?');
        params.push(updateData.link);
      }
      if (updateData.isActive !== undefined) {
        fields.push('is_active = ?');
        params.push(updateData.isActive);
      }
      if (updateData.position !== undefined) {
        fields.push('position = ?');
        params.push(updateData.position);
      }
      if (updateData.startDate !== undefined) {
        fields.push('start_date = ?');
        params.push(updateData.startDate);
      }
      if (updateData.endDate !== undefined) {
        fields.push('end_date = ?');
        params.push(updateData.endDate);
      }

      if (fields.length === 0) {
        throw new Error('لا توجد حقول للتحديث');
      }

      fields.push('updated_at = NOW()');
      params.push(id);

      const [result] = await connection.execute(
        `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return null;
      }

      return await this.findById(id);
    } finally {
      await connection.end();
    }
  }

  // حذف بنر
  static async delete(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        'DELETE FROM banners WHERE id = ?',
        [id]
      );
      
      return result.affectedRows > 0;
    } finally {
      await connection.end();
    }
  }

  // تبديل حالة البنر
  static async toggleStatus(id) {
    const connection = await this.getConnection();
    try {
      const [result] = await connection.execute(
        'UPDATE banners SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?',
        [id]
      );
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return await this.findById(id);
    } finally {
      await connection.end();
    }
  }

  // تحويل إلى JSON
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      imageUrl: this.imageUrl,
      link: this.link,
      isActive: this.isActive,
      position: this.position,
      startDate: this.startDate,
      endDate: this.endDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Banner;