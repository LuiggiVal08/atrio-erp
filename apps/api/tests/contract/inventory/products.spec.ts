import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Products API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/inventory/products should return 401 without auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/inventory/products')
      .expect(401);
  });
});
