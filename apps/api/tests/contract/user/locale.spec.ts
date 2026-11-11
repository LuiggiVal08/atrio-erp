import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, seedTestData, cleanupTestData } from '../../helpers/test-setup';

describe('User Locale API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('PATCH /api/v1/users/me/locale should return 400 without valid body', async () => {
    const seed = await seedTestData(app);
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/me/locale')
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .send({ locale: 'invalid' })
      .expect(400);
    expect(res.body).toHaveProperty('message');
    await cleanupTestData(app, seed);
  });
});
