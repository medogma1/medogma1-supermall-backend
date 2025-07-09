/// <reference types="cypress" />
// ***********************************************************
// هذا المثال يوضح كيفية إضافة مهام مخصصة إلى Cypress.
//
// للمزيد من المعلومات حول البرامج المساعدة راجع:
// https://on.cypress.io/plugins-guide
// ***********************************************************

/**
 * @type {Cypress.PluginConfig}
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'supermall',
  port: process.env.DB_PORT || 3306
};

// إنشاء اتصال بقاعدة البيانات
async function connectDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    throw error;
  }
}

// تنظيف جدول معين في قاعدة البيانات
async function cleanTable(table) {
  let connection;
  try {
    connection = await connectDB();
    await connection.execute(`DELETE FROM ${table}`);
    return { success: true };
  } catch (error) {
    console.error(`خطأ في تنظيف جدول ${table}:`, error);
    return { success: false, error: error.message };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = (on, config) => {
  // تسجيل المهام المخصصة
  on('task', {
    // مهمة لتنظيف قاعدة البيانات
    'db:clean': async ({ table }) => {
      if (!table) {
        return { success: false, error: 'يجب تحديد اسم الجدول' };
      }
      return await cleanTable(table);
    },
    
    // مهمة لتنفيذ استعلام SQL مخصص
    'db:query': async ({ query, params = [] }) => {
      if (!query) {
        return { success: false, error: 'يجب تحديد الاستعلام' };
      }
      
      let connection;
      try {
        connection = await connectDB();
        const [results] = await connection.execute(query, params);
        return { success: true, results };
      } catch (error) {
        console.error('خطأ في تنفيذ الاستعلام:', error);
        return { success: false, error: error.message };
      } finally {
        if (connection) {
          await connection.end();
        }
      }
    }
  });

  // يمكن تعديل التكوين هنا
  return config;
};