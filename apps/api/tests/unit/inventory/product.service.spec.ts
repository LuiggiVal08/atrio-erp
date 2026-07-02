import { ProductService } from '../../../src/modules/inventory/application/product.service';
import { InventoryRepository } from '../../../src/modules/inventory/domain/inventory.repository.interface';

describe('ProductService', () => {
  let service: ProductService;
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
    service = new ProductService(mockRepo);
    jest.clearAllMocks();
  });

  const validProduct = {
    tenantId: 'tenant-1', sku: 'PROD-001', name: 'Test Product',
    unitPrice: 100, costPrice: 60, isService: false,
  };

  it('should create a product', async () => {
    (mockRepo.createProduct as jest.Mock).mockResolvedValue({ id: 'prod-1', ...validProduct });
    const result = await service.create(validProduct);
    expect(result).toHaveProperty('id', 'prod-1');
  });

  it('should reject negative unit price', async () => {
    await expect(service.create({ ...validProduct, unitPrice: -1 })).rejects.toThrow('Unit price must be >= 0');
  });

  it('should reject negative cost price', async () => {
    await expect(service.create({ ...validProduct, costPrice: -1 })).rejects.toThrow('Cost price must be >= 0');
  });

  it('should return all products for tenant', async () => {
    (mockRepo.findAllProducts as jest.Mock).mockResolvedValue([{ id: 'prod-1' }]);
    const result = await service.findAll('tenant-1');
    expect(result).toHaveLength(1);
  });

  it('should find product by id', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue({ id: 'prod-1', name: 'Test' });
    const result = await service.findById('prod-1');
    expect(result).toHaveProperty('id', 'prod-1');
  });

  it('should throw when product not found by id', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow('Product not found');
  });

  it('should throw when updating non-existent product', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue(null);
    await expect(service.update('missing', { name: 'New' })).rejects.toThrow('Product not found');
  });

  it('should soft delete product', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue({ id: 'prod-1' });
    (mockRepo.softDeleteProduct as jest.Mock).mockResolvedValue(undefined);
    await service.softDelete('prod-1');
    expect(mockRepo.softDeleteProduct).toHaveBeenCalledWith('prod-1');
  });
});
