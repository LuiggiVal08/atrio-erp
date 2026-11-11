import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { createTestApp, seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Auto Audit (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seed: TestSeed;
  let categoryId: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (seed) await cleanupTestData(app, seed);
    await app.close();
  });

  it('should create a product and audit log entry', async () => {
    seed = await seedTestData(app);

    const catRes = await request(app.getHttpServer())
      .post('/api/v1/inventory/categories')
      .set('Authorization', `Bearer ${seed.token}`)
      .set('X-Tenant-ID', seed.tenantId)
      .send({ name: 'Test Category' })
      .expect(201);

    categoryId = catRes.body.id;

    const prodRes = await request(app.getHttpServer())
      .post('/api/v1/inventory/products')
      .set('Authorization', `Bearer ${seed.token}`)
      .send({
        sku: `LAP-${Date.now()}`,
        name: 'Test Product',
        categoryId,
        unitPrice: 100,
        costPrice: 70,
        isService: false,
      })
      .expect(201);

    const productId = prodRes.body.id;

    await request(app.getHttpServer())
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${seed.token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('items');
        expect(res.body).toHaveProperty('total');
        expect(Array.isArray(res.body.items)).toBe(true);
        const productAudit = res.body.items.find(
          (log: any) => log.entityType === 'products' && log.entityId === productId,
        );
        expect(productAudit).toBeDefined();
        expect(productAudit.action).toBe('CREATE');
      });
  });
});
