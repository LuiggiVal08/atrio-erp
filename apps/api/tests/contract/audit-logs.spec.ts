import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, seedTestData, cleanupTestData, TestSeed } from '../helpers/test-setup';

describe('Audit Logs API (contract)', () => {
  let app: INestApplication;
  let seed: TestSeed;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/admin/audit-logs should return 200 and an object with items', async () => {
    seed = await seedTestData(app);
    const res = await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    await cleanupTestData(app, seed);
  });
});
