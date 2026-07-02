import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Reports Export Flow (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seed: TestSeed;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    seed = await seedTestData(app);
  });

  afterAll(async () => {
    await cleanupTestData(app, seed);
    await app.close();
  });

  it('POST /api/v1/reports/exports/request should return 202 with taskId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'SALES', format: 'PDF' })
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
    expect(res.body).toHaveProperty('status', 'pending');
  });

  it('GET /api/v1/reports/exports/:taskId/status should return export status', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/exports/request')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ reportType: 'SALES', format: 'PDF' })
      .expect(201);

    const { taskId } = createRes.body;

    const statusRes = await request(app.getHttpServer())
      .get(`/api/v1/reports/exports/${taskId}/status`)
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(statusRes.body).toHaveProperty('status');
  });
});
