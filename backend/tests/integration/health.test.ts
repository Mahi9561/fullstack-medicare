import request from 'supertest';
import { app } from '../../src/app';

describe('GET /api/health (Phase 1 smoke test)', () => {
  it('reports that the API and the database are up', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok', database: 'up' } });
  });

  it('answers unknown routes with the standard error envelope', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
