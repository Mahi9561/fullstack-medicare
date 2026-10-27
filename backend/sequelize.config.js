// Read by sequelize-cli only (migrations and seeders). The app itself uses src/config/database.ts.
require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'admin',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: { ...base, database: process.env.DB_NAME || 'medicare_local' },
  test: { ...base, database: process.env.DB_NAME_TEST || 'medicare_local_test' },
  production: { ...base, database: process.env.DB_NAME || 'medicare_local' },
};
