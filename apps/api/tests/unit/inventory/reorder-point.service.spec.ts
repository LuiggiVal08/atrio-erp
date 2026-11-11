import { ReorderPointService } from '../../../src/modules/inventory/application/reorder-point.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('ReorderPointService', () => {
  let service: ReorderPointService;
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
    service = new ReorderPointService(mockRepo);
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should set a reorder point', async () => {
      (mockRepo.setReorderPoint as jest.Mock).mockResolvedValue({
        id: 'rp-1', productId: 'prod-1', warehouseId: 'wh-1', minQuantity: 5, maxQuantity: 20, isActive: true,
      });
      const dto = { tenantId: 't1', productId: 'prod-1', warehouseId: 'wh-1', minQuantity: 5, maxQuantity: 20 };
      const result = await service.set(dto);
      expect(result).toHaveProperty('minQuantity', 5);
      expect(mockRepo.setReorderPoint).toHaveBeenCalledWith(dto);
    });

    it('should reject when max <= min', async () => {
      await expect(service.set({
        tenantId: 't1', productId: 'prod-1', warehouseId: 'wh-1',
        minQuantity: 20, maxQuantity: 5,
      })).rejects.toThrow('Maximum quantity must be greater than minimum');
    });

    it('should reject negative min', async () => {
      await expect(service.set({
        tenantId: 't1', productId: 'prod-1', warehouseId: 'wh-1',
        minQuantity: -1, maxQuantity: 5,
      })).rejects.toThrow('Minimum quantity must be >= 0');
    });
  });

  describe('findAll', () => {
    it('should return all reorder points for tenant', async () => {
      (mockRepo.findReorderPointsByTenant as jest.Mock).mockResolvedValue([{ id: 'rp-1' }]);
      const result = await service.findAll('t1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return reorder point for product+warehouse', async () => {
      (mockRepo.findReorderPoint as jest.Mock).mockResolvedValue({ id: 'rp-1', minQuantity: 5 });
      const result = await service.findOne('prod-1', 'wh-1');
      expect(result).toHaveProperty('minQuantity', 5);
    });

    it('should throw when not found', async () => {
      (mockRepo.findReorderPoint as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne('prod-1', 'wh-2')).rejects.toThrow('Reorder point not found');
    });
  });

  describe('update', () => {
    it('should update a reorder point', async () => {
      (mockRepo.updateReorderPoint as jest.Mock).mockResolvedValue({ id: 'rp-1', minQuantity: 10, maxQuantity: 30 });
      const result = await service.update('rp-1', { minQuantity: 10, maxQuantity: 30 });
      expect(result).toHaveProperty('minQuantity', 10);
    });
  });

  describe('delete', () => {
    it('should delete a reorder point', async () => {
      (mockRepo.deleteReorderPoint as jest.Mock).mockResolvedValue(undefined);
      await service.delete('rp-1');
      expect(mockRepo.deleteReorderPoint).toHaveBeenCalledWith('rp-1');
    });
  });

  describe('findLowStock', () => {
    it('should return items below reorder point', async () => {
      (mockRepo.findLowStock as jest.Mock).mockResolvedValue([
        { productId: 'prod-1', warehouseId: 'wh-1', currentQuantity: 3, minQuantity: 5 },
      ]);
      const result = await service.findLowStock('t1');
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('currentQuantity', 3);
    });
  });
});
