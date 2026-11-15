import { PartnerCompatibilityAdapter } from '../../../src/modules/client-vendor/infrastructure/partner-compatibility.adapter';
import { PartnerToClientMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-client.mapper';
import { PartnerToVendorMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-vendor.mapper';
import { CompatibilityMetricsService } from '../../../src/modules/client-vendor/infrastructure/compatibility-metrics.service';
import type { PartnerService } from '../../../src/core/business-partners/application/partner.service';
import type { PartnerRepository } from '../../../src/core/business-partners/domain/partner.repository.interface';
import type { PartnerWithRelations } from '../../../src/core/business-partners/domain/partner.entity';
import { ValidationPipe } from '@nestjs/common';
import { CreateClientDto, CreateVendorDto, UpdateClientDto, UpdateVendorDto } from '../../../src/modules/client-vendor/infrastructure/dto/client-vendor.dto';

describe('PartnerCompatibilityAdapter', () => {
  let adapter: PartnerCompatibilityAdapter;
  let mockPrisma: any;
  let mockPartnerService: jest.Mocked<PartnerService>;
  let mockPartnerRepository: jest.Mocked<Pick<PartnerRepository, 'findById' | 'addContact' | 'updateContact' | 'addAddress' | 'updateAddress'>>;

  const basePartner = {
    id: 'p1',
    tenantId: 't1',
    type: 'COMPANY' as const,
    legalName: 'Test Corp',
    taxId: { value: 'J-123456', country: 'VE', type: 'J' },
    commercialName: null,
    website: null,
    status: 'ACTIVE' as const,
    metadataSource: null,
    metadataNotes: null,
    externalId: 'DOC-001',
    createdById: 'sys',
    updatedById: 'sys',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
    roles: [{ role: 'CUSTOMER' as const, assignedAt: new Date('2026-01-01') }],
    tags: [],
    contacts: [{ id: 'c1', fullName: 'John', email: 'john@test.com', phone: '555-0001', mobile: null, position: null, isPrimary: true, deletedAt: null }],
    addresses: [],
  } satisfies PartnerWithRelations;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue({ id: 'admin-1' }),
      },
      partnerMigrationMap: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
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
      updateContact: jest.fn().mockResolvedValue(undefined),
      addAddress: jest.fn().mockResolvedValue({ id: 'a1' }),
      updateAddress: jest.fn().mockResolvedValue(undefined),
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

  describe('createClient', () => {
    it('should create a Partner with CUSTOMER role and map to Client', async () => {
      (mockPartnerService.createPartner as jest.Mock).mockResolvedValue(basePartner);
      const result = await adapter.createClient({
        tenantId: 't1',
        documentId: 'DOC-001',
        legalName: 'Test Corp',
        taxId: 'J-123456',
      });

      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 't1',
          legalName: 'Test Corp',
          roles: ['CUSTOMER'],
          externalId: 'DOC-001',
          status: 'ACTIVE',
        }),
      );
      expect(result.id).toBe('p1');
      expect(result.legalName).toBe('Test Corp');
      expect(result.taxId).toBe('J-123456');
      expect(result.isActive).toBe(true);
    });
  });

  describe('write attribution', () => {
    it.each(['createClient', 'createVendor'] as const)('uses the authenticated actor for %s', async (method) => {
      mockPartnerService.createPartner.mockResolvedValue(basePartner);
      await adapter[method]({
        tenantId: 't1', documentId: 'DOC-001', legalName: 'Test Corp', taxId: 'J-123456',
        createdById: 'actor-1',
      });
      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(expect.objectContaining({
        createdById: 'actor-1', updatedById: 'actor-1',
      }));
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('attributes the vendor contact to the same actor', async () => {
      mockPartnerService.createPartner.mockResolvedValue(basePartner);
      await adapter.createVendor({
        tenantId: 't1', documentId: 'DOC-001', legalName: 'Test Corp', taxId: 'J-123456',
        createdById: 'actor-1', contactFirstName: 'Jane', contactEmail: 'jane@example.com',
      });
      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(expect.objectContaining({
        contacts: [expect.objectContaining({ createdById: 'actor-1', updatedById: 'actor-1' })],
      }));
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
    });

    it('uses an existing tenant user when no admin is available', async () => {
      mockPartnerService.createPartner.mockResolvedValue(basePartner);
      mockPrisma.user.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'tenant-user' });
      await adapter.createVendor({ tenantId: 't1', documentId: 'DOC-001', legalName: 'Test Corp', taxId: 'J-123456' });
      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(expect.objectContaining({
        createdById: 'tenant-user', updatedById: 'tenant-user',
      }));
      expect(mockPrisma.user.findFirst).toHaveBeenLastCalledWith({
        where: { tenantId: 't1', deletedAt: null }, orderBy: { createdAt: 'asc' },
      });
    });

    it('does not fabricate a user id when the tenant has no users', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      await expect(adapter.createVendor({
        tenantId: 't1', documentId: 'DOC-001', legalName: 'Test Corp', taxId: 'J-123456',
      })).rejects.toThrow('No user available');
      expect(mockPartnerService.createPartner).not.toHaveBeenCalled();
    });
  });

  describe('findAllClients', () => {
    it('should return clients from partners with CUSTOMER role', async () => {
      (mockPartnerService.findPartnersByRole as jest.Mock).mockResolvedValue({
        data: [{ id: 'p1', legalName: 'A Corp', status: 'ACTIVE', roles: ['CUSTOMER'] }],
        total: 1, page: 1, pageSize: 100,
      });
      const result = await adapter.findAllClients('t1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p1');
      expect(mockPartnerService.findPartnersByRole).toHaveBeenCalledWith('t1', 'CUSTOMER', { search: undefined, page: 1, pageSize: 100 });
    });

    it('should return empty array when no partners found', async () => {
      (mockPartnerService.findPartnersByRole as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 100 });
      const result = await adapter.findAllClients('t1');
      expect(result).toEqual([]);
    });
  });

  describe('findClientById', () => {
    it('should return client when partner exists', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const result = await adapter.findClientById('p1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
      expect(result!.legalName).toBe('Test Corp');
    });

    it('should return null when partner not found', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(null);
      const result = await adapter.findClientById('missing');
      expect(result).toBeNull();
    });
  });

  describe('softDeleteClient', () => {
    it('should soft delete partner', async () => {
      (mockPartnerService.resolvePartnerId as jest.Mock).mockResolvedValue('p1');
      await adapter.softDeleteClient('p1');
      expect(mockPartnerService.softDeletePartner).toHaveBeenCalledWith('p1', expect.any(String));
    });
  });

  describe('createVendor', () => {
    it('should create a Partner with SUPPLIER role and contact', async () => {
      (mockPartnerService.createPartner as jest.Mock).mockResolvedValue(basePartner);
      const result = await adapter.createVendor({
        tenantId: 't1',
        documentId: 'DOC-002',
        legalName: 'Vendor Corp',
        taxId: 'J-789',
        contactFirstName: 'Jane',
        contactEmail: 'jane@vendor.com',
        contactPhone: '555-0002',
      });

      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(
        expect.objectContaining({
          legalName: 'Vendor Corp',
          roles: ['SUPPLIER'],
          externalId: 'DOC-002',
        }),
      );
      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(expect.objectContaining({
        contacts: [expect.objectContaining({ fullName: 'Jane', email: 'jane@vendor.com', phone: '555-0002', createdById: 'admin-1', updatedById: 'admin-1' })],
      }));
      expect(mockPartnerRepository.addContact).not.toHaveBeenCalled();
      expect(result.legalName).toBe('Test Corp');
    });

    it('persists the owner as a Dueño contact and the fiscal address', async () => {
      (mockPartnerService.createPartner as jest.Mock).mockResolvedValue(basePartner);
      await adapter.createVendor({
        tenantId: 't1',
        documentId: 'DOC-003',
        legalName: 'Vendor Corp',
        taxId: 'J-789',
        firstName: 'Ana',
        lastName: 'Perez',
        email: 'ana@vendor.com',
        phone: '555-0003',
        contactIdentificationType: 'CI_VE',
        contactIdentificationNumber: 'V12345678',
        ownerIsPrimary: false,
        contacts: [{ fullName: 'Luis', position: 'Ventas', isPrimary: true }],
        address: { country: 'VE', state: 'Miranda', city: 'Caracas', addressLine: 'Av. Principal', reference: 'Torre A' },
      });

      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(expect.objectContaining({
        contacts: expect.arrayContaining([expect.objectContaining({
          position: 'Dueño', fullName: 'Ana Perez', email: 'ana@vendor.com', phone: '555-0003',
          identificationType: 'CI_VE', identificationNumber: 'V12345678', isPrimary: false,
        })]),
        addresses: [expect.objectContaining({
          type: 'FISCAL', line1: 'Av. Principal', line2: 'Torre A', city: 'Caracas',
          state: 'Miranda', country: 'VE', isPrimary: true,
        })],
      }));
      expect(mockPartnerRepository.addContact).not.toHaveBeenCalled();
      expect(mockPartnerRepository.addAddress).not.toHaveBeenCalled();
    });

    it('keeps the owner as the primary contact when requested', async () => {
      (mockPartnerService.createPartner as jest.Mock).mockResolvedValue(basePartner);
      await adapter.createVendor({
        tenantId: 't1',
        documentId: 'DOC-004',
        legalName: 'Vendor Corp',
        taxId: 'J-789',
        firstName: 'Ana',
        lastName: 'Perez',
        ownerIsPrimary: true,
        contacts: [{ fullName: 'Luis', position: 'Ventas', isPrimary: true }],
      });

      expect(mockPartnerService.createPartner).toHaveBeenCalledWith(expect.objectContaining({
        contacts: [
          expect.objectContaining({ position: 'Dueño', fullName: 'Ana Perez', isPrimary: true }),
          expect.objectContaining({ position: 'Ventas', fullName: 'Luis', isPrimary: false }),
        ],
      }));
    });
  });

  describe('findAllVendors', () => {
    it('should return vendors from partners with SUPPLIER role', async () => {
      (mockPartnerService.findPartnersByRole as jest.Mock).mockResolvedValue({
        data: [{ id: 'p2', legalName: 'B Vendor', status: 'ACTIVE', roles: ['SUPPLIER'] }],
        total: 1, page: 1, pageSize: 100,
      });
      const result = await adapter.findAllVendors('t1');
      expect(result).toHaveLength(1);
      expect(mockPartnerService.findPartnersByRole).toHaveBeenCalledWith('t1', 'SUPPLIER', { search: undefined, page: 1, pageSize: 100 });
    });
  });

  describe('findVendorById', () => {
    it('should return vendor when partner exists', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const result = await adapter.findVendorById('p1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
    });
  });

  describe('softDeleteVendor', () => {
    it('should soft delete partner', async () => {
      await adapter.softDeleteVendor('p1');
      expect(mockPartnerService.softDeletePartner).toHaveBeenCalledWith('p1', expect.any(String));
    });
  });

  describe('mapping to Client entity', () => {
    it('should map all relevant fields', async () => {
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(basePartner);
      const result = await adapter.findClientById('p1');
      expect(result).toMatchObject({
        id: 'p1',
        tenantId: 't1',
        documentId: 'DOC-001',
        legalName: 'Test Corp',
        taxId: 'J-123456',
        email: 'john@test.com',
        phone: '555-0001',
        isActive: true,
      });
    });

    it('should handle partner without contacts', async () => {
      const noContact = { ...basePartner, contacts: [] };
      (mockPartnerService.findPartnerById as jest.Mock).mockResolvedValue(noContact);
      const result = await adapter.findClientById('p1');
      expect(result!.email).toBeNull();
      expect(result!.phone).toBeNull();
    });
  });
});

