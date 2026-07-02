import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { seedTestData, cleanupTestData, TestSeed } from '../../helpers/test-setup';

describe('Stock Events (integration)', () => {
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

  describe('T081 — stock deduction on invoice approval', () => {
    let seed: TestSeed;
    let categoryId: string;
    let productId: string;
    let warehouseId: string;
    let documentId: string;

    afterAll(async () => {
      if (seed) await cleanupTestData(app, seed);
    });

    it('should create a product, warehouse, and initial stock', async () => {
      seed = await seedTestData(app);

      const catRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${seed.token}`)
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
          costPrice: 60,
          isService: false,
        })
        .expect(201);
      productId = prodRes.body.id;

      const whRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/warehouses')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ name: 'Main Warehouse', code: `WH-${Date.now()}` })
        .expect(201);
      warehouseId = whRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/inventory/stock/${productId}/${warehouseId}/adjust`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ type: 'in', quantity: 100, reason: 'Initial stock' })
        .expect(201);
    });

    it('should create a sales invoice with the product and approve it', async () => {
      const docRes = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({
          documentType: 'sales_invoice',
          lines: [
            {
              description: 'Test Product Sale',
              quantity: 10,
              unitPrice: 100,
              taxRate: 16,
              productId,
              warehouseId,
            },
          ],
        })
        .expect(201);
      documentId = docRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${documentId}/submit`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${documentId}/approve`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);
    });

    it('should have deducted stock after approval', async () => {
      const stockRes = await request(app.getHttpServer())
        .get(`/api/v1/inventory/stock/${productId}/${warehouseId}`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      expect(stockRes.body.quantity).toBe(90);
    });
  });

  describe('T093 — stock increment on purchase order deliver', () => {
    let seed: TestSeed;
    let categoryId: string;
    let productId: string;
    let warehouseId: string;
    let documentId: string;

    afterAll(async () => {
      if (seed) await cleanupTestData(app, seed);
    });

    it('should create a product, warehouse, and initial stock', async () => {
      seed = await seedTestData(app);

      const catRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ name: 'Test Category' })
        .expect(201);
      categoryId = catRes.body.id;

      const prodRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/products')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({
          sku: `RAW-${Date.now()}`,
          name: 'Raw Material',
          categoryId,
          unitPrice: 50,
          costPrice: 30,
          isService: false,
        })
        .expect(201);
      productId = prodRes.body.id;

      const whRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/warehouses')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ name: 'Main Warehouse', code: `WH-${Date.now()}` })
        .expect(201);
      warehouseId = whRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/inventory/stock/${productId}/${warehouseId}/adjust`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ type: 'in', quantity: 50, reason: 'Initial stock' })
        .expect(201);
    });

    it('should create a purchase order, approve, and deliver it', async () => {
      const docRes = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({
          documentType: 'purchase_order',
          lines: [
            {
              description: 'Raw Material Purchase',
              quantity: 20,
              unitPrice: 50,
              taxRate: 16,
              productId,
              warehouseId,
            },
          ],
        })
        .expect(201);
      documentId = docRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${documentId}/submit`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${documentId}/approve`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${documentId}/transition`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ targetStatus: 'delivered' })
        .expect(200);
    });

    it('should have incremented stock after deliver', async () => {
      const stockRes = await request(app.getHttpServer())
        .get(`/api/v1/inventory/stock/${productId}/${warehouseId}`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      expect(stockRes.body.quantity).toBe(70);
    });
  });

  describe('T102 — full event chain', () => {
    let seed: TestSeed;
    let categoryId: string;
    let productId: string;
    let warehouseId: string;
    let invoiceId: string;
    let poId: string;

    afterAll(async () => {
      if (seed) await cleanupTestData(app, seed);
    });

    it('should create inventory and initial stock', async () => {
      seed = await seedTestData(app);

      const catRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/categories')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ name: 'Test Category' })
        .expect(201);
      categoryId = catRes.body.id;

      const prodRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/products')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({
          sku: `ITEM-${Date.now()}`,
          name: 'Test Item',
          categoryId,
          unitPrice: 100,
          costPrice: 60,
          isService: false,
        })
        .expect(201);
      productId = prodRes.body.id;

      const whRes = await request(app.getHttpServer())
        .post('/api/v1/inventory/warehouses')
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ name: 'Main Warehouse', code: `WH-${Date.now()}` })
        .expect(201);
      warehouseId = whRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/inventory/stock/${productId}/${warehouseId}/adjust`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ type: 'in', quantity: 100, reason: 'Initial stock' })
        .expect(201);
    });

    it('should create and approve a sales invoice, deducting stock', async () => {
      const docRes = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({
          documentType: 'sales_invoice',
          lines: [
            {
              description: 'Sale of 30 units',
              quantity: 30,
              unitPrice: 100,
              taxRate: 16,
              productId,
              warehouseId,
            },
          ],
        })
        .expect(201);
      invoiceId = docRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${invoiceId}/submit`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${invoiceId}/approve`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      const stockRes1 = await request(app.getHttpServer())
        .get(`/api/v1/inventory/stock/${productId}/${warehouseId}`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      expect(stockRes1.body.quantity).toBe(70);
    });

    it('should create and deliver a purchase order, incrementing stock', async () => {
      const poRes = await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({
          documentType: 'purchase_order',
          lines: [
            {
              description: 'Restock of 50 units',
              quantity: 50,
              unitPrice: 80,
              taxRate: 16,
              productId,
              warehouseId,
            },
          ],
        })
        .expect(201);
      poId = poRes.body.id;

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${poId}/submit`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${poId}/approve`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/v1/tenants/${seed.tenantId}/documents/${poId}/transition`)
        .set('Authorization', `Bearer ${seed.token}`)
        .send({ targetStatus: 'delivered' })
        .expect(200);

      const stockRes2 = await request(app.getHttpServer())
        .get(`/api/v1/inventory/stock/${productId}/${warehouseId}`)
        .set('Authorization', `Bearer ${seed.token}`)
        .expect(200);

      expect(stockRes2.body.quantity).toBe(120);
    });
  });
});
