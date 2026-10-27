import { sequelize } from '../../src/config/database';

// Each test file gets its own module registry and therefore its own connection pool: close it so Jest can exit.
afterAll(async () => {
  await sequelize.close();
});
