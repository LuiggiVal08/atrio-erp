import { PartnerToVendorMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-vendor.mapper';
import type { PartnerWithRelations } from '../../../src/core/business-partners/domain/partner.entity';

describe('PartnerToVendorMapper', () => {
  let mapper: PartnerToVendorMapper;
  const now = new Date('2026-01-01');

  const basePartner: PartnerWithRelations = {
    id: 'v1', tenantId: 't1', type: 'COMPANY', legalName: 'Supply Corp',
    taxId: { value: 'J-456', country: 'VE', type: 'J' },
    commercialName: null, website: null, status: 'ACTIVE',
    metadataSource: null, metadataNotes: null, externalId: 'DOC-002',
    createdById: 'sys', updatedById: 'sys',
    createdAt: now, updatedAt: now, deletedAt: null,
    roles: [{ role: 'SUPPLIER', assignedAt: now }],
    tags: [], contacts: [], addresses: [],
  };

  beforeEach(() => { mapper = new PartnerToVendorMapper(); });

  it('should map PartnerWithRelations to Vendor', () => {
    const vendor = mapper.toVendor(basePartner);
    expect(vendor.id).toBe('v1');
    expect(vendor.legalName).toBe('Supply Corp');
    expect(vendor.taxId).toBe('J-456');
    expect(vendor.isActive).toBe(true);
  });

  it('should populate contact fields from primary contact', () => {
    const p = {
      ...basePartner,
      contacts: [
        { id: 'c1', fullName: 'Jane', email: 'jane@s.com', phone: '555-1000', mobile: null, position: null, isPrimary: true, deletedAt: null },
      ],
    };
    const vendor = mapper.toVendor(p);
    expect(vendor.contactEmail).toBe('jane@s.com');
    expect(vendor.contactPhone).toBe('555-1000');
  });

  it('should prefer the Dueño contact for vendor email and phone', () => {
    const p = {
      ...basePartner,
      contacts: [
        { id: 'c1', fullName: 'Luis', position: 'Ventas', email: 'luis@s.com', phone: '111', mobile: null, isPrimary: true, deletedAt: null },
        { id: 'c2', fullName: 'Ana', position: 'Dueño', email: 'ana@s.com', phone: '222', mobile: null, identificationType: 'CI_VE', identificationNumber: 'V12345678', isPrimary: false, deletedAt: null },
      ],
    };
    const vendor = mapper.toVendor(p);
    expect(vendor.email).toBe('ana@s.com');
    expect(vendor.phone).toBe('222');
    expect(vendor.contactIdentificationType).toBe('CI_VE');
    expect(vendor.contactIdentificationNumber).toBe('V12345678');
    expect(vendor.contactEmail).toBe('luis@s.com');
    expect(vendor.contactPhone).toBe('111');
  });

  it('should populate vendor name fields from legacy CreateVendorData', () => {
    const vendor = mapper.toVendor(basePartner, {
      tenantId: 't1', documentId: 'D1', legalName: 'X', taxId: 'J-1',
      firstName: 'John', lastName: 'Doe',
      contactFirstName: 'Jane', contactEmail: 'jane@x.com',
    });
    expect(vendor.firstName).toBe('John');
    expect(vendor.lastName).toBe('Doe');
    expect(vendor.contactFirstName).toBe('Jane');
    expect(vendor.contactEmail).toBe('jane@x.com');
  });

  it('matchesActiveFilter should filter by partner status', () => {
    expect(mapper.matchesActiveFilter({ ...basePartner, status: 'ACTIVE' as const }, true)).toBe(true);
    expect(mapper.matchesActiveFilter({ ...basePartner, status: 'INACTIVE' as const }, true)).toBe(false);
  });

  describe('determineType', () => {
    it('should return COMPANY for corporate suffixes', () => {
      expect(mapper.determineType({ legalName: 'ACME, C.A.' })).toBe('COMPANY');
      expect(mapper.determineType({ legalName: 'Corp S.A.' })).toBe('COMPANY');
      expect(mapper.determineType({ legalName: 'XYZ Ltda.' })).toBe('COMPANY');
    });

    it('should return PERSON for names without corporate suffixes', () => {
      expect(mapper.determineType({ legalName: 'Juan Perez' })).toBe('PERSON');
      expect(mapper.determineType({ legalName: 'Maria' })).toBe('PERSON');
    });

    it('should return PERSON when firstName present without legalName', () => {
      expect(mapper.determineType({ legalName: '', firstName: 'John' })).toBe('PERSON');
    });
  });
});
