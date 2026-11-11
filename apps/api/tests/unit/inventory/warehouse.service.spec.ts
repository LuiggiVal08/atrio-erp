import { WarehouseService } from '../../../src/modules/inventory/application/warehouse.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('WarehouseService', () => {
  let service: WarehouseService;
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
    createBranch: jest.fn(),
    findAllBranches: jest.fn(),
    updateBranch: jest.fn(),
    softDeleteBranch: jest.fn(),
    getStock: jest.fn(),
    adjustStock: jest.fn(),
    createMovement: jest.fn(),
    findMovements: jest.fn(),
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
    service = new WarehouseService(mockRepo);
    jest.clearAllMocks();
  });

  it('should create a warehouse', async () => {
    (mockRepo.createWarehouse as jest.Mock).mockResolvedValue({ id: 'wh-1', name: 'Main Warehouse' });
    const result = await service.create({ tenantId: 'tenant-1', name: 'Main Warehouse' });
    expect(result).toHaveProperty('id', 'wh-1');
  });

  it('should list active warehouses', async () => {
    (mockRepo.findAllWarehouses as jest.Mock).mockResolvedValue([{ id: 'wh-1' }]);
    const result = await service.findAll('tenant-1');
    expect(result).toHaveLength(1);
  });

  it('should soft delete a warehouse', async () => {
    await service.softDelete('wh-1');
    expect(mockRepo.softDeleteWarehouse).toHaveBeenCalledWith('wh-1');
  });
});
