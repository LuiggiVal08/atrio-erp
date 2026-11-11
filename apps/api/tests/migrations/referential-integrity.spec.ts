import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { PrismaPartnerRepository } from '@/core/business-partners/infrastructure/prisma-partner.repository';

describe('Migration Referential Integrity', () => {
  let prisma: PrismaService;
  let repository: PrismaPartnerRepository;

  const testTenantId = '33333333-3333-4333-8333-333333333333';
  const testUserId = '44444444-4444-4444-8444-444444444444';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [PrismaPartnerRepository],
    }).compile();
    prisma = module.get<PrismaService>(PrismaService);
    repository = module.get<PrismaPartnerRepository>(PrismaPartnerRepository);

    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId, slug: 'migration-integrity', legalName: 'Integrity Test',
        taxId: 'J-000000002', baseCurrency: 'VED', country: 'VE', timezone: 'UTC',
      },
    });
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId, tenantId: testTenantId, email: 'integrity@test.com',
        passwordHash: '$2a$10$test', name: 'Integrity Test',
      },
    });
  });

  afterAll(async () => {
    await prisma.partnerEvent.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerAddress.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.contact.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerTag.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partnerRole.deleteMany({ where: { partner: { tenantId: testTenantId } } });
    await prisma.partner.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
    await prisma.tenant.delete({ where: { id: testTenantId } });
    await prisma.$disconnect();
  });

  it('should cascade delete roles when partner is hard-deleted', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Cascade Test',
      roles: ['CUSTOMER', 'SUPPLIER'], createdById: testUserId, updatedById: testUserId,
    });

    await prisma.partner.delete({ where: { id: partner.id } });

    const roles = await prisma.partnerRole.findMany({ where: { partnerId: partner.id } });
    expect(roles).toHaveLength(0);
  });

  it('should cascade delete tags when partner is hard-deleted', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Cascade Tags',
      createdById: testUserId, updatedById: testUserId,
    });
    await repository.addTags(partner.id, ['test-tag']);

    await prisma.partner.delete({ where: { id: partner.id } });

    const tags = await prisma.partnerTag.findMany({ where: { partnerId: partner.id } });
    expect(tags).toHaveLength(0);
  });

  it('should enforce tenant FK constraint on partners', async () => {
    await expect(
      prisma.partner.create({
        data: {
          id: '00000000-0000-4000-8000-000000000000',
          tenantId: '00000000-0000-4000-8000-000000000000',
          type: 'COMPANY', legalName: 'Orphan',
          createdById: testUserId, updatedById: testUserId,
        },
      }),
    ).rejects.toThrow(/foreign key/i);
  });

  it('should enforce user FK constraint on partners', async () => {
    await expect(
      prisma.partner.create({
        data: {
          id: '00000000-0000-4000-8000-000000000001',
          tenantId: testTenantId,
          type: 'COMPANY', legalName: 'Orphan User',
          createdById: '00000000-0000-4000-8000-000000000000',
          updatedById: testUserId,
        },
      }),
    ).rejects.toThrow(/foreign key/i);
  });

  it('should cascade delete contacts when partner is hard-deleted', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Cascade Contact',
      createdById: testUserId, updatedById: testUserId,
    });
    await repository.addContact({
      partnerId: partner.id, fullName: 'Contact',
      email: 'cascade@test.com', isPrimary: true,
      createdById: testUserId, updatedById: testUserId,
    });
    await prisma.partner.delete({ where: { id: partner.id } });

    const contacts = await prisma.contact.findMany({ where: { partnerId: partner.id } });
    expect(contacts).toHaveLength(0);
  });

  it('should cascade delete addresses when partner is hard-deleted', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Cascade Address',
      createdById: testUserId, updatedById: testUserId,
    });
    await repository.addAddress({
      partnerId: partner.id, type: 'FISCAL', line1: 'Cascade St',
      city: 'Test', state: 'Test', country: 'VE', isPrimary: true,
      createdById: testUserId, updatedById: testUserId,
    });
    await prisma.partner.delete({ where: { id: partner.id } });

    const addrs = await prisma.partnerAddress.findMany({ where: { partnerId: partner.id } });
    expect(addrs).toHaveLength(0);
  });

  it('should cascade delete events when partner is hard-deleted', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Cascade Event',
      createdById: testUserId, updatedById: testUserId,
    });
    await repository.addEvent(partner.id, 'partner.created', { test: true }, testUserId);
    await prisma.partner.delete({ where: { id: partner.id } });

    const events = await prisma.partnerEvent.findMany({ where: { partnerId: partner.id } });
    expect(events).toHaveLength(0);
  });
});
