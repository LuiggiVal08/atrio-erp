import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Reports Scheduled Execution (integration)', () => {
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

  it('POST /api/v1/reports/definitions should create a definition without schedule', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Test Report', type: 'SALES', format: 'PDF' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Report');
    expect(res.body.type).toBe('SALES');
  });

  it('POST /api/v1/reports/definitions with schedule should register a repeatable job', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Scheduled Report', type: 'SALES', format: 'PDF', schedule: '0 8 * * 1' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.schedule).toBe('0 8 * * 1');
  });

  it('GET /api/v1/reports/definitions should list definitions', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'List Test', type: 'INVENTORY', format: 'XLSX' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/v1/reports/definitions/:id should return a definition', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Get Test', type: 'CASH', format: 'CSV' })
      .expect(201);

    const { id } = createRes.body;

    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/definitions/${id}`)
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200);

    expect(res.body.name).toBe('Get Test');
  });

  it('PATCH /api/v1/reports/definitions/:id should update a definition', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Update Test', type: 'TAXES', format: 'PDF' })
      .expect(201);

    const { id } = createRes.body;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/reports/definitions/${id}`)
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Updated Name' })
      .expect(200);

    expect(res.body.name).toBe('Updated Name');
  });

  it('POST /api/v1/reports/definitions/:id/execute should trigger execution', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Execute Test', type: 'SALES', format: 'PDF' })
      .expect(201);

    const { id } = createRes.body;

    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/definitions/${id}/execute`)
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(201);

    expect(res.body).toHaveProperty('taskId');
    expect(res.body).toHaveProperty('status', 'pending');
  });

  it('DELETE /api/v1/reports/definitions/:id should remove a definition', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/reports/definitions')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({ name: 'Delete Test', type: 'CLIENTS', format: 'XLSX' })
      .expect(201);

    const { id } = createRes.body;

    await request(app.getHttpServer())
      .delete(`/api/v1/reports/definitions/${id}`)
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/api/v1/reports/definitions/${id}`)
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(404);
  });
});
