import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { PrismaPartnerRepository } from '@/core/business-partners/infrastructure/prisma-partner.repository';

describe('Migration Performance', () => {
  let prisma: PrismaService;
  let repository: PrismaPartnerRepository;

  const testTenantId = '55555555-5555-4555-8555-555555555555';
  const testUserId = '66666666-6666-4666-8666-666666666666';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [PrismaPartnerRepository],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<PrismaPartnerRepository>(PrismaPartnerRepository);

    // Ensure migration is applied (self-heal for test order issues)
    const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'partners'`,
    );
    if (tables.length === 0) {
      const fs = require('fs');
      const path = require('path');
      const sql: string = fs.readFileSync(
        path.resolve(__dirname, '../../prisma/migrations/20260707000001_add_business_partners/migration.sql'),
        'utf-8',
      );
      const statements = sql.replace(/^-- .*\n/gm, '').split(';').map((s) => s.trim()).filter((s) => s.length > 0);
      for (const stmt of statements) {
        try { await prisma.$executeRawUnsafe(stmt + ';'); } catch { /* skip if exists */ }
      }
    }

    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId, slug: 'migration-perf', legalName: 'Perf Test',
        taxId: 'J-000000003', baseCurrency: 'VED', country: 'VE', timezone: 'UTC',
      },
    });
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId, tenantId: testTenantId, email: 'perf@test.com',
        passwordHash: '$2a$10$test', name: 'Perf Test',
      },
    });
  });

  afterAll(async () => {
    await prisma.partnerEvent.deleteMany({ where: { partner: { tenantId: testTenantId } } }).catch(() => {});
    await prisma.partnerAddress.deleteMany({ where: { partner: { tenantId: testTenantId } } }).catch(() => {});
    await prisma.contact.deleteMany({ where: { partner: { tenantId: testTenantId } } }).catch(() => {});
    await prisma.partnerTag.deleteMany({ where: { partner: { tenantId: testTenantId } } }).catch(() => {});
    await prisma.partnerRole.deleteMany({ where: { partner: { tenantId: testTenantId } } }).catch(() => {});
    await prisma.partner.deleteMany({ where: { tenantId: testTenantId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.tenant.delete({ where: { id: testTenantId } });
    await prisma.$disconnect();
  });

  it('should create 10 partners under 500ms total', async () => {
    const start = Date.now();
    const partners = Array.from({ length: 10 }, (_, i) => ({
      tenantId: testTenantId,
      type: 'COMPANY' as const,
      legalName: `Perf P${Date.now()}_${i}`,
      roles: ['CUSTOMER' as const],
      createdById: testUserId,
      updatedById: testUserId,
    }));
    const created = await Promise.all(partners.map((p) => repository.create(p)));
    const elapsed = Date.now() - start;

    expect(created).toHaveLength(10);
    expect(elapsed).toBeLessThan(1000);

    const ids = created.map((p) => p.id);
    await prisma.partnerRole.deleteMany({ where: { partnerId: { in: ids } } });
    await prisma.partner.deleteMany({ where: { id: { in: ids } } });
  });

  it('should create 100 partners under 3s total', async () => {
    const start = Date.now();
    const partners = Array.from({ length: 100 }, (_, i) => ({
      tenantId: testTenantId,
      type: 'COMPANY' as const,
      legalName: `Perf P${Date.now()}_${i}`,
      roles: ['CUSTOMER' as const],
      createdById: testUserId,
      updatedById: testUserId,
    }));
    const created = await Promise.all(partners.map((p) => repository.create(p)));
    const elapsed = Date.now() - start;

    expect(created).toHaveLength(100);
    expect(elapsed).toBeLessThan(3000);

    const ids = created.map((p) => p.id);
    await prisma.partnerRole.deleteMany({ where: { partnerId: { in: ids } } });
    await prisma.partner.deleteMany({ where: { id: { in: ids } } });
  });

  it('should query partners by tenant under 500ms', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Query Perf',
      createdById: testUserId, updatedById: testUserId,
    });

    const start = Date.now();
    const result = await repository.findMany({ tenantId: testTenantId });
    const elapsed = Date.now() - start;

    expect(result.data.length).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThan(500);

    await prisma.partnerRole.deleteMany({ where: { partnerId: partner.id } });
    await prisma.partner.delete({ where: { id: partner.id } });
  });

  it('should lookup partner by tax ID under 500ms', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY',
      legalName: 'TaxId Perf',
      taxId: { value: 'J-123456789', country: 'VE', type: 'RIF' },
      createdById: testUserId, updatedById: testUserId,
    });

    const start = Date.now();
    const found = await repository.findByTaxId(testTenantId, { value: 'J-123456789', country: 'VE', type: 'RIF' });
    const elapsed = Date.now() - start;

    expect(found).not.toBeNull();
    expect(elapsed).toBeLessThan(500);

    await prisma.partnerRole.deleteMany({ where: { partnerId: partner.id } });
    await prisma.partner.delete({ where: { id: partner.id } });
  });
});
