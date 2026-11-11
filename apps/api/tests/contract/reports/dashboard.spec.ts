import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../../helpers/test-setup';

describe('Reports - Dashboard API Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/reports/dashboard/summary', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard/summary')
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/dashboard/sales-trend', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard/sales-trend')
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/dashboard/top-products', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard/top-products')
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/dashboard/low-stock', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/dashboard/low-stock')
        .expect(401);
    });
  });

  describe('GET /api/v1/reports/widgets', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/reports/widgets')
        .expect(401);
    });
  });

  describe('POST /api/v1/reports/widgets', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/reports/widgets')
        .send({ type: 'kpi', config: {}, positionX: 0, positionY: 0, width: 2, height: 1 })
        .expect(401);
    });
  });

  describe('PATCH /api/v1/reports/widgets/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .patch('/api/v1/reports/widgets/widget-1')
        .send({ width: 3 })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/reports/widgets/:id', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/reports/widgets/widget-1')
        .expect(401);
    });
  });

  describe('PUT /api/v1/reports/widgets/reorder', () => {
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .put('/api/v1/reports/widgets/reorder')
        .send([{ id: 'w-1', positionX: 0, positionY: 1 }])
        .expect(401);
    });
  });
});
