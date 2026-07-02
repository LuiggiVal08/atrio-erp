import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Reports - Dashboard API Contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /reports/dashboard/summary', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/dashboard/summary')
        .expect(403);
    });
  });

  describe('GET /reports/dashboard/sales-trend', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/dashboard/sales-trend')
        .expect(403);
    });
  });

  describe('GET /reports/dashboard/top-products', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/dashboard/top-products')
        .expect(403);
    });
  });

  describe('GET /reports/dashboard/low-stock', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/dashboard/low-stock')
        .expect(403);
    });
  });

  describe('GET /reports/widgets', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/widgets')
        .expect(403);
    });
  });

  describe('POST /reports/widgets', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .post('/reports/widgets')
        .send({ type: 'kpi', config: {}, positionX: 0, positionY: 0, width: 2, height: 1 })
        .expect(403);
    });
  });

  describe('PATCH /reports/widgets/:id', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .patch('/reports/widgets/widget-1')
        .send({ width: 3 })
        .expect(403);
    });
  });

  describe('DELETE /reports/widgets/:id', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/reports/widgets/widget-1')
        .expect(403);
    });
  });

  describe('PUT /reports/widgets/reorder', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .put('/reports/widgets/reorder')
        .send([{ id: 'w-1', positionX: 0, positionY: 1 }])
        .expect(403);
    });
  });
});
