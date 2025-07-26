// auth-service/config/database.js
require('dotenv').config();
const { pool } = require('../../utils/mysql-config');

// استخدام دالة testConnection الموحدة
const { testConnection: baseTestConnection } = require('../../utils/mysql-config');

async function testConnection() {
  return baseTestConnection('Auth');
}

module.exports = {
  pool,
  testConnection
};