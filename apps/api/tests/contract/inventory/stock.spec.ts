import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Stock API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/inventory/stock/:productId/:warehouseId should return 401 without auth', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/inventory/stock/prod-1/wh-1')
      .expect(401);
  });
});
