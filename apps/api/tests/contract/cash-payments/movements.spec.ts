import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Cash Movements API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/cash-payments/registers/:id/movements should return 401 without auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/cash-payments/registers/reg-1/movements')
      .expect(401);
  });
});
