import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';

describe('Reports - History API Contract', () => {
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

  describe('GET /reports/history', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/history')
        .expect(403);
    });
  });

  describe('GET /reports/history/:id/download', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .get('/reports/history/hist-1/download')
        .expect(403);
    });
  });

  describe('DELETE /reports/history/:id', () => {
    it('should return 403 without auth token', () => {
      return request(app.getHttpServer())
        .delete('/reports/history/hist-1')
        .expect(403);
    });
  });
});
