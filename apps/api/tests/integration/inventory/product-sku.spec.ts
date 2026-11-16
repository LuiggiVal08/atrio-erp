import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { createTestApp, seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Product SKU uniqueness (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tenantA: TestSeed;
  let tenantB: TestSeed;
  const sku = `SKU-${Date.now()}`;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    tenantA = await seedTestData(app);
    tenantB = await seedTestData(app);
  });

  afterAll(async () => {
    for (const seed of [tenantA, tenantB]) {
      if (!seed) continue;
      await prisma.product.deleteMany({ where: { tenantId: seed.tenantId } }).catch(() => {});
      await cleanupTestData(app, seed);
    }
    await app.close();
  });

  function createProduct(seed: TestSeed, productSku: string) {
    return request(app.getHttpServer())
      .post('/api/v1/inventory/products')
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .send({
        sku: productSku,
        name: `Product ${productSku}`,
        unitPrice: 10,
        costPrice: 5,
        isService: false,
      });
  }

  it('rejects a duplicate SKU inside the same tenant', async () => {
    await createProduct(tenantA, sku).expect(201);
    await createProduct(tenantA, sku).expect(409);
  });

  it('allows the same SKU in another tenant', async () => {
    await createProduct(tenantB, sku).expect(201);
  });

  it('keeps a soft-deleted SKU reserved for the tenant', async () => {
    const created = await createProduct(tenantA, `${sku}-RESERVED`).expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/inventory/products/${created.body.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`)
      .set('X-Tenant-ID', tenantA.tenantId)
      .expect(200);

    await createProduct(tenantA, `${sku}-RESERVED`).expect(409);
  });
});
