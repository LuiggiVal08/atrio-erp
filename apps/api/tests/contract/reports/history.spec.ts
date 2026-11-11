import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Reports - History API Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/reports/history', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/history')
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/history/:id/download', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/history/hist-1/download')
        .expect(401);
    });
  });

  describe('DELETE /api/v1/reports/history/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/reports/history/hist-1')
        .expect(401);
    });
  });
});
