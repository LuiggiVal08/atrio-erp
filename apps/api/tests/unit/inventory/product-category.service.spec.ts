import { ProductCategoryService } from '../../../src/modules/inventory/application/product-category.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('ProductCategoryService', () => {
  let service: ProductCategoryService;
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
    service = new ProductCategoryService(mockRepo);
    jest.resetAllMocks();
    (mockRepo.findAllCategories as jest.Mock).mockResolvedValue([{ id: 'cat-1' }]);
  });

  it('should create a category', async () => {
    (mockRepo.createCategory as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'Beverages' });
    const result = await service.create({ tenantId: 'tenant-1', name: 'Beverages' });
    expect(result).toHaveProperty('id', 'cat-1');
  });

  it('should find all categories for tenant', async () => {
    (mockRepo.findAllCategories as jest.Mock).mockResolvedValue([{ id: 'cat-1' }, { id: 'cat-2' }]);
    const result = await service.findAll('tenant-1');
    expect(result).toHaveLength(2);
  });

  it('should update a category', async () => {
    (mockRepo.updateCategory as jest.Mock).mockResolvedValue({ id: 'cat-1', name: 'Updated' });
    const result = await service.update('tenant-1', 'cat-1', { name: 'Updated' });
    expect(result).toHaveProperty('name', 'Updated');
  });

  it('should delete a category', async () => {
    (mockRepo.countProductsByCategory as jest.Mock).mockResolvedValue(0);
    (mockRepo.countChildCategories as jest.Mock).mockResolvedValue(0);
    await service.delete('tenant-1', 'cat-1');
    expect(mockRepo.deleteCategory).toHaveBeenCalledWith('cat-1', 'tenant-1');
  });

  it('should reject delete when products are associated', async () => {
    (mockRepo.countProductsByCategory as jest.Mock).mockResolvedValue(3);
    await expect(service.delete('tenant-1', 'cat-1')).rejects.toThrow('producto(s) están asociados');
    expect(mockRepo.deleteCategory).not.toHaveBeenCalled();
  });

  it('should reject delete when child categories exist', async () => {
    (mockRepo.countProductsByCategory as jest.Mock).mockResolvedValue(0);
    (mockRepo.countChildCategories as jest.Mock).mockResolvedValue(2);
    await expect(service.delete('tenant-1', 'cat-1')).rejects.toThrow('subcategoría(s)');
    expect(mockRepo.deleteCategory).not.toHaveBeenCalled();
  });
});
