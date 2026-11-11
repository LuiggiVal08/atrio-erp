import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../helpers/test-setup';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

describe('Tenants API (contract)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/admin/tenants should return 201 with tenant data', async () => {
    const uniqueId = Date.now();
    const payload = {
      slug: `test-${uniqueId}`,
      legalName: 'Test Corp',
      taxId: `J-${uniqueId}-9`,
      baseCurrency: 'VED',
      timezone: 'America/Caracas',
      subscriptionPlan: 'free',
      adminEmail: `admin${uniqueId}@test.com`,
      adminName: 'Admin Test',
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/admin/tenants')
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('tenant');
    expect(res.body).toHaveProperty('adminUser');
    expect(res.body.tenant.legalName).toBe(payload.legalName);
    expect(res.body.tenant.status).toBe('active');
  });
});
