import 'dotenv/config';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { createConnection } from 'mysql2/promise';

/** Creates the test database if needed and applies all migrations, so `npm test` works on a fresh machine. */
export default async function globalSetup(): Promise<void> {
  const database = process.env.DB_NAME_TEST || 'medicare_local_test';

  try {
    const connection = await createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || undefined,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4`);
    await connection.end();
  } catch (error) {
    throw new Error(
      `Tests need MySQL. Could not connect or create "${database}": ${(error as Error).message}\n` +
        'Check DB_HOST, DB_PORT, DB_USER and DB_PASSWORD in backend/.env.',
    );
  }

  try {
    execSync('npx sequelize-cli db:migrate --env test', {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
    });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? '';
    throw new Error(`Could not run the test migrations:\n${stderr}`);
  }
}
