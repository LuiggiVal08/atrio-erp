import { GetTenantUseCase } from '../../src/modules/tenant/application/get-tenant.use-case';
import { TenantRepository } from '../../src/modules/tenant/domain/tenant.repository.interface';

describe('GetTenantUseCase', () => {
  let getTenantUseCase: GetTenantUseCase;

  const mockTenantRepo: TenantRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    getTenantUseCase = new GetTenantUseCase(mockTenantRepo);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getTenantUseCase).toBeDefined();
  });

  describe('findById', () => {
    it('should return tenant by id', async () => {
      const mockTenant = { id: 'tenant-1', legalName: 'Acme Corp' };
      (mockTenantRepo.findById as jest.Mock).mockResolvedValue(mockTenant);

      const result = await getTenantUseCase.findById('tenant-1');
      expect(result).toEqual(mockTenant);
    });

    it('should return null if not found', async () => {
      (mockTenantRepo.findById as jest.Mock).mockResolvedValue(null);
      const result = await getTenantUseCase.findById('missing');
      expect(result).toBeNull();
    });
  });
});
