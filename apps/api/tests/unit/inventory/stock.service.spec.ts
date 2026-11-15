import { StockService } from '../../../src/modules/inventory/application/stock.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('StockService', () => {
  let service: StockService;
  const mockRepo: InventoryRepository = {
    createCategory: jest.fn(),
    findAllCategories: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    createProduct: jest.fn(),
    findAllProducts: jest.fn(),
    findProductById: jest.fn(),
    generateProductBarcode: jest.fn(),
    updateProduct: jest.fn(),
    softDeleteProduct: jest.fn(),
    createWarehouse: jest.fn(),
    findAllWarehouses: jest.fn(),
    updateWarehouse: jest.fn(),
    softDeleteWarehouse: jest.fn(),
    findWarehouseById: jest.fn(),
    setDefaultWarehouse: jest.fn(),
    getDefaultWarehouse: jest.fn(),
    getWarehouseSummary: jest.fn(),
    createStorageLocation: jest.fn(),
    findStorageLocationById: jest.fn(),
    findStorageLocationByPath: jest.fn(),
    findStorageLocationsByWarehouse: jest.fn(),
    findStorageLocationSiblings: jest.fn(),
    findStorageLocationChildren: jest.fn(),
    updateStorageLocation: jest.fn(),
    softDeleteStorageLocation: jest.fn(),
    createBranch: jest.fn(),
    findAllBranches: jest.fn(),
    updateBranch: jest.fn(),
    softDeleteBranch: jest.fn(),
    findBranchById: jest.fn(),
    countActiveWarehousesByBranch: jest.fn(),
    employeeBelongsToTenant: jest.fn(),
    getStock: jest.fn(),
    adjustStockAtomic: jest.fn(),
    generateStorageLocations: jest.fn(),
    rewriteStorageLocation: jest.fn(),
    findReorderPointById: jest.fn(),
    findMovements: jest.fn(),
    findAllMovements: jest.fn(),
    findStockBalances: jest.fn(),
    createTransfer: jest.fn(),
    findTransfersByTenant: jest.fn(),
    findTransferById: jest.fn(),
    completeTransfer: jest.fn(),
    cancelTransfer: jest.fn(),
    setReorderPoint: jest.fn(),
    findReorderPointsByTenant: jest.fn(),
    findReorderPoint: jest.fn(),
    updateReorderPoint: jest.fn(),
    deleteReorderPoint: jest.fn(),
    countProductsByCategory: jest.fn(),
    countChildCategories: jest.fn(),
    findLowStock: jest.fn(),
  };

  beforeEach(() => {
    service = new StockService(mockRepo);
    jest.resetAllMocks();
    (mockRepo.findProductById as jest.Mock).mockResolvedValue({ tenantId: 'tenant-1' });
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue({ tenantId: 'tenant-1' });
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite quantity %s before any mutation', async (quantity) => {
    await expect(service.adjust({ tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity })).rejects.toThrow('Quantity must be positive');
    expect(mockRepo.adjustStockAtomic).not.toHaveBeenCalled();
  });

  it('requires effective tenant before adjustment', async () => {
    await expect(service.adjust({ productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity: 1 } as any)).rejects.toThrow('Tenant context is required');
    expect(mockRepo.adjustStockAtomic).not.toHaveBeenCalled();
  });

  it('rejects invalid movement type before mutation', async () => {
    await expect(service.adjust({ tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'invalid', quantity: 1 } as any)).rejects.toThrow('Invalid adjustment type');
  });

  it('rejects invalid expiration date before mutation', async () => {
    await expect(service.adjust({ tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity: 1, expirationDate: 'not-a-date' })).rejects.toThrow('Invalid expiration date');
  });

  it('preserves the paginated history contract and propagates repository errors', async () => {
    const result = { items: [{ id: 'm1' }], total: 650, page: 21, pageSize: 25 };
    (mockRepo.findAllMovements as jest.Mock).mockResolvedValue(result);
    await expect(service.getAllMovements('tenant-1', { page: 21 })).resolves.toBe(result);
    expect(mockRepo.findAllMovements).toHaveBeenCalledWith('tenant-1', { page: 21 });
    (mockRepo.findAllMovements as jest.Mock).mockRejectedValue(new Error('read failed'));
    await expect(service.getAllMovements('tenant-1')).rejects.toThrow('read failed');
  });

  it('never converts a failed balance read into an empty successful result', async () => {
    (mockRepo.findStockBalances as jest.Mock).mockRejectedValue(new Error('read failed'));
    await expect(service.getBalances('tenant-1')).rejects.toThrow('read failed');
    expect(mockRepo.findStockBalances).toHaveBeenCalledWith('tenant-1');
  });

  it('should return stock balance', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 10 });
    const result = await service.getBalance('tenant-1', 'prod-1', 'wh-1');
    expect(result.quantity).toBe(10);
  });

  it('should return zero when no stock record', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue(null);
    const result = await service.getBalance('tenant-1', 'prod-1', 'wh-1');
    expect(result.quantity).toBe(0);
  });

  it('adjusts stock through the atomic repository operation', async () => {
    (mockRepo.adjustStockAtomic as jest.Mock).mockResolvedValue({ quantity: 10 });
    const result = await service.adjust({ tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity: 5 });
    expect(result).toHaveProperty('quantity', 10);
  });

  it('propagates insufficient stock without a separate read/write race', async () => {
    (mockRepo.adjustStockAtomic as jest.Mock).mockRejectedValue(new Error('Insufficient stock'));
    await expect(service.adjust({ tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'out', quantity: 5 })).rejects.toThrow('Insufficient stock');
    expect(mockRepo.getStock).not.toHaveBeenCalled();
  });

  it.each([0, -1])('rejects nonpositive quantity %s', async (quantity) => {
    await expect(service.adjust({ tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity })).rejects.toThrow('Quantity must be positive');
  });

  it('passes actor and stable operation ID to the atomic movement', async () => {
    const data = { tenantId: 'tenant-1', productId: 'prod-1', warehouseId: 'wh-1', type: 'in' as const, quantity: 0.25, userId: 'user-1', operationId: 'op-1' };
    await service.adjust(data);
    expect(mockRepo.adjustStockAtomic).toHaveBeenCalledWith(data);
  });
});
