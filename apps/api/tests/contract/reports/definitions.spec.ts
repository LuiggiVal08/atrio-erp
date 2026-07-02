import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Reports - Definitions API Contract', () => {
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

  describe('GET /reports/definitions', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/definitions')
        .expect(403);
    });
  });

  describe('POST /reports/definitions', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .post('/reports/definitions')
        .send({ name: 'Test', type: 'SALES', format: 'PDF' })
        .expect(403);
    });
  });

  describe('GET /reports/definitions/:id', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/definitions/def-1')
        .expect(403);
    });
  });

  describe('PATCH /reports/definitions/:id', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .patch('/reports/definitions/def-1')
        .send({ name: 'Updated' })
        .expect(403);
    });
  });

  describe('DELETE /reports/definitions/:id', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/reports/definitions/def-1')
        .expect(403);
    });
  });

  describe('POST /reports/definitions/:id/execute', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .post('/reports/definitions/def-1/execute')
        .expect(403);
    });
  });

  describe('GET /reports/definitions/:id/executions', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/definitions/def-1/executions')
        .expect(403);
    });
  });
});
