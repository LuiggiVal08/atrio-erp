import { PrismaPartnerRepository } from '@/core/business-partners/infrastructure/prisma-partner.repository';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@/infrastructure/database/database.module';

describe('PrismaPartnerRepository', () => {
  let repository: PrismaPartnerRepository;
  let prisma: PrismaService;

  const testTenantId = '11111111-1111-4111-8111-111111111111';
  const testUserId = '22222222-2222-4222-8222-222222222222';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [PrismaPartnerRepository],
    }).compile();

    repository = module.get<PrismaPartnerRepository>(PrismaPartnerRepository);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.tenant.upsert({
      where: { id: testTenantId },
      update: {},
      create: {
        id: testTenantId,
        slug: 'test-business-partners',
        legalName: 'Test Corp',
        taxId: 'J-000000001',
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
        email: 'partner-test@example.com',
        passwordHash: '$2a$10$test',
        name: 'Partner Test',
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

  const cleanup = async (partnerId: string) => {
    await prisma.partnerEvent.deleteMany({ where: { partnerId } });
    await prisma.partnerAddress.deleteMany({ where: { partnerId } });
    await prisma.contact.deleteMany({ where: { partnerId } });
    await prisma.partnerTag.deleteMany({ where: { partnerId } });
    await prisma.partnerRole.deleteMany({ where: { partnerId } });
    await prisma.partner.delete({ where: { id: partnerId } }).catch(() => {});
  };

  it('should create a Partner with PROSPECT default role', async () => {
    const partner = await repository.create({
      tenantId: testTenantId,
      type: 'COMPANY',
      legalName: 'Test Corp',
      createdById: testUserId,
      updatedById: testUserId,
    });

    expect(partner.id).toBeDefined();
    expect(partner.legalName).toBe('Test Corp');
    expect(partner.type).toBe('COMPANY');
    expect(partner.status).toBe('ACTIVE');

    const found = await repository.findById(partner.id);
    expect(found).not.toBeNull();
    expect(found!.roles).toHaveLength(1);
    expect(found!.roles[0].role).toBe('PROSPECT');

    await cleanup(partner.id);
  });

  it('should create a Partner with specific roles', async () => {
    const partner = await repository.create({
      tenantId: testTenantId,
      type: 'COMPANY',
      legalName: 'Dual Role Corp',
      roles: ['CUSTOMER', 'SUPPLIER'],
      createdById: testUserId,
      updatedById: testUserId,
    });

    const found = await repository.findById(partner.id);
    expect(found!.roles).toHaveLength(2);
    expect(found!.roles.map((r) => r.role).sort()).toEqual(['CUSTOMER', 'SUPPLIER']);

    await cleanup(partner.id);
  });

  it('should find Partners by tenant with filters', async () => {
    const p1 = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Alpha Corp',
      roles: ['CUSTOMER'], createdById: testUserId, updatedById: testUserId,
    });
    const p2 = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Beta Supply',
      roles: ['SUPPLIER'], createdById: testUserId, updatedById: testUserId,
    });

    const result = await repository.findMany({ tenantId: testTenantId, roles: ['CUSTOMER'] });
    expect(result.data.some((p) => p.id === p1.id)).toBe(true);
    expect(result.data.some((p) => p.id === p2.id)).toBe(false);

    await cleanup(p1.id);
    await cleanup(p2.id);
  });

  it('should assign and remove roles', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Role Test',
      createdById: testUserId, updatedById: testUserId,
    });

    await repository.assignRole(partner.id, 'CUSTOMER');
    let found = await repository.findById(partner.id);
    expect(found!.roles.some((r) => r.role === 'CUSTOMER')).toBe(true);

    await repository.removeRole(partner.id, 'CUSTOMER');
    found = await repository.findById(partner.id);
    expect(found!.roles.some((r) => r.role === 'CUSTOMER')).toBe(false);

    await cleanup(partner.id);
  });

  it('should manage tags', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Tag Test',
      createdById: testUserId, updatedById: testUserId,
    });

    await repository.addTags(partner.id, ['VIP', 'Mayorista']);
    let found = await repository.findById(partner.id);
    expect(found!.tags.map((t) => t.value).sort()).toEqual(['Mayorista', 'VIP']);

    await repository.removeTags(partner.id, ['Mayorista']);
    found = await repository.findById(partner.id);
    expect(found!.tags.map((t) => t.value)).toEqual(['VIP']);

    await cleanup(partner.id);
  });

  it('should add and manage contacts', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Contact Test',
      createdById: testUserId, updatedById: testUserId,
    });

    const contact = await repository.addContact({
      partnerId: partner.id, fullName: 'John Doe', email: 'john@test.com',
      isPrimary: true, createdById: testUserId, updatedById: testUserId,
    });

    const found = await repository.findById(partner.id);
    expect(found!.contacts).toHaveLength(1);
    expect(found!.contacts[0].fullName).toBe('John Doe');
    expect(found!.contacts[0].isPrimary).toBe(true);

    await repository.softDeleteContact(contact.id);
    const afterDelete = await repository.findById(partner.id);
    expect(afterDelete!.contacts).toHaveLength(0);

    await cleanup(partner.id);
  });

  it('should add and manage addresses', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Address Test',
      createdById: testUserId, updatedById: testUserId,
    });

    const address = await repository.addAddress({
      partnerId: partner.id, type: 'FISCAL', line1: 'Av. Principal 123',
      city: 'Caracas', state: 'Distrito Capital', country: 'VE',
      isPrimary: true, createdById: testUserId, updatedById: testUserId,
    });

    const found = await repository.findById(partner.id);
    expect(found!.addresses).toHaveLength(1);
    expect(found!.addresses[0].line1).toBe('Av. Principal 123');

    await repository.softDeleteAddress(address.id);
    const afterDelete = await repository.findById(partner.id);
    expect(afterDelete!.addresses).toHaveLength(0);

    await cleanup(partner.id);
  });

  it('should soft delete and restore a Partner', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Delete Test',
      createdById: testUserId, updatedById: testUserId,
    });

    await repository.softDelete(partner.id, testUserId);
    let found = await repository.findById(partner.id);
    expect(found).toBeNull();

    await repository.restore(partner.id, testUserId);
    found = await repository.findById(partner.id);
    expect(found).not.toBeNull();
    expect(found!.status).toBe('ACTIVE');

    await cleanup(partner.id);
  });

  it('should record partner events', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Event Test',
      createdById: testUserId, updatedById: testUserId,
    });

    await repository.addEvent(partner.id, 'partner.created', { legalName: 'Event Test' }, testUserId);
    await repository.addEvent(partner.id, 'partner.role_assigned', { role: 'CUSTOMER' }, testUserId);

    const events = await prisma.partnerEvent.findMany({ where: { partnerId: partner.id }, orderBy: { occurredAt: 'asc' } });
    expect(events).toHaveLength(2);
    expect(events[0].eventType).toBe('partner.created');
    expect(events[1].eventType).toBe('partner.role_assigned');

    await cleanup(partner.id);
  });

  it('should search Partners by legalName', async () => {
    const partner = await repository.create({
      tenantId: testTenantId, type: 'COMPANY', legalName: 'Searchable Corp',
      createdById: testUserId, updatedById: testUserId,
    });

    const result = await repository.findMany({ tenantId: testTenantId, search: 'Searchable' });
    expect(result.data.some((p) => p.id === partner.id)).toBe(true);

    await cleanup(partner.id);
  });
});
