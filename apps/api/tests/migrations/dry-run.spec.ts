import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { BusinessPartnersModule } from '@/core/business-partners/infrastructure/business-partners.module';
import { PartnerMigrationService } from '@/core/business-partners/application/partner-migration.service';
import { PARTNER_REPOSITORY } from '@/core/business-partners/domain/partner.repository.interface';
import type { PartnerRepository } from '@/core/business-partners/domain/partner.repository.interface';

/**
 * M-002.5 — Migration Dry Run
 *
 * Executes the ETL on a representative dataset and validates:
 * - All stages complete without error
 * - Domain invariants hold on migrated Partners
 * - Idempotency on re-run
 * - Report contains meaningful metrics
 */
describe('M-002.5 Migration Dry Run', () => {
  let service: PartnerMigrationService;
  let repository: PartnerRepository;
  let prisma: PrismaService;

  const tenantId = '55555555-5555-4555-8555-555555555555';
  const userId = '66666666-6666-4666-8666-666666666666';
  const systemId = '11111111-1111-4111-8111-111111111111';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, BusinessPartnersModule],
    }).compile();

    service = module.get<PartnerMigrationService>(PartnerMigrationService);
    repository = module.get<PartnerRepository>(PARTNER_REPOSITORY);
    prisma = module.get<PrismaService>(PrismaService);

    // Clean any residual data from previous failed runs
    await prisma.partnerMigrationReview.deleteMany({ where: { batchId: { contains: 'dry-run' } } });
    await prisma.partnerMigrationMap.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerEvent.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerAddress.deleteMany({ where: { partner: { tenantId } } });
    await prisma.contact.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerTag.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerRole.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partner.deleteMany({ where: { tenantId } });
    await prisma.client.deleteMany({ where: { tenantId } });
    await prisma.vendor.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, systemId] } } });

    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        slug: 'dry-run-migration',
        legalName: 'Dry Run Corp',
        taxId: 'J-DRY-RUN-001',
        baseCurrency: 'VED',
        country: 'VE',
        timezone: 'America/Caracas',
      },
    });

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        tenantId,
        email: 'dry-run@example.com',
        passwordHash: '$2a$10$test',
        name: 'Dry Run Test',
      },
    });

    await prisma.user.upsert({
      where: { id: systemId },
      update: {},
      create: {
        id: systemId,
        tenantId,
        email: 'system@atrio.local',
        passwordHash: '$2a$10$system',
        name: 'System',
      },
    });
  });

  afterAll(async () => {
    await prisma.partnerMigrationReview.deleteMany({
      where: { batchId: { contains: 'dry-run' } },
    });
    await prisma.partnerMigrationMap.deleteMany({
      where: { partner: { tenantId } } });
    await prisma.partnerEvent.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerAddress.deleteMany({ where: { partner: { tenantId } } });
    await prisma.contact.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerTag.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partnerRole.deleteMany({ where: { partner: { tenantId } } });
    await prisma.partner.deleteMany({ where: { tenantId } });
    await prisma.client.deleteMany({ where: { tenantId } });
    await prisma.vendor.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, systemId] } } });
    await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    await prisma.$disconnect();
  });

  // ── Seed representative data ──────────────────────────────────

  const seedRepresentativeData = async () => {
    // 10 clients with clean data
    for (let i = 0; i < 10; i++) {
      await prisma.client.create({
        data: {
          tenantId,
          documentId: `CLN-${String(i + 1).padStart(3, '0')}`,
          legalName: `Cliente Regular ${i + 1} C.A.`,
          taxId: `J-REG-${String(i + 1).padStart(6, '0')}`,
          identificationType: 'RIF_VE' as any,
          email: i % 2 === 0 ? `cliente${i + 1}@empresa.com` : null,
          phone: i % 3 === 0 ? `+58412${String(i + 1).padStart(7, '0')}` : null,
          isActive: i < 8,
          contributorType: i < 5 ? 'formal' : i < 8 ? 'ordinary' : 'special',
        },
      });
    }

    // 5 vendors with clean data
    for (let i = 0; i < 5; i++) {
      await prisma.vendor.create({
        data: {
          tenantId,
          documentId: `VDR-${String(i + 1).padStart(3, '0')}`,
          legalName: `Proveedor ${i + 1} S.A.`,
          taxId: `J-VDR-${String(i + 1).padStart(6, '0')}`,
          identificationType: 'RIF_VE' as any,
          email: `ventas@proveedor${i + 1}.com`,
          isActive: true,
          contactFirstName: 'Contacto',
          contactLastName: `Vdr${i + 1}`,
          contactEmail: `contacto@proveedor${i + 1}.com`,
        },
      });
    }

    // 2 vendors with person names (no legalName → constructs from firstName + lastName)
    for (let i = 0; i < 2; i++) {
      await prisma.vendor.create({
        data: {
          tenantId,
          documentId: `VDR-PERS-${String(i + 1).padStart(3, '0')}`,
          legalName: '',
          firstName: 'Persona',
          middleName: i === 0 ? 'Natural' : null,
          lastName: `Vendedor${i + 1}`,
          taxId: `V-PERS-${String(i + 1).padStart(8, '0')}`,
          identificationType: 'CI_VE' as any,
          isActive: true,
        },
      });
    }

    // 3 clerk-vendor pairs sharing a taxId (merge scenario)
    const sharedTaxIdBase = `J-SHARED-`;
    for (let i = 0; i < 3; i++) {
      const sharedTaxId = `${sharedTaxIdBase}${String(i + 1).padStart(4, '0')}`;
      await prisma.client.create({
        data: {
          tenantId,
          documentId: `CLN-SHARED-${String(i + 1).padStart(3, '0')}`,
          legalName: `Cliente Dual ${i + 1} C.A.`,
          taxId: sharedTaxId,
          identificationType: 'RIF_VE' as any,
          isActive: true,
        },
      });
      await prisma.vendor.create({
        data: {
          tenantId,
          documentId: `VDR-SHARED-${String(i + 1).padStart(3, '0')}`,
          legalName: `Proveedor Dual ${i + 1} C.A.`,
          taxId: sharedTaxId,
          identificationType: 'RIF_VE' as any,
          isActive: true,
        },
      });
    }

    // 1 record with missing data that will fail validation
    await prisma.client.create({
      data: {
        tenantId,
        documentId: 'CLN-INVALID',
        legalName: '',
        taxId: 'J-INVALID-001',
        identificationType: null,
        isActive: true,
      },
    });
  };

  // ── Test: Representative Dataset ──────────────────────────────

  it('should seed and migrate a representative dataset', async () => {
    await seedRepresentativeData();

    const batchId = `dry-run-${Date.now()}`;
    const report = await service.runMigration(tenantId, batchId);

    // Verify report structure
    expect(report.clientsRead).toBe(14);
    expect(report.vendorsRead).toBe(10);

    // 10 clean + 3 shared (client side) + 1 fallback = 14 clients
    // 5 clean + 2 person-name + 3 shared (vendor side) = 10 vendors
    // 24 total, all valid (empty legalName falls back to 'UNKNOWN')
    // 3 shared pairs: first creates partner (3), second auto-merges (3)
    // 10 clean clients = 10 partners,
    // 5 clean vendors = 5 partners,
    // 2 person-name vendors = 2 partners
    // 3 shared unique partners = 3 partners
    // 1 fallback (legalName='UNKNOWN') = 1 partner
    // Total: 10 + 5 + 2 + 3 + 1 = 21 partners, 3 autoMerged
    expect(report.partnersCreated).toBe(21);
    expect(report.autoMerged).toBe(3);
    expect(report.matchDistribution.byTaxId).toBe(3);
    // 0 errors — buildLegalName provides fallback 'UNKNOWN'
    expect(report.errors).toBe(0);
    // Roles: 10 clean + 3 shared + 1 fallback = 14 CUSTOMER
    // 5 clean + 2 person + 3 shared = 10 SUPPLIER
    expect(report.rolesCustomer).toBe(14);
    expect(report.rolesSupplier).toBe(10);

    // Normalization changes tracked
    expect(report.normalizationChanges.length).toBeGreaterThanOrEqual(2);

    // Timing
    expect(report.elapsedMs).toBeGreaterThan(0);
    expect(report.elapsedMs).toBeLessThan(30000);
  });

  // ── Domain Invariants ─────────────────────────────────────────

  it('should enforce Partner domain invariants on all migrated records', async () => {
    const partners = await prisma.partner.findMany({
      where: { tenantId },
      include: {
        roles: true,
        contacts: true,
      },
    });

    expect(partners.length).toBe(21);

    for (const partner of partners) {
      // Every partner must have a legalName
      expect(partner.legalName).toBeTruthy();
      expect(partner.legalName.trim().length).toBeGreaterThan(0);

      // Every partner must have at least one role
      expect(partner.roles.length).toBeGreaterThanOrEqual(1);

      // Type must be valid
      expect(['PERSON', 'COMPANY']).toContain(partner.type);

      // Status must be valid
      expect(['ACTIVE', 'INACTIVE']).toContain(partner.status);

      // Contacts are optional but must have valid data when present
      for (const contact of partner.contacts) {
        expect(contact.fullName).toBeTruthy();
        if (contact.deletedAt) continue;
      }
    }

    // Verify the merged partners have both roles
    const mergedPartners = partners.filter((p) => p.roles.length >= 2);
    expect(mergedPartners.length).toBe(3);

    for (const mp of mergedPartners) {
      const roleTypes = mp.roles.map((r) => r.role).sort();
      expect(roleTypes).toEqual(['CUSTOMER', 'SUPPLIER']);
    }
  });

  // ── Idempotency ──────────────────────────────────────────────

  it('should be idempotent on re-run', async () => {
    const secondBatchId = `dry-run-2-${Date.now()}`;
    const report = await service.runMigration(tenantId, secondBatchId);

    expect(report.partnersCreated).toBe(0);
    expect(report.autoMerged).toBe(0);
    expect(report.clientsRead).toBe(14);
    expect(report.vendorsRead).toBe(10);

    // Verify partner count hasn't changed
    const countAfter = await prisma.partner.count({ where: { tenantId } });
    expect(countAfter).toBe(21);
  });

  // ── Migration Map Integrity ───────────────────────────────────

  it('should have a complete migration map for every legacy record', async () => {
    const clientIds = (await prisma.client.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true },
    })).map((c) => c.id);

    const vendorIds = (await prisma.vendor.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true },
    })).map((v) => v.id);

    for (const id of clientIds) {
      const mapEntry = await prisma.partnerMigrationMap.findUnique({
        where: { legacyType_legacyId: { legacyType: 'client', legacyId: id } },
      });
      expect(mapEntry).not.toBeNull();
    }

    for (const id of vendorIds) {
      const mapEntry = await prisma.partnerMigrationMap.findUnique({
        where: { legacyType_legacyId: { legacyType: 'vendor', legacyId: id } },
      });
      expect(mapEntry).not.toBeNull();
    }
  });
});
