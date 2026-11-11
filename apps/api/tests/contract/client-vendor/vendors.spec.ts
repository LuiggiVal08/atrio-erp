import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Vendors API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/client-vendor/vendors should return 401 without auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/client-vendor/vendors')
      .expect(401);
  });
});