describe('Client and vendor optional-field validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const required = { documentId: 'J123456789', legalName: 'Test Corp', taxId: 'J123456789' };

  it.each([CreateClientDto, CreateVendorDto])('accepts empty optional fields in %p', async (metatype) => {
    const dto = await pipe.transform({
      ...required, identificationType: ' ', email: '', contactIdentificationType: '', contactEmail: '',
    }, { type: 'body', metatype });
    expect(dto.identificationType).toBeUndefined();
    expect(dto.email).toBeUndefined();
    expect(dto.contactIdentificationType).toBeUndefined();
    expect(dto.contactEmail).toBeUndefined();
  });

  it.each([CreateClientDto, CreateVendorDto, UpdateClientDto, UpdateVendorDto])('rejects an invalid nonempty type in %p', async (metatype) => {
    await expect(pipe.transform({ ...required, identificationType: 'INVALID' }, { type: 'body', metatype }))
      .rejects.toThrow('Bad Request');
  });

  it('still rejects an invalid contact email', async () => {
    await expect(pipe.transform({ ...required, contactEmail: 'invalid' }, { type: 'body', metatype: CreateVendorDto }))
      .rejects.toThrow('Bad Request');
  });

  it('does not allow the request to supply an audit actor', async () => {
    const dto = await pipe.transform({ ...required, createdById: 'forged-actor' }, { type: 'body', metatype: CreateVendorDto });
    expect(dto.createdById).toBeUndefined();
  });
});
