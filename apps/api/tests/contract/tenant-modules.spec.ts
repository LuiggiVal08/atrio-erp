import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';
import * as request from 'supertest';

describe('Tenant Modules API (contract)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);

    const tenant = await prisma.tenant.create({
      data: {
        legalName: 'Modules Test Corp',
        taxId: 'J-MODULES-01',
        baseCurrency: 'VED',
        enabledModules: ['sales'],
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    await app.close();
  });

  it('GET /api/v1/admin/tenants/:id/modules should return enabled modules', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/admin/tenants/${tenantId}/modules`)
      .expect(200);

    expect(res.body).toHaveProperty('enabledModules');
    expect(res.body.enabledModules).toContain('sales');
  });

  it('PATCH /api/v1/admin/tenants/:id/modules should update enabled modules', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenants/${tenantId}/modules`)
      .send({ enabledModules: ['sales', 'inventory', 'cash-payments'] })
      .expect(200);

    expect(res.body.enabledModules).toEqual(
      expect.arrayContaining(['sales', 'inventory', 'cash-payments']),
    );
  });

  it('PATCH with invalid module should return 400', async () => {
    await request(app.getHttpServer())
      .patch(`/api/v1/admin/tenants/${tenantId}/modules`)
      .send({ enabledModules: ['invalid_module'] })
      .expect(400);
  });
});
