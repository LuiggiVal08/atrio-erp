import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { BusinessPartnersModule } from '@/core/business-partners/infrastructure/business-partners.module';
import { PartnerMigrationService } from '@/core/business-partners/application/partner-migration.service';
import { PARTNER_REPOSITORY } from '@/core/business-partners/domain/partner.repository.interface';
import type { PartnerRepository } from '@/core/business-partners/domain/partner.repository.interface';
import type { NormalizedPartner, ValidationResult } from '@/core/business-partners/domain/migration.types';

describe('PartnerMigrationService (ETL)', () => {
  let service: PartnerMigrationService;
  let repository: PartnerRepository;
  let prisma: PrismaService;

  const testTenantId = '33333333-3333-4333-8333-333333333333';
  const testUserId = '44444444-4444-4444-8444-444444444444';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, BusinessPartnersModule],
    }).compile();

    service = module.get<PartnerMigrationService>(PartnerMigrationService);
    repository = module.get<PartnerRepository>(PARTNER_REPOSITORY);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        slug: 'test-etl-migration',
        legalName: 'ETL Test Corp',
        taxId: 'J-000000099',
        baseCurrency: 'VED',
        country: 'VE',
        timezone: 'America/Caracas',
      },
    });

    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        tenantId: testTenantId,
        email: 'etl-test@example.com',
        passwordHash: '$2a$10$test',
        name: 'ETL Test',
      },
    });

    const systemId = '00000000-0000-0000-0000-000000000000';
    await prisma.user.upsert({
      where: { id: systemId },
      update: {},
      create: {
        id: systemId,
        tenantId: testTenantId,
        email: 'system@atrio.local',
        passwordHash: '$2a$10$system',
        name: 'System',
      },
    });
  });

  afterAll(async () => {
    await prisma.partnerMigrationReview.deleteMany({
      where: { batchId: { contains: 'test' } },
    });
    await prisma.partnerMigrationMap.deleteMany({
      where: { partner: { tenantId: testTenantId } },
    });
    await prisma.partnerEvent.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerAddress.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.contact.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerTag.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerRole.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partner.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.client.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.vendor.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserId, '00000000-0000-0000-0000-000000000000'] } } });
    await prisma.tenant.delete({ where: { id: testTenantId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const cleanupLegacy = async () => {
    await prisma.partnerMigrationReview.deleteMany({
      where: { batchId: { contains: 'test' } },
    });
    await prisma.partnerMigrationMap.deleteMany({
      where: { partner: { tenantId: testTenantId } },
    });
    await prisma.partnerEvent.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerAddress.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.contact.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerTag.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerRole.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partner.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.client.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.vendor.deleteMany({ where: { tenantId: testTenantId } });
  };

  // ── Extract Stage ──────────────────────────────────────────────

  it('should extract clients from the legacy table', async () => {
    await prisma.client.create({
      data: {
        tenantId: testTenantId,
        documentId: 'DOC-001',
        legalName: 'Client Alpha',
        taxId: 'J-123456789',
        isActive: true,
      },
    });

    const clients = await service.extractClients(testTenantId);
    expect(clients.length).toBeGreaterThanOrEqual(1);
    expect(clients.some((c) => c.documentId === 'DOC-001')).toBe(true);
  });

  it('should extract vendors from the legacy table', async () => {
    await prisma.vendor.create({
      data: {
        tenantId: testTenantId,
        documentId: 'VDR-001',
        legalName: 'Vendor Beta',
        taxId: 'J-987654321',
        isActive: true,
      },
    });

    const vendors = await service.extractVendors(testTenantId);
    expect(vendors.length).toBeGreaterThanOrEqual(1);
    expect(vendors.some((v) => v.documentId === 'VDR-001')).toBe(true);
  });

  // ── Normalize Stage ───────────────────────────────────────────

  it('should normalize a client to a normalized partner', () => {
    const client = {
      id: 'client-1',
      tenantId: testTenantId,
      documentId: 'DOC-001',
      identificationType: 'RIF_VE' as any,
      legalName: 'Client Alpha',
      firstName: 'Alpha',
      middleName: null,
      lastName: 'Client',
      secondLastName: null,
      taxId: 'J-123456789',
      email: 'alpha@test.com',
      phone: '+584121234567',
      addressId: null,
      contributorType: 'formal',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const result = service.normalizeClient(client, testTenantId);
    expect(result.legalName).toBe('Client Alpha');
    expect(result.taxIdValue).toBe('J-123456789');
    expect(result.taxIdCountry).toBe('VE');
    expect(result.taxIdType).toBe('RIF_VE');
    expect(result.status).toBe('ACTIVE');
    expect(result.legacyType).toBe('client');
    expect(result.legacyId).toBe('client-1');
    expect(result.metadataNotes).toContain('formal');
    expect(result.externalId).toBe('DOC-001');
    expect(result.changes.length).toBeGreaterThanOrEqual(1);
  });

  it('should normalize a vendor to a normalized partner', () => {
    const vendor = {
      id: 'vendor-1',
      tenantId: testTenantId,
      documentId: 'VDR-001',
      identificationType: 'RIF_VE' as any,
      legalName: 'Vendor Beta',
      firstName: 'Beta',
      middleName: null,
      lastName: 'Vendor',
      secondLastName: null,
      taxId: 'J-987654321',
      email: 'beta@test.com',
      phone: null,
      addressId: null,
      contactFirstName: 'Contact',
      contactMiddleName: null,
      contactLastName: 'Person',
      contactSecondLastName: null,
      contactIdentificationType: null,
      contactIdentificationNumber: null,
      contactEmail: 'contact@vendor.com',
      contactPhone: null,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const result = service.normalizeVendor(vendor, testTenantId);
    expect(result.legalName).toBe('Vendor Beta');
    expect(result.status).toBe('INACTIVE');
    expect(result.legacyType).toBe('vendor');
    expect(Array.isArray(result.changes)).toBe(true);
  });

  it('should build legal name from person parts when legalName is empty', () => {
    const client = {
      id: 'client-2',
      tenantId: testTenantId,
      documentId: 'DOC-002',
      identificationType: 'RIF_VE' as any,
      legalName: '',
      firstName: 'Juan',
      middleName: 'Carlos',
      lastName: 'Pérez',
      secondLastName: 'García',
      taxId: 'V-12345678',
      email: null,
      phone: null,
      addressId: null,
      contributorType: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const result = service.normalizeClient(client, testTenantId);
    expect(result.legalName).toBe('Juan Carlos Pérez García');
    expect(result.type).toBe('PERSON');
    const change = result.changes.find((c) => c.field === 'legalName');
    expect(change).toBeDefined();
    expect(change!.reason).toBe('built_from_person_parts');
  });

  // ── Validate Stage ─────────────────────────────────────────────

  it('should pass a valid normalized partner', () => {
    const record: NormalizedPartner = {
      tenantId: testTenantId,
      type: 'COMPANY',
      legalName: 'Valid Corp',
      taxIdValue: 'J-123456789',
      taxIdCountry: 'VE',
      taxIdType: 'J',
      commercialName: null,
      email: null,
      phone: null,
      status: 'ACTIVE',
      metadataSource: 'client',
      metadataNotes: null,
      externalId: null,
      legacyType: 'client',
      legacyId: 'client-valid',
      changes: [],
    };

    const result = service.validate(record);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation for missing legalName', () => {
    const record: NormalizedPartner = {
      tenantId: testTenantId,
      type: 'PERSON',
      legalName: '',
      taxIdValue: null,
      taxIdCountry: null,
      taxIdType: null,
      commercialName: null,
      email: null,
      phone: null,
      status: 'ACTIVE',
      metadataSource: 'client',
      metadataNotes: null,
      externalId: null,
      legacyType: 'client',
      legacyId: 'client-invalid',
      changes: [],
    };

    const result = service.validate(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('legalName is required');
  });

  // ── Full Pipeline E2E ──────────────────────────────────────────

  it('should run the full ETL pipeline: extract → normalize → validate → match → load → report', async () => {
    const batchId = `test-batch-${Date.now()}`;

    await prisma.client.create({
      data: {
        tenantId: testTenantId,
        documentId: 'ETL-CLIENT',
        legalName: 'ETL Client Corp',
        taxId: 'J-ETL-001',
        identificationType: 'RIF_VE' as any,
        email: 'etl-client@test.com',
        isActive: true,
      },
    });

    await prisma.vendor.create({
      data: {
        tenantId: testTenantId,
        documentId: 'ETL-VENDOR',
        legalName: 'ETL Vendor Inc',
        taxId: 'J-ETL-002',
        identificationType: 'RIF_VE' as any,
        isActive: true,
      },
    });

    const report = await service.runMigration(testTenantId, batchId);

    expect(report.clientsRead).toBeGreaterThanOrEqual(1);
    expect(report.vendorsRead).toBeGreaterThanOrEqual(1);
    expect(report.partnersCreated).toBeGreaterThanOrEqual(1);
    expect(report.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(report.batchId).toBe(batchId);

    const maps = await prisma.partnerMigrationMap.findMany({
      where: { partner: { tenantId: testTenantId } },
    });
    expect(maps.length).toBeGreaterThanOrEqual(2);

    for (const map of maps) {
      const partner = await repository.findById(map.partnerId);
      expect(partner).not.toBeNull();
    }
  });

  it('should be idempotent - running twice skips already migrated records', async () => {
    const batchId = `idempotent-batch-${Date.now()}`;

    await prisma.client.create({
      data: {
        tenantId: testTenantId,
        documentId: 'IDEM-CLIENT',
        legalName: 'Idempotent Corp',
        taxId: 'J-IDEM-001',
        isActive: true,
      },
    });

    const report1 = await service.runMigration(testTenantId, batchId);
    const report2 = await service.runMigration(testTenantId, batchId);

    expect(report2.partnersCreated).toBe(0);
    expect(report2.autoMerged).toBe(0);
    expect(report2.errors).toBe(0);
  });

  it('should auto-merge records with matching tax identifiers (client+vendor same taxId)', async () => {
    const sharedTaxId = `J-MERGE-${Date.now()}`;

    await prisma.client.create({
      data: {
        tenantId: testTenantId,
        documentId: 'MERGE-CLIENT',
        legalName: 'Merge Client',
        taxId: sharedTaxId,
        isActive: true,
      },
    });

    await prisma.vendor.create({
      data: {
        tenantId: testTenantId,
        documentId: 'MERGE-VENDOR',
        legalName: 'Merge Vendor',
        taxId: sharedTaxId,
        isActive: true,
      },
    });

    const report = await service.runMigration(testTenantId, `merge-batch-${Date.now()}`);

    expect(report.autoMerged).toBe(1);
    expect(report.partnersCreated).toBe(1);

    const partners = await prisma.partner.findMany({
      where: { tenantId: testTenantId, legalName: { in: ['Merge Client', 'Merge Vendor'] } },
    });
    expect(partners.length).toBe(1);

    const roles = await prisma.partnerRole.findMany({
      where: { partnerId: partners[0].id },
    });
    expect(roles.map((r) => r.role).sort()).toEqual(['CUSTOMER', 'SUPPLIER']);
  });

  // ── Report ─────────────────────────────────────────────────────

  it('should produce a valid migration report with distribution metrics', async () => {
    await cleanupLegacy();

    const batchId = `report-batch-${Date.now()}`;

    await prisma.client.create({
      data: {
        tenantId: testTenantId,
        documentId: 'RPT-CLIENT',
        legalName: 'Report Client',
        taxId: 'J-RPT-001',
        isActive: true,
      },
    });

    await prisma.client.create({
      data: {
        tenantId: testTenantId,
        documentId: 'RPT-CLIENT2',
        legalName: '',
        firstName: 'NoName',
        lastName: null,
        taxId: 'J-RPT-002',
        isActive: true,
      },
    });

    const report = await service.runMigration(testTenantId, batchId);

    expect(report.clientsRead).toBeGreaterThanOrEqual(1);
    expect(report.vendorsRead).toBeGreaterThanOrEqual(0);
    expect(report.partnersCreated).toBeGreaterThanOrEqual(0);
    expect(report.rolesCustomer + report.rolesSupplier).toBeGreaterThanOrEqual(1);
    expect(report.elapsedMs).toBeGreaterThan(0);
    expect(report.startTime).toBeDefined();
    expect(report.endTime).toBeDefined();
    expect(new Date(report.endTime).getTime()).toBeGreaterThanOrEqual(new Date(report.startTime).getTime());

    expect(report.matchDistribution).toBeDefined();
    expect(report.matchDistribution.byTaxId).toBeGreaterThanOrEqual(0);
    expect(report.normalizationChanges).toBeDefined();
    const nameChanges = report.normalizationChanges.filter((c) => c.field === 'legalName');
    if (nameChanges.length > 0) {
      expect(nameChanges[0].reason).toBeDefined();
    }
  });

  // ── Edge Cases ─────────────────────────────────────────────────

  it('should correctly classify match confidence by criteria', async () => {
    const batchId = `confidence-batch-${Date.now()}`;

    const partnerViaClient = await repository.create({
      tenantId: testTenantId,
      type: 'COMPANY',
      legalName: 'Confidence Test Corp',
      createdById: testUserId,
      updatedById: testUserId,
      roles: ['CUSTOMER'],
    });

    await prisma.partnerMigrationMap.create({
      data: {
        legacyType: 'client',
        legacyId: 'confidence-legacy',
        partnerId: partnerViaClient.id,
        migrationBatch: batchId,
        matchedBy: 'MANUAL',
        confidence: 'HIGH',
      },
    });

    const mapEntry = await service['findExistingMap']('client', 'confidence-legacy');
    expect(mapEntry).not.toBeNull();

    await prisma.partnerMigrationMap.deleteMany({
      where: { legacyType: 'client', legacyId: 'confidence-legacy' },
    });
    await repository.softDelete(partnerViaClient.id, testUserId);
    await prisma.partner.delete({ where: { id: partnerViaClient.id } }).catch(() => {});
  });
});
