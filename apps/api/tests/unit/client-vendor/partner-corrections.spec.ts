import { PartnerCompatibilityAdapter } from '../../../src/modules/client-vendor/infrastructure/partner-compatibility.adapter';
import { PartnerToClientMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-client.mapper';
import { PartnerToVendorMapper } from '../../../src/modules/client-vendor/infrastructure/partner-to-vendor.mapper';
import { PartnerService } from '../../../src/core/business-partners/application/partner.service';
import { PartnerController } from '../../../src/core/business-partners/infrastructure/partner.controller';
import { ClientService } from '../../../src/modules/client-vendor/application/client.service';
import { VendorService } from '../../../src/modules/client-vendor/application/vendor.service';
import { ClientVendorController } from '../../../src/modules/client-vendor/infrastructure/client-vendor.controller';
import { PrismaPartnerRepository } from '../../../src/core/business-partners/infrastructure/prisma-partner.repository';

const partner = {
  id: 'p1', tenantId: 't1', legalName: 'Supplier', type: 'COMPANY', status: 'ACTIVE',
  taxId: { value: 'J123', country: 'VE', type: 'RIF_VE' },
  roles: [{ role: 'SUPPLIER' }, { role: 'CUSTOMER' }], tags: [], addresses: [],
  contacts: [{ id: 'c1', fullName: 'Ana', position: 'Dueño', email: 'ana@example.com', phone: '123', mobile: '456', identificationNumber: 'V123', isPrimary: true }],
};

function setup() {
  const repo: any = {
    findById: jest.fn().mockResolvedValue(partner), update: jest.fn().mockResolvedValue(partner),
    addContact: jest.fn(), updateContact: jest.fn(), softDeleteContact: jest.fn(),
    addAddress: jest.fn(), updateAddress: jest.fn(), softDeleteAddress: jest.fn(), addEvent: jest.fn(),
    findMany: jest.fn().mockResolvedValue({ data: [{ id: 'p1' }], total: 145, page: 5, pageSize: 25 }),
    withTransaction: jest.fn(async (work) => work(repo)),
  };
  const service: any = {
    resolvePartnerId: jest.fn().mockResolvedValue('p1'), findPartnerById: repo.findById,
    createPartner: jest.fn().mockResolvedValue(partner), updatePartner: repo.update,
  };
  const prisma: any = { contact: { updateMany: jest.fn() } };
  const adapter = new PartnerCompatibilityAdapter(prisma, service, repo, new PartnerToClientMapper(), new PartnerToVendorMapper(), { trackVendorWrite: jest.fn(), trackClientWrite: jest.fn() } as any);
  return { adapter, repo, service, prisma };
}

describe('Partner corrections', () => {
  it('preserves omitted contact metadata and primary status', async () => {
    const { adapter, repo } = setup();
    await adapter.updateVendor('p1', { tenantId: 't1', updatedById: 'actor', contacts: [{ id: 'c1', fullName: 'Ana Maria' }] });
    const patch = repo.updateContact.mock.calls[0][1];
    expect(patch.mobile).toBeUndefined();
    expect(patch.identificationNumber).toBeUndefined();
    expect(patch.email).toBeUndefined();
    expect(patch.isPrimary).toBe(true);
    expect(repo.withTransaction).toHaveBeenCalled();
  });

  it('clears explicitly null contacts and persists general email even with a desired contact set', async () => {
    const { adapter, repo } = setup();
    await adapter.updateVendor('p1', { tenantId: 't1', updatedById: 'actor', email: null, phone: '789', contacts: [{ id: 'c1', fullName: 'Ana', mobile: null }] } as any);
    expect(repo.updateContact).toHaveBeenCalledWith('c1', expect.objectContaining({ email: null, phone: '789', mobile: null }));
  });

  it('does not delete contacts for an omitted collection or accept another partner contact id', async () => {
    const { adapter, repo } = setup();
    await adapter.updateVendor('p1', { tenantId: 't1', updatedById: 'actor', legalName: 'Renamed' });
    expect(repo.softDeleteContact).not.toHaveBeenCalled();
    await expect(adapter.updateVendor('p1', { tenantId: 't1', updatedById: 'actor', contacts: [{ id: 'foreign', fullName: 'X' }] })).rejects.toThrow();
  });

  it('persists captured client names, contact and address in the same create', async () => {
    const { adapter, service } = setup();
    await adapter.createClient({ tenantId: 't1', createdById: 'actor', legalName: 'Ana Perez', firstName: 'Ana', lastName: 'Perez', documentId: 'V123', taxId: 'V123', email: 'ana@example.com', address: { country: 'VE', state: 'Miranda', city: 'Caracas', addressLine: 'Avenida' } } as any);
    expect(service.createPartner).toHaveBeenCalledWith(expect.objectContaining({
      contacts: [expect.objectContaining({ fullName: 'Ana Perez', email: 'ana@example.com', isPrimary: true })],
      addresses: [expect.objectContaining({ line1: 'Avenida' })],
      clientIdentity: expect.objectContaining({ firstName: 'Ana', lastName: 'Perez' }),
    }));
  });

  it('returns server pagination and total rather than a first-100 subset', async () => {
    const { repo } = setup();
    const service = new PartnerService({} as any, repo);
    expect(await service.findPartnersByRole('t1', 'SUPPLIER', { search: 'Ana', page: 5, pageSize: 25 })).toMatchObject({ total: 145, page: 5 });
    expect(repo.findMany).toHaveBeenCalledWith(expect.objectContaining({ tenantId: 't1', page: 5, pageSize: 25, search: 'Ana' }));
  });

  it('rejects effective tenant URL mismatches and foreign individual partners/children', async () => {
    const { repo } = setup();
    const controller = new PartnerController(new PartnerService({} as any, repo), repo);
    await expect(controller.findOne('p1', 't2', { effectiveTenantId: 't1' })).rejects.toThrow();
    await expect(controller.findOne('p1', 't2', { effectiveTenantId: 't2' })).rejects.toThrow('Partner not found');
    await expect(controller.updateContact('p1', 'foreign', { fullName: 'X' }, { effectiveTenantId: 't1', id: 'actor' }, 't1')).rejects.toThrow();
    expect(repo.updateContact).not.toHaveBeenCalled();
  });

  it('rejects foreign legacy reads, updates and deletes before mutation', async () => {
    const repo: any = { findClientById: jest.fn().mockResolvedValue({ tenantId: 't2' }), findVendorById: jest.fn().mockResolvedValue({ tenantId: 't2' }), updateClient: jest.fn(), softDeleteVendor: jest.fn() };
    const controller = new ClientVendorController(new ClientService(repo), new VendorService(repo), {} as any, {} as any);
    const user = { effectiveTenantId: 't1', id: 'actor' };
    await expect(controller.getClient('id', user)).rejects.toThrow();
    await expect(controller.updateClient('id', { legalName: 'X' }, user)).rejects.toThrow();
    await expect(controller.deleteVendor('id', user)).rejects.toThrow();
    expect(repo.updateClient).not.toHaveBeenCalled();
    expect(repo.softDeleteVendor).not.toHaveBeenCalled();
  });

  it('uses nested writes for client identity, contacts and addresses', async () => {
    const prisma: any = { partner: { create: jest.fn().mockResolvedValue(partner) } };
    await new PrismaPartnerRepository(prisma).create({ tenantId: 't1', type: 'PERSON', legalName: 'Ana', createdById: 'actor', updatedById: 'actor', contacts: [{ fullName: 'Ana', email: 'ana@example.com', createdById: 'actor', updatedById: 'actor' }], addresses: [{ type: 'FISCAL', line1: 'Av', city: 'Caracas', state: 'Miranda', country: 'VE', createdById: 'actor', updatedById: 'actor' }], clientIdentity: { firstName: 'Ana' } } as any);
    const data = prisma.partner.create.mock.calls[0][0].data;
    expect(data.contacts.create).toHaveLength(1);
    expect(data.addresses.create).toHaveLength(1);
    expect(data.events.create.payload).toEqual({ firstName: 'Ana' });
    expect(data.clientIdentity).toBeUndefined();
  });
});
