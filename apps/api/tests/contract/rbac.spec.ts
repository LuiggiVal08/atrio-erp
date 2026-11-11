import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../helpers/test-setup';

describe('RBAC API (contract)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST non-existent route should return 404', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/non-existent')
      .expect(404);
  });
});
