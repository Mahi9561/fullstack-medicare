import { sequelize } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

export const healthController = asyncHandler(async (_req, res) => {
  let database: 'up' | 'down' = 'up';
  try {
    await sequelize.authenticate();
  } catch {
    database = 'down';
  }
  const healthy = database === 'up';
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'API is healthy' : 'The database is unreachable',
    data: {
      status: healthy ? 'ok' : 'degraded',
      database,
      uptime_seconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});
