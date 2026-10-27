import { Sequelize } from 'sequelize';
import { env } from './env';

export const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: false,
  // Sequelize pins every connection to UTC, so created_at/updated_at are consistent
  // whether a row came from the app or from a seeder.
  timezone: '+00:00',
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});
