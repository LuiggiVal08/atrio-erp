import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Reports Multi-Format Export (integration)', () => {
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

  it('should export SALES report in PDF format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'SALES', format: 'PDF' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
    expect(res.body.status).toBe('pending');
  });

  it('should export INVENTORY report in XLSX format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'INVENTORY', format: 'XLSX' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
  });

  it('should export CASH report in CSV format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'CASH', format: 'CSV' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
  });

  it('should export CLIENTS report in PDF format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'CLIENTS', format: 'PDF' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
  });

  it('should export TAXES report in XLSX format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'TAXES', format: 'XLSX' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
  });

  it('should export PROFIT report in CSV format', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'PROFIT', format: 'CSV' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
  });
});
