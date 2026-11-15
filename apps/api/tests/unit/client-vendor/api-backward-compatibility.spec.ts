import { PartnerCompatibilityAdapter } from '../../../src/modules/client-vendor/infrastructure/partner-compatibility.adapter';
import { PartnerToClientMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-client.mapper';
import { PartnerToVendorMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-vendor.mapper';
import { CompatibilityMetricsService } from '../../../src/modules/client-vendor/infrastructure/compatibility-metrics.service';
import type { PartnerService } from '../../../src/core/business-partners/application/partner.service';
import type { PartnerRepository } from '../../../src/core/business-partners/domain/partner.repository.interface';
import type { PartnerWithRelations } from '../../../src/core/business-partners/domain/partner.entity';

describe('API Backward Compatibility (contract)', () => {
  let adapter: PartnerCompatibilityAdapter;
  let mockPrisma: any;
  let mockPartnerService: jest.Mocked<PartnerService>;
  let mockPartnerRepository: jest.Mocked<Pick<PartnerRepository, 'findById' | 'addContact'>>;

  const now = new Date('2026-07-07T12:00:00Z');

  const basePartner: PartnerWithRelations = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    tenantId: 't1',
    type: 'COMPANY',
    legalName: 'ACME Corp',
    taxId: { value: 'J-123456789', country: 'VE', type: 'J' },
    commercialName: null,
    website: null,
    status: 'ACTIVE',
    metadataSource: null,
    metadataNotes: null,
    externalId: 'DOC-001',
    createdById: 'sys',
    updatedById: 'sys',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    roles: [{ role: 'CUSTOMER', assignedAt: now }],
    tags: [],
    contacts: [{ id: 'c1', fullName: 'John Doe', email: 'john@acme.com', phone: '555-0100', mobile: null, position: null, isPrimary: true, deletedAt: null }],
    addresses: [],
  };

  beforeEach(() => {
    mockPrisma = {
      user: { findFirst: jest.fn().mockResolvedValue({ id: 'admin-1' }) },
      partnerMigrationMap: { findUnique: jest.fn().mockResolvedValue(null) },
    };

    mockPartnerService = {
      findPartnersByRole: jest.fn(),
      findPartnerById: jest.fn().mockResolvedValue(basePartner),
      findPartnerByLegacyId: jest.fn(),
      resolvePartnerId: jest.fn().mockImplementation((_type: string, legacyId: string) => Promise.resolve(legacyId)),
      createPartner: jest.fn(),
      updatePartner: jest.fn(),
      softDeletePartner: jest.fn(),
      assignRole: jest.fn(),
      getLegacyType: jest.fn(),
    } as any;

    mockPartnerRepository = {
      findById: jest.fn().mockResolvedValue(basePartner),
      addContact: jest.fn().mockResolvedValue({ id: 'c1' }),
    };

    adapter = new PartnerCompatibilityAdapter(
      mockPrisma as any,
      mockPartnerService as any,
      mockPartnerRepository as any,
      new PartnerToClientMapper(),
      new PartnerToVendorMapper(),
      new CompatibilityMetricsService(),
    );
  });

  describe('Client shape (legacy /clients endpoint)', () => {
    it('should return Client entity with same fields as PrismaClientVendorRepository', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const client = await adapter.findClientById('550e8400-e29b-41d4-a716-446655440000');

      expect(client).toBeInstanceOf(Object);
      expect(client).toHaveProperty('id');
      expect(client).toHaveProperty('tenantId');
      expect(client).toHaveProperty('documentId');
      expect(client).toHaveProperty('identificationType');
      expect(client).toHaveProperty('legalName');
      expect(client).toHaveProperty('firstName');
      expect(client).toHaveProperty('middleName');
      expect(client).toHaveProperty('lastName');
      expect(client).toHaveProperty('secondLastName');
      expect(client).toHaveProperty('taxId');
      expect(client).toHaveProperty('email');
      expect(client).toHaveProperty('phone');
      expect(client).toHaveProperty('addressId');
      expect(client).toHaveProperty('contributorType');
      expect(client).toHaveProperty('isActive');
      expect(client).toHaveProperty('createdAt');
      expect(client).toHaveProperty('updatedAt');
      expect(client).toHaveProperty('deletedAt');
    });

    it('should serialize id as string (UUID)', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const client = await adapter.findClientById('550e8400-e29b-41d4-a716-446655440000');
      expect(typeof client!.id).toBe('string');
      expect(client!.id).toMatch(/^[0-9a-f-]+$/);
    });

    it('should flatten Partner.taxId into Client taxId string', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const client = await adapter.findClientById('p1');
      expect(typeof client!.taxId).toBe('string');
      expect(client!.taxId).toBe('J-123456789');
    });

    it('should map Partner status ACTIVE → isActive true', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const client = await adapter.findClientById('p1');
      expect(client!.isActive).toBe(true);
    });

    it('should map Partner status INACTIVE → isActive false', async () => {
      const inactive = { ...basePartner, status: 'INACTIVE' as const };
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(inactive);
      const client = await adapter.findClientById('p1');
      expect(client!.isActive).toBe(false);
    });

    it('should preserve createdAt and updatedAt as Date objects', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const client = await adapter.findClientById('p1');
      expect(client!.createdAt).toBeInstanceOf(Date);
      expect(client!.updatedAt).toBeInstanceOf(Date);
    });

    it('should return created client with same id on round-trip', async () => {
      const created = { ...basePartner, id: 'new-uuid-1', legalName: 'New Corp' };
      (mockPartnerService.createPartner as jest.Mock).mockResolvedValue(created);
      (mockPartnerRepository.findById as jest.Mock).mockResolvedValue(created);

      const result = await adapter.createClient({
        tenantId: 't1',
        documentId: 'DOC-002',
        legalName: 'New Corp',
        taxId: 'J-999',
      });
      expect(result.id).toBe('new-uuid-1');
      expect(result.legalName).toBe('New Corp');
    });

    it('should return null for deletedAt when partner has no deletedAt', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const client = await adapter.findClientById('p1');
      expect(client!.deletedAt).toBeNull();
    });

    it('should not return a soft-deleted partner (null, not found)', async () => {
      const deleted = { ...basePartner, deletedAt: new Date('2026-07-07T13:00:00Z') };
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(deleted);
      const client = await adapter.findClientById('p1');
      expect(client).toBeNull();
    });
  });

  describe('Vendor shape (legacy /vendors endpoint)', () => {
    it('should return Vendor entity with same fields as PrismaClientVendorRepository', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const vendor = await adapter.findVendorById('p1');

      expect(vendor).toBeInstanceOf(Object);
      expect(vendor).toHaveProperty('id');
      expect(vendor).toHaveProperty('tenantId');
      expect(vendor).toHaveProperty('documentId');
      expect(vendor).toHaveProperty('identificationType');
      expect(vendor).toHaveProperty('legalName');
      expect(vendor).toHaveProperty('firstName');
      expect(vendor).toHaveProperty('middleName');
      expect(vendor).toHaveProperty('lastName');
      expect(vendor).toHaveProperty('secondLastName');
      expect(vendor).toHaveProperty('taxId');
      expect(vendor).toHaveProperty('email');
      expect(vendor).toHaveProperty('phone');
      expect(vendor).toHaveProperty('addressId');
      expect(vendor).toHaveProperty('contactFirstName');
      expect(vendor).toHaveProperty('contactMiddleName');
      expect(vendor).toHaveProperty('contactLastName');
      expect(vendor).toHaveProperty('contactSecondLastName');
      expect(vendor).toHaveProperty('contactIdentificationType');
      expect(vendor).toHaveProperty('contactIdentificationNumber');
      expect(vendor).toHaveProperty('contactEmail');
      expect(vendor).toHaveProperty('contactPhone');
      expect(vendor).toHaveProperty('isActive');
      expect(vendor).toHaveProperty('createdAt');
      expect(vendor).toHaveProperty('updatedAt');
      expect(vendor).toHaveProperty('deletedAt');
    });

    it('should populate contact fields from primary contact on vendor creation', async () => {
      const created = {
        ...basePartner,
        id: 'v-uuid-1',
        contacts: [{ id: 'c99', fullName: 'Jane', email: 'jane@supply.com', phone: '555-0200', mobile: null, position: null, isPrimary: true, deletedAt: null }],
      };
      (mockPartnerService.createPartner as jest.Mock).mockResolvedValue(created);
      (mockPartnerRepository.findById as jest.Mock).mockResolvedValue(created);

      const vendor = await adapter.createVendor({
        tenantId: 't1',
        documentId: 'DOC-003',
        legalName: 'Supply Inc',
        taxId: 'J-888',
        contactFirstName: 'Jane',
        contactEmail: 'jane@supply.com',
        contactPhone: '555-0200',
      });

      expect(vendor.contactEmail).toBe('jane@supply.com');
      expect(vendor.contactPhone).toBe('555-0200');
    });
  });

  describe('Error handling parity', () => {
    it('should return null not throw when client not found', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(null);
      const result = await adapter.findClientById('missing');
      expect(result).toBeNull();
    });

    it('should return null not throw when vendor not found', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(null);
      const result = await adapter.findVendorById('missing');
      expect(result).toBeNull();
    });

    it('should propagate error from createPartner', async () => {
      (mockPartnerService.createPartner as jest.Mock).mockRejectedValue(new Error('DB error'));
      await expect(
        adapter.createClient({ tenantId: 't1', documentId: 'D1', legalName: 'X', taxId: 'J-1' }),
      ).rejects.toThrow('DB error');
    });
  });

  describe('ID resolution via migration_map', () => {
    it('should resolve legacy client IDs via migration_map', async () => {
      mockPrisma.partnerMigrationMap.findUnique.mockResolvedValue({
        legacyType: 'client',
        legacyId: 'legacy-123',
        partnerId: 'partner-uuid',
        migratedAt: now,
      });
      (mockPartnerService.resolvePartnerId as jest.Mock).mockRestore();
      jest.spyOn(mockPartnerService, 'resolvePartnerId').mockImplementation(async (_type, _legacyId) => 'partner-uuid');
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);

      const client = await adapter.findClientById('legacy-123');
      expect(mockPartnerService.resolvePartnerId).toHaveBeenCalledWith('client', 'legacy-123');
      expect(client).not.toBeNull();
      expect(client!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('findAll clients/vendors', () => {
    it('should sort clients by legalName ascending', async () => {
      const p1 = { ...basePartner, id: 'p1', legalName: 'B Corp' };
      const p2 = { ...basePartner, id: 'p2', legalName: 'A Corp' };
      (mockPartnerService.findPartnersByRole as jest.Mock).mockResolvedValue({
        data: [
          { id: 'p1', legalName: 'B Corp', status: 'ACTIVE', roles: ['CUSTOMER'] },
          { id: 'p2', legalName: 'A Corp', status: 'ACTIVE', roles: ['CUSTOMER'] },
        ],
        total: 2, page: 1, pageSize: 100,
      });
      mockPartnerRepository.findById.mockImplementation(async (id: string) => {
        return id === 'p1' ? p1 : p2;
      });

      const clients = await adapter.findAllClients('t1');
      expect(clients[0].legalName).toBe('A Corp');
      expect(clients[1].legalName).toBe('B Corp');
    });
  });

  describe('Soft-delete contract', () => {
    it('should soft delete client → findClientById returns null', async () => {
      jest.spyOn(mockPartnerService, 'softDeletePartner').mockResolvedValue(undefined);
      jest.spyOn(mockPartnerService, 'resolvePartnerId').mockResolvedValue('p1');

      await adapter.softDeleteClient('p1');
      expect(mockPartnerService.softDeletePartner).toHaveBeenCalledWith('p1', expect.any(String));

      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue({ ...basePartner, deletedAt: new Date() });
      const result = await adapter.findClientById('p1');
      expect(result).toBeNull();
    });

    it('should soft delete vendor → findVendorById returns null', async () => {
      jest.spyOn(mockPartnerService, 'softDeletePartner').mockResolvedValue(undefined);
      jest.spyOn(mockPartnerService, 'resolvePartnerId').mockResolvedValue('v1');

      await adapter.softDeleteVendor('v1');
      expect(mockPartnerService.softDeletePartner).toHaveBeenCalledWith('v1', expect.any(String));

      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue({ ...basePartner, id: 'v1', deletedAt: new Date() });
      const result = await adapter.findVendorById('v1');
      expect(result).toBeNull();
    });

    it('should soft delete client → findAllClients excludes deleted partners', async () => {
      jest.spyOn(mockPartnerService, 'findPartnersByRole').mockResolvedValue({
        data: [
          { id: 'active-p', type: 'COMPANY', legalName: 'Active', status: 'ACTIVE', roles: ['CUSTOMER'], tags: [], createdAt: new Date() },
          { id: 'deleted-p', type: 'COMPANY', legalName: 'Deleted', status: 'ARCHIVED', roles: ['CUSTOMER'], tags: [], createdAt: new Date() },
        ], total: 2, page: 1, pageSize: 25,
      });
      (mockPartnerRepository.findById as jest.Mock).mockImplementation(async (id: string) => {
        if (id === 'deleted-p') return { ...basePartner, id: 'deleted-p', deletedAt: new Date() };
        return { ...basePartner, id: 'active-p' };
      });

      const clients = await adapter.findAllClients('t1');
      expect(clients.every((c) => c.id !== 'deleted-p')).toBe(true);
    });
  });
});
