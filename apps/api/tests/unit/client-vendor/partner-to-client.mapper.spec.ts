import { PartnerToClientMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-client.mapper';
import type { PartnerWithRelations } from '../../../src/core/business-partners/domain/partner.entity';

describe('PartnerToClientMapper', () => {
  let mapper: PartnerToClientMapper;
  const now = new Date('2026-01-01');

  const basePartner: PartnerWithRelations = {
    id: 'p1', tenantId: 't1', type: 'COMPANY', legalName: 'Test Corp',
    taxId: { value: 'J-123', country: 'VE', type: 'J' },
    commercialName: null, website: null, status: 'ACTIVE',
    metadataSource: null, metadataNotes: null, externalId: 'DOC-001',
    createdById: 'sys', updatedById: 'sys',
    createdAt: now, updatedAt: now, deletedAt: null,
    roles: [{ role: 'CUSTOMER', assignedAt: now }],
    tags: [], contacts: [], addresses: [],
  };

  beforeEach(() => { mapper = new PartnerToClientMapper(); });

  it('should map PartnerWithRelations to Client', () => {
    const client = mapper.toClient(basePartner);
    expect(client.id).toBe('p1');
    expect(client.legalName).toBe('Test Corp');
    expect(client.taxId).toBe('J-123');
    expect(client.isActive).toBe(true);
    expect(client.documentId).toBe('DOC-001');
  });

  it('should flatten taxId value into Client.taxId', () => {
    const client = mapper.toClient(basePartner);
    expect(typeof client.taxId).toBe('string');
    expect(client.taxId).toBe('J-123');
  });

  it('should map status ACTIVE → isActive true', () => {
    expect(mapper.toClient(basePartner).isActive).toBe(true);
  });

  it('should map status INACTIVE → isActive false', () => {
    const p = { ...basePartner, status: 'INACTIVE' as const };
    expect(mapper.toClient(p).isActive).toBe(false);
  });

  it('should use primary contact email/phone', () => {
    const p = {
      ...basePartner,
      contacts: [
        { id: 'c1', fullName: 'Non Primary', email: 'secondary@t.com', phone: '555-0002', mobile: null, position: null, isPrimary: false, deletedAt: null },
        { id: 'c2', fullName: 'Primary', email: 'primary@t.com', phone: '555-0001', mobile: null, position: null, isPrimary: true, deletedAt: null },
      ],
    };
    const client = mapper.toClient(p);
    expect(client.email).toBe('primary@t.com');
    expect(client.phone).toBe('555-0001');
  });

  it('should fall back to first contact when no primary', () => {
    const p = {
      ...basePartner,
      contacts: [
        { id: 'c1', fullName: 'First', email: 'first@t.com', phone: '555-0010', mobile: null, position: null, isPrimary: false, deletedAt: null },
      ],
    };
    const client = mapper.toClient(p);
    expect(client.email).toBe('first@t.com');
    expect(client.phone).toBe('555-0010');
  });

  it('should use externalId as documentId, falling back to partner.id', () => {
    const p = { ...basePartner, externalId: null };
    expect(mapper.toClient(p).documentId).toBe('p1');
  });

  it('matchesActiveFilter should filter correctly', () => {
    const active = { ...basePartner, status: 'ACTIVE' as const };
    const inactive = { ...basePartner, status: 'INACTIVE' as const };
    expect(mapper.matchesActiveFilter(active, true)).toBe(true);
    expect(mapper.matchesActiveFilter(active, false)).toBe(false);
    expect(mapper.matchesActiveFilter(inactive, true)).toBe(false);
    expect(mapper.matchesActiveFilter(inactive, false)).toBe(true);
    expect(mapper.matchesActiveFilter(active, undefined)).toBe(true);
  });
});
