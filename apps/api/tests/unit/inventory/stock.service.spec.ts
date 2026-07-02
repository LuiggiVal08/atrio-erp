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
    updateProduct: jest.fn(),
    softDeleteProduct: jest.fn(),
    createWarehouse: jest.fn(),
    findAllWarehouses: jest.fn(),
    softDeleteWarehouse: jest.fn(),
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
    findLowStock: jest.fn(),
  };

  beforeEach(() => {
    service = new StockService(mockRepo);
    jest.clearAllMocks();
  });

  it('should return stock balance', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 10 });
    const result = await service.getBalance('prod-1', 'wh-1');
    expect(result.quantity).toBe(10);
  });

  it('should return zero when no stock record', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue(null);
    const result = await service.getBalance('prod-1', 'wh-1');
    expect(result.quantity).toBe(0);
  });

  it('should adjust stock in', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 5 });
    (mockRepo.adjustStock as jest.Mock).mockResolvedValue({ quantity: 10 });
    (mockRepo.createMovement as jest.Mock).mockResolvedValue({});
    const result = await service.adjust({ productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity: 5 });
    expect(result).toHaveProperty('quantity', 10);
  });

  it('should reject stock out with insufficient stock', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 2 });
    await expect(service.adjust({ productId: 'prod-1', warehouseId: 'wh-1', type: 'out', quantity: 5 })).rejects.toThrow('Insufficient stock');
  });

  it('should reject zero or negative quantity', async () => {
    await expect(service.adjust({ productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity: 0 })).rejects.toThrow('Quantity must be positive');
  });

  it('should create movement on adjust', async () => {
    (mockRepo.getStock as jest.Mock).mockResolvedValue({ quantity: 5 });
    (mockRepo.adjustStock as jest.Mock).mockResolvedValue({ quantity: 10 });
    (mockRepo.createMovement as jest.Mock).mockResolvedValue({ id: 'mov-1' });
    await service.adjust({ productId: 'prod-1', warehouseId: 'wh-1', type: 'in', quantity: 5, userId: 'user-1' });
    expect(mockRepo.createMovement).toHaveBeenCalled();
  });
});
