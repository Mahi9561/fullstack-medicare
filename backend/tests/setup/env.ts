// Runs before every test file, before the app (and its Zod-validated env) is imported.
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME_TEST || 'medicare_local_test';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-with-enough-length';
