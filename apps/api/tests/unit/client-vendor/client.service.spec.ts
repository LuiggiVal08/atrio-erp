import { ClientService } from '../../../src/modules/client-vendor/application/client.service';
import { ClientVendorRepository } from '../../../src/modules/client-vendor/domain/client-vendor.repository.interface';

describe('ClientService', () => {
  let service: ClientService;
  const mockRepo: ClientVendorRepository = {
    createClient: jest.fn(),
    findAllClients: jest.fn(),
    findClientById: jest.fn(),
    updateClient: jest.fn(),
    softDeleteClient: jest.fn(),
    createVendor: jest.fn(),
    findAllVendors: jest.fn(),
    findVendorsByCategory: jest.fn(),
    findVendorById: jest.fn(),
    updateVendor: jest.fn(),
    softDeleteVendor: jest.fn(),
  };

  beforeEach(() => {
    service = new ClientService(mockRepo);
    jest.clearAllMocks();
  });

  const valid = { tenantId: 't1', documentId: 'J-123', legalName: 'Client Corp', taxId: 'J-123' };

  it('should create a client', async () => {
    (mockRepo.createClient as jest.Mock).mockResolvedValue({ id: 'c1', ...valid });
    const result = await service.create(valid);
    expect(result).toHaveProperty('id', 'c1');
  });

  it('should find all clients', async () => {
    (mockRepo.findAllClients as jest.Mock).mockResolvedValue([{ id: 'c1' }]);
    const result = await service.findAll('t1');
    expect(result).toHaveLength(1);
  });

  it('should find client by id', async () => {
    (mockRepo.findClientById as jest.Mock).mockResolvedValue({ id: 'c1' });
    const result = await service.findById('c1');
    expect(result).toHaveProperty('id', 'c1');
  });

  it('should throw when client not found', async () => {
    (mockRepo.findClientById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Client not found');
  });

  it('should soft delete client', async () => {
    (mockRepo.findClientById as jest.Mock).mockResolvedValue({ id: 'c1' });
    await service.softDelete('c1', 'user-1');
    expect(mockRepo.softDeleteClient).toHaveBeenCalledWith('c1', 'user-1');
  });
});
