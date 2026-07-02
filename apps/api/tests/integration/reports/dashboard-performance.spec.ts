import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Reports Dashboard Performance (integration)', () => {
  let app: INestApplication;
  let seed: TestSeed;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    seed = await seedTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app, seed);
    await app.close();
  });

  it('GET /api/v1/reports/dashboard/summary should respond in < 2s', async () => {
    const start = Date.now();
    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/dashboard/summary')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(res.body).toHaveProperty('todaySales');
    expect(res.body).toHaveProperty('monthSales');
    expect(res.body).toHaveProperty('lowStockProducts');
  });

  it('GET /api/v1/reports/dashboard/sales-trend should return trend data', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/dashboard/sales-trend')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/reports/dashboard/top-products should return product list', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/dashboard/top-products')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/v1/reports/dashboard/low-stock should return low stock items', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/dashboard/low-stock')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
