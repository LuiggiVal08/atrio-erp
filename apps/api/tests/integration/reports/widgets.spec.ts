import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Reports Widgets (integration)', () => {
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
    await prisma.dashboardWidget.deleteMany({ where: { tenantId: seed.tenantId } }).catch(() => {});
    await cleanupTestData(app, seed);
    await app.close();
  });

  it('should create and list widgets', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ type: 'kpi', config: { metric: 'today_sales' }, positionX: 0, positionY: 0, width: 2, height: 1 })
      .expect(201);

    expect(createRes.body).toHaveProperty('id');
    expect(createRes.body.type).toBe('kpi');

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBeGreaterThanOrEqual(1);

    await prisma.dashboardWidget.delete({ where: { id: createRes.body.id } }).catch(() => {});
  });

  it('should update widget position', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ type: 'chart', config: { metric: 'sales_trend' }, positionX: 0, positionY: 0, width: 4, height: 2 })
      .expect(201);

    const { id } = createRes.body;

    const updateRes = await request(app.getHttpServer())
      .patch(`/api/v1/reports/widgets/${id}`)
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ width: 6 })
      .expect(200);

    expect(updateRes.body.width).toBe(6);

    await prisma.dashboardWidget.delete({ where: { id } }).catch(() => {});
  });

  it('should delete widget', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ type: 'table', config: { metric: 'top_products' }, positionX: 0, positionY: 0, width: 4, height: 3 })
      .expect(201);

    const { id } = createRes.body;

    await request(app.getHttpServer())
      .delete(`/api/v1/reports/widgets/${id}`)
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(204);

    const listRes = await request(app.getHttpServer())
      .get('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(listRes.body.find((w: any) => w.id === id)).toBeUndefined();
  });

  it('should reorder widgets', async () => {
    const w1 = await request(app.getHttpServer())
      .post('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ type: 'kpi', config: {}, positionX: 0, positionY: 0, width: 2, height: 1 })
      .expect(201);

    const w2 = await request(app.getHttpServer())
      .post('/api/v1/reports/widgets')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ type: 'kpi', config: {}, positionX: 2, positionY: 0, width: 2, height: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/v1/reports/widgets/reorder')
      .set('Authorization', `Bearer ${seed.token}`)
      .send([
        { id: w1.body.id, positionX: 0, positionY: 1 },
        { id: w2.body.id, positionX: 0, positionY: 0 },
      ])
      .expect(200);

    await prisma.dashboardWidget.delete({ where: { id: w1.body.id } }).catch(() => {});
    await prisma.dashboardWidget.delete({ where: { id: w2.body.id } }).catch(() => {});
  });
});
