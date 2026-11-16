import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WarehouseService } from '../../../src/modules/inventory/application/warehouse.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

const baseWarehouse = {
  id: 'wh-1',
  tenantId: 'tenant-1',
  name: 'Main Warehouse',
  branchId: null,
  code: null,
  isActive: true,
  createdAt: new Date(),
};

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
    dispatchTransfer: jest.fn(),
    receiveTransfer: jest.fn(),
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

  it('should list active warehouses by default', async () => {
    (mockRepo.findAllWarehouses as jest.Mock).mockResolvedValue([{ id: 'wh-1' }]);
    const result = await service.findAll('tenant-1');
    expect(result).toHaveLength(1);
    expect(mockRepo.findAllWarehouses).toHaveBeenCalledWith('tenant-1', false);
  });

  it('should include inactive warehouses when requested', async () => {
    (mockRepo.findAllWarehouses as jest.Mock).mockResolvedValue([{ id: 'wh-1' }, { id: 'wh-2' }]);
    await service.findAll('tenant-1', true);
    expect(mockRepo.findAllWarehouses).toHaveBeenCalledWith('tenant-1', true);
  });

  it('should return a warehouse belonging to the tenant', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue(baseWarehouse);
    const result = await service.findById('tenant-1', 'wh-1');
    expect(result.id).toBe('wh-1');
  });

  it('should reject a warehouse from another tenant', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue({ ...baseWarehouse, tenantId: 'tenant-2' });
    await expect(service.findById('tenant-1', 'wh-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should soft delete a warehouse scoped to the tenant', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue(baseWarehouse);
    await service.softDelete('tenant-1', 'wh-1');
    expect(mockRepo.softDeleteWarehouse).toHaveBeenCalledWith('wh-1');
  });

  it('should set an active warehouse as default', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue(baseWarehouse);
    await service.setDefault('tenant-1', 'wh-1');
    expect(mockRepo.setDefaultWarehouse).toHaveBeenCalledWith('tenant-1', 'wh-1');
  });

  it('should reject an inactive warehouse as default', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue({ ...baseWarehouse, isActive: false });
    await expect(service.setDefault('tenant-1', 'wh-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should return the warehouse summary', async () => {
    (mockRepo.findWarehouseById as jest.Mock).mockResolvedValue(baseWarehouse);
    const summary = { warehouseId: 'wh-1', skuCount: 0, totalUnits: 0, totalValue: 0, currency: 'VED', health: { healthy: 0, low: 0, out: 0, overstock: 0 }, categories: [] };
    (mockRepo.getWarehouseSummary as jest.Mock).mockResolvedValue(summary);
    const result = await service.getSummary('tenant-1', 'wh-1');
    expect(result).toEqual(summary);
  });
});
