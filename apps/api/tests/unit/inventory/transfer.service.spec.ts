import { TransferService } from '../../../src/modules/inventory/application/transfer.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('TransferService', () => {
  let service: TransferService;
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
    service = new TransferService(mockRepo);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a transfer when stock is sufficient', async () => {
      (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 20 });
      (mockRepo.createTransfer as jest.Mock).mockResolvedValue({
        id: 'tr-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2',
        productId: 'prod-1', quantity: 10, status: 'pending',
      });
      const dto = { tenantId: 't1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 10 };
      const result = await service.create(dto);
      expect(result).toHaveProperty('status', 'pending');
      expect(mockRepo.createTransfer).toHaveBeenCalledWith(dto);
    });

    it('should reject transfer to same warehouse', async () => {
      await expect(service.create({
        tenantId: 't1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-1',
        productId: 'prod-1', quantity: 10,
      })).rejects.toThrow('Source and destination warehouses must be different');
    });

    it('should reject zero quantity', async () => {
      await expect(service.create({
        tenantId: 't1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2',
        productId: 'prod-1', quantity: 0,
      })).rejects.toThrow('Quantity must be positive');
    });

    it('should reject when insufficient stock', async () => {
      (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 3 });
      await expect(service.create({
        tenantId: 't1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2',
        productId: 'prod-1', quantity: 10,
      })).rejects.toThrow('Insufficient stock in source warehouse');
    });
  });

  describe('findAll', () => {
    it('should return all transfers for tenant', async () => {
      (mockRepo.findTransfersByTenant as jest.Mock).mockResolvedValue([{ id: 'tr-1' }]);
      const result = await service.findAll('t1');
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    it('should return transfer by id', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue({ id: 'tr-1' });
      const result = await service.findById('tr-1');
      expect(result).toHaveProperty('id', 'tr-1');
    });

    it('should throw when not found', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow('Transfer not found');
    });
  });

  describe('complete', () => {
    it('should complete a pending transfer and move stock', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue({
        id: 'tr-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2',
        productId: 'prod-1', quantity: 10, status: 'pending',
      });
      (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 20 });
      (mockRepo.completeTransfer as jest.Mock).mockResolvedValue({ id: 'tr-1', status: 'completed' });

      const result = await service.complete('tr-1');
      expect(result).toHaveProperty('status', 'completed');
      expect(mockRepo.completeTransfer).toHaveBeenCalledWith('tr-1');
    });

    it('should reject completion when source stock is insufficient', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue({
        id: 'tr-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2',
        productId: 'prod-1', quantity: 10, status: 'pending',
      });
      (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 5 });

      await expect(service.complete('tr-1')).rejects.toThrow('Insufficient stock in source warehouse');
      expect(mockRepo.completeTransfer).not.toHaveBeenCalled();
    });

    it('should throw if already completed', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue({ id: 'tr-1', status: 'completed' });
      await expect(service.complete('tr-1')).rejects.toThrow('Only pending transfers can be completed');
    });
  });

  describe('cancel', () => {
    it('should cancel a pending transfer', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue({ id: 'tr-1', status: 'pending' });
      (mockRepo.cancelTransfer as jest.Mock).mockResolvedValue({ id: 'tr-1', status: 'cancelled' });
      const result = await service.cancel('tr-1');
      expect(result).toHaveProperty('status', 'cancelled');
    });

    it('should throw if already completed', async () => {
      (mockRepo.findTransferById as jest.Mock).mockResolvedValue({ id: 'tr-1', status: 'completed' });
      await expect(service.cancel('tr-1')).rejects.toThrow('Only pending transfers can be cancelled');
    });
  });
});
