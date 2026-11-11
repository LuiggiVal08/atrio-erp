import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Reports - Export API Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/reports/exports/request', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/reports/exports/request')
        .send({ reportType: 'SALES', format: 'PDF' })
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/exports/:taskId/status', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/exports/job-1/status')
        .expect(401);
    });
  });
});
