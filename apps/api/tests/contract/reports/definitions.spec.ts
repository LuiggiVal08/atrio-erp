import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Reports - Definitions API Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/reports/definitions', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/definitions')
        .expect(401);
    });
  });

  describe('POST /api/v1/reports/definitions', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/reports/definitions')
        .send({ name: 'Test', type: 'SALES', format: 'PDF' })
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/definitions/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/definitions/def-1')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/reports/definitions/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/reports/definitions/def-1')
        .send({ name: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/reports/definitions/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/reports/definitions/def-1')
        .expect(401);
    });
  });

  describe('POST /api/v1/reports/definitions/:id/execute', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/reports/definitions/def-1/execute')
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/definitions/:id/executions', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/definitions/def-1/executions')
        .expect(401);
    });
  });
});
