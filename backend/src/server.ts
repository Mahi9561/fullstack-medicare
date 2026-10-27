import { app } from './app';
import { sequelize } from './config/database';
import { env } from './config/env';

const start = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log(`Connected to MySQL database "${env.DB_NAME}" at ${env.DB_HOST}:${env.DB_PORT}`);
  } catch (error) {
    console.error(
      'Could not connect to MySQL. Check that MySQL is running and that DB_HOST, DB_PORT, DB_NAME, DB_USER and DB_PASSWORD in backend/.env are correct.',
    );
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`MediCare Local API listening on http://localhost:${env.PORT}/api`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${env.PORT} is already in use. On macOS, AirPlay Receiver uses port 5000: turn it off in System Settings > General > AirDrop & Handoff, or set PORT in backend/.env (and VITE_API_URL in the frontend).`,
      );
    } else {
      console.error(error);
    }
    process.exit(1);
  });

  const shutdown = async (): Promise<void> => {
    server.close();
    await sequelize.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

void start();
