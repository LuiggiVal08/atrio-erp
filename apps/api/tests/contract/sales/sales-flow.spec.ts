import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Sales Flow API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/sales/orders should return 401 without auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/sales/orders')
      .expect(401);
  });
});
