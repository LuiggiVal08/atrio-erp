import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Reports - Export API Contract', () => {
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

  describe('POST /reports/exports/request', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .post('/reports/exports/request')
        .send({ reportType: 'SALES', format: 'PDF' })
        .expect(403);
    });
  });

  describe('GET /reports/exports/:taskId/status', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/exports/job-1/status')
        .expect(403);
    });
  });
});
