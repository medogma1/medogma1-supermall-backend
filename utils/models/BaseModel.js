/**
 * نموذج أساسي موحد للتعامل مع قاعدة البيانات
 * يوفر وظائف CRUD أساسية يمكن توريثها من قبل جميع النماذج
 */

const { pool } = require('../mysql-config');
const { logger } = require('../logger');

class BaseModel {
  /**
   * إنشاء نموذج جديد
   * @param {string} tableName - اسم الجدول في قاعدة البيانات
   */
  constructor(tableName) {
    if (!tableName) {
      throw new Error('يجب تحديد اسم الجدول');
    }
    this.tableName = tableName;
    this.pool = pool;
  }

  /**
   * الحصول على جميع السجلات من الجدول
   * @param {Object} options - خيارات الاستعلام (مثل الترتيب، الحد، إلخ)
   * @returns {Promise<Array>} - مصفوفة من السجلات
   */
  async findAll(options = {}) {
    const { limit = 100, offset = 0, orderBy = 'id', order = 'ASC' } = options;
    
    try {
      const query = `SELECT * FROM ${this.tableName} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
      const [rows] = await this.pool.execute(query, [limit, offset]);
      return rows;
    } catch (error) {
      logger.error(`خطأ في الحصول على السجلات من ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * الحصول على سجل واحد بواسطة المعرف
   * @param {number|string} id - معرف السجل
   * @returns {Promise<Object|null>} - السجل أو null إذا لم يتم العثور عليه
   */
  async findById(id) {
    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const [rows] = await this.pool.execute(query, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      logger.error(`خطأ في الحصول على السجل ${id} من ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * البحث عن سجلات بناءً على معايير محددة
   * @param {Object} criteria - معايير البحث (مثال: { status: 'active' })
   * @returns {Promise<Array>} - مصفوفة من السجلات المطابقة
   */
  async findBy(criteria) {
    try {
      const keys = Object.keys(criteria);
      if (!keys.length) {
        return this.findAll();
      }

      const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
      const values = keys.map(key => criteria[key]);

      const query = `SELECT * FROM ${this.tableName} WHERE ${whereClause}`;
      const [rows] = await this.pool.execute(query, values);
      return rows;
    } catch (error) {
      logger.error(`خطأ في البحث في ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * إنشاء سجل جديد
   * @param {Object} data - بيانات السجل الجديد
   * @returns {Promise<Object>} - السجل الذي تم إنشاؤه
   */
  async create(data) {
    try {
      const keys = Object.keys(data);
      const columns = keys.join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(key => data[key]);

      const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      const [result] = await this.pool.execute(query, values);

      if (result.insertId) {
        return this.findById(result.insertId);
      }
      return data;
    } catch (error) {
      logger.error(`خطأ في إنشاء سجل في ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * تحديث سجل موجود
   * @param {number|string} id - معرف السجل
   * @param {Object} data - البيانات المحدثة
   * @returns {Promise<Object|null>} - السجل المحدث أو null إذا لم يتم العثور عليه
   */
  async update(id, data) {
    try {
      const keys = Object.keys(data);
      if (!keys.length) {
        return this.findById(id);
      }

      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = [...keys.map(key => data[key]), id];

      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
      const [result] = await this.pool.execute(query, values);

      if (result.affectedRows === 0) {
        return null;
      }
      return this.findById(id);
    } catch (error) {
      logger.error(`خطأ في تحديث السجل ${id} في ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * حذف سجل
   * @param {number|string} id - معرف السجل
   * @returns {Promise<boolean>} - true إذا تم الحذف بنجاح
   */
  async delete(id) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const [result] = await this.pool.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error(`خطأ في حذف السجل ${id} من ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * تنفيذ استعلام مخصص
   * @param {string} query - استعلام SQL
   * @param {Array} params - معلمات الاستعلام
   * @returns {Promise<Array>} - نتائج الاستعلام
   */
  async executeQuery(query, params = []) {
    try {
      const [rows] = await this.pool.execute(query, params);
      return rows;
    } catch (error) {
      logger.error(`خطأ في تنفيذ استعلام مخصص على ${this.tableName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * الحصول على عدد السجلات في الجدول
   * @param {Object} criteria - معايير العد (اختياري)
   * @returns {Promise<number>} - عدد السجلات
   */
  async count(criteria = {}) {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName}`;
      let params = [];

      const keys = Object.keys(criteria);
      if (keys.length) {
        const whereClause = keys.map(key => `${key} = ?`).join(' AND ');
        params = keys.map(key => criteria[key]);
        query += ` WHERE ${whereClause}`;
      }

      const [rows] = await this.pool.execute(query, params);
      return rows[0].count;
    } catch (error) {
      logger.error(`خطأ في عد السجلات في ${this.tableName}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BaseModel;