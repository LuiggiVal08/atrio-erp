import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, seedTestData, cleanupTestData, TestSeed } from '../helpers/test-setup';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

describe('Tenant Modules API (contract)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seed: TestSeed;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    seed = await seedTestData(app, { enabledModules: ['sales'] });
  });

  afterAll(async () => {
    await cleanupTestData(app, seed);
    await app.close();
  });

  it('GET /api/v1/admin/tenants/:id/modules should return enabled modules', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/tenants/${seed.tenantId}/modules`)
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .expect(200);

    expect(res.body).toHaveProperty('enabledModules');
    expect(res.body.enabledModules).toContain('sales');
  });

  it('PATCH /api/v1/admin/tenants/:id/modules should update enabled modules', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenants/${seed.tenantId}/modules`)
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .send({ enabledModules: ['sales', 'inventory', 'cash-payments'] })
      .expect(200);

    expect(res.body.enabledModules).toEqual(
      expect.arrayContaining(['sales', 'inventory', 'cash-payments']),
    );
  });

  it('PATCH with invalid module should return 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenants/${seed.tenantId}/modules`)
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .send({ enabledModules: ['invalid_module'] })
      .expect(400);
  });
});
