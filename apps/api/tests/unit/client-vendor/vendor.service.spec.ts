import { VendorService } from '../../../src/modules/client-vendor/application/vendor.service';
import { ClientVendorRepository } from '../../../src/modules/client-vendor/domain/client-vendor.repository.interface';

describe('VendorService', () => {
  let service: VendorService;
  const mockRepo: ClientVendorRepository = {
    createClient: jest.fn(),
    findAllClients: jest.fn(),
    findClientById: jest.fn(),
    updateClient: jest.fn(),
    softDeleteClient: jest.fn(),
    createVendor: jest.fn(),
    findAllVendors: jest.fn(),
    findVendorById: jest.fn(),
    updateVendor: jest.fn(),
    softDeleteVendor: jest.fn(),
  };

  beforeEach(() => {
    service = new VendorService(mockRepo);
    jest.clearAllMocks();
  });

  const valid = { tenantId: 't1', legalName: 'Vendor Corp', taxId: 'J-456' };

  it('should create a vendor', async () => {
    (mockRepo.createVendor as jest.Mock).mockResolvedValue({ id: 'v1', ...valid });
    const result = await service.create(valid);
    expect(result).toHaveProperty('id', 'v1');
  });

  it('should find all vendors', async () => {
    (mockRepo.findAllVendors as jest.Mock).mockResolvedValue([{ id: 'v1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });

  it('should find vendor by id', async () => {
    (mockRepo.findVendorById as jest.Mock).mockResolvedValue({ id: 'v1' });
    const result = await service.findById('v1');
    expect(result).toHaveProperty('id', 'v1');
  });

  it('should throw when vendor not found', async () => {
    (mockRepo.findVendorById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Vendor not found');
  });

  it('should soft delete vendor', async () => {
    (mockRepo.findVendorById as jest.Mock).mockResolvedValue({ id: 'v1' });
    await service.softDelete('v1');
    expect(mockRepo.softDeleteVendor).toHaveBeenCalledWith('v1');
  });
});
