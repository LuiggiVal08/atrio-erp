import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';

const TEST_DB_URL = process.env.DATABASE_URL || '';
const canConnectToDb = TEST_DB_URL.length > 0;

const describeIf = canConnectToDb ? describe : describe.skip;

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_USER_ID = '00000000-0000-0000-0000-000000000002';
const TEST_ROLE_ID = '00000000-0000-0000-0000-000000000003';

const DOCUMENT_PERMISSIONS = [
  'documents:create', 'documents:read', 'documents:submit',
  'documents:approve', 'documents:reject', 'documents:transition',
  'documents:counter', 'documents:delete',
];

describeIf('Document Engine E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs, user_roles, role_permissions, permissions, roles, users, tenants CASCADE');

    await prisma.tenant.create({
      data: {
        id: TEST_TENANT_ID,
        legalName: 'Test Corp',
        taxId: 'J-TEST-001',
        baseCurrency: 'VED',
      },
    });

    const passwordHash = await bcrypt.hash('password', 10);
    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        tenantId: TEST_TENANT_ID,
        email: 'test@example.com',
        passwordHash,
        name: 'Test User',
      },
    });

    await prisma.role.create({
      data: {
        id: TEST_ROLE_ID,
        tenantId: TEST_TENANT_ID,
        name: 'admin',
        isSystem: true,
      },
    });

    for (const code of DOCUMENT_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, name: code, module: 'documents', action: code.split(':')[1] },
      });
    }

    const permRecords = await prisma.permission.findMany({
      where: { code: { in: DOCUMENT_PERMISSIONS } },
    });

    for (const perm of permRecords) {
      await prisma.rolePermission.create({
        data: { roleId: TEST_ROLE_ID, permissionId: perm.id },
      }).catch(() => {});
    }

    await prisma.userRole.create({
      data: { userId: TEST_USER_ID, roleId: TEST_ROLE_ID },
    }).catch(() => {});

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    jwtService = app.get(JwtService);
    authToken = jwtService.sign({
      sub: TEST_USER_ID,
      tenantId: TEST_TENANT_ID,
      jti: 'test-jti',
    }, { secret: process.env.JWT_SECRET || 'dev-secret' });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (prisma) {
      await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs, user_roles, role_permissions, document_events, document_lines, documents, permissions, roles, users, tenants CASCADE');
      await prisma.$disconnect();
    }
  });

  let documentId: string;

  it('POST /tenants/:tenantId/documents — create draft', async () => {
    const res = await request(app.getHttpServer())
      .post(`/tenants/${TEST_TENANT_ID}/documents`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        documentType: 'sales_invoice',
        currency: 'VED',
        lines: [
          { description: 'Widget A', quantity: 5, unitPrice: 100, taxRate: 16 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.documentType).toBe('sales_invoice');
    expect(res.body.subtotal).toBe(500);
    expect(res.body.taxTotal).toBe(80);
    expect(res.body.grandTotal).toBe(580);
    expect(res.body.documentNumber).toMatch(/^INV-/);
    expect(res.body.lines).toHaveLength(1);
    documentId = res.body.id;
  });

  it('POST /tenants/:tenantId/documents/:id/submit — submit for approval', async () => {
    const res = await request(app.getHttpServer())
      .post(`/tenants/${TEST_TENANT_ID}/documents/${documentId}/submit`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending_approval');
  });

  it('POST /tenants/:tenantId/documents/:id/approve — approve document', async () => {
    const res = await request(app.getHttpServer())
      .post(`/tenants/${TEST_TENANT_ID}/documents/${documentId}/approve`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('approved');
    expect(res.body.approvedById).toBe(TEST_USER_ID);
    expect(res.body.approvedAt).toBeDefined();
  });

  it('GET /tenants/:tenantId/documents — list with filters', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tenants/${TEST_TENANT_ID}/documents?status=approved`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('GET /tenants/:tenantId/documents/:id — get single with lines', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tenants/${TEST_TENANT_ID}/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.document.id).toBe(documentId);
    expect(res.body.lines).toHaveLength(1);
  });

  it('POST /tenants/:tenantId/documents/:id/transition — valid transition: approved → delivered', async () => {
    const res = await request(app.getHttpServer())
      .post(`/tenants/${TEST_TENANT_ID}/documents/${documentId}/transition`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetStatus: 'delivered' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('delivered');
  });

  it('POST /tenants/:tenantId/documents/:id/transition — invalid transition: delivered → draft', async () => {
    const res = await request(app.getHttpServer())
      .post(`/tenants/${TEST_TENANT_ID}/documents/${documentId}/transition`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ targetStatus: 'draft' });

    expect(res.status).toBe(400);
  });

  it('POST /tenants/:tenantId/documents/:id/counter — create credit note', async () => {
    const res = await request(app.getHttpServer())
      .post(`/tenants/${TEST_TENANT_ID}/documents/${documentId}/counter`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        counterDocumentType: 'credit_note',
        reason: 'Price adjustment',
        lines: [
          { description: 'Correction', quantity: 1, unitPrice: -50, taxRate: 0 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.originalDocumentId).toBe(documentId);
  });

  it('GET /tenants/:tenantId/documents/:id/events — verify events persisted', async () => {
    const res = await request(app.getHttpServer())
      .get(`/tenants/${TEST_TENANT_ID}/documents/${documentId}/events`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    const eventTypes = res.body.map((e: any) => e.eventType);
    expect(eventTypes).toContain('document.approved');
  });

  it('DELETE /tenants/:tenantId/documents/:id — cannot delete approved document', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/tenants/${TEST_TENANT_ID}/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
  });

  it('returns 401 without auth token', async () => {
    await request(app.getHttpServer())
      .get(`/tenants/${TEST_TENANT_ID}/documents`)
      .expect(401);
  });

  it('returns 401 with invalid auth token', async () => {
    await request(app.getHttpServer())
      .get(`/tenants/${TEST_TENANT_ID}/documents`)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });
});
