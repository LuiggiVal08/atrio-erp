import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import * as request from 'supertest';

describe('Tenants API (contract)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/admin/tenants should return 201 with tenant data', async () => {
    const payload = {
      legalName: 'Test Corp',
      taxId: 'J-99999999-9',
      baseCurrency: 'VED',
      timezone: 'America/Caracas',
      subscriptionPlan: 'free',
      adminEmail: 'admin@test.com',
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
