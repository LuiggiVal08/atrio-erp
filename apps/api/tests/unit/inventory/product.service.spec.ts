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
    service = new ProductService(mockRepo);
    jest.clearAllMocks();
  });

  const validProduct = {
    tenantId: 'tenant-1', sku: 'PROD-001', name: 'Test Product',
    unitPrice: 100, costPrice: 60, isService: false,
  };

  it('should delegate creation to the repository without altering the barcode', async () => {
    (mockRepo.createProduct as jest.Mock).mockImplementation(async (data) => ({ id: 'prod-1', ...data }));
    const result = await service.create(validProduct);
    expect(result).toHaveProperty('id', 'prod-1');
    expect(mockRepo.createProduct).toHaveBeenCalledWith(validProduct);
  });

  it('should keep provided barcode when creating a product', async () => {
    (mockRepo.createProduct as jest.Mock).mockImplementation(async (data) => ({ id: 'prod-1', ...data }));
    const result = await service.create({ ...validProduct, barcode: '7501234567890' });
    expect(result).toHaveProperty('barcode', '7501234567890');
    expect(mockRepo.createProduct).toHaveBeenCalledWith(expect.objectContaining({
      barcode: '7501234567890',
    }));
  });

  it('should delegate internal barcode generation to the repository', async () => {
    (mockRepo.generateProductBarcode as jest.Mock).mockResolvedValue({ id: 'prod-1', barcode: '2000000000015' });
    const result = await service.generateBarcode('tenant-1', 'prod-1');
    expect(mockRepo.generateProductBarcode).toHaveBeenCalledWith('tenant-1', 'prod-1');
    expect(result).toHaveProperty('barcode', '2000000000015');
  });

  it('should map a duplicate barcode conflict when generating', async () => {
    (mockRepo.generateProductBarcode as jest.Mock).mockRejectedValue({ code: 'P2002' });
    await expect(service.generateBarcode('tenant-1', 'prod-1')).rejects.toThrow('Barcode already exists');
  });

  it('should reject negative unit price', async () => {
    await expect(service.create({ ...validProduct, unitPrice: -1 })).rejects.toThrow('unitPrice must be >= 0');
  });

  it('should reject negative cost price', async () => {
    await expect(service.create({ ...validProduct, costPrice: -1 })).rejects.toThrow('costPrice must be >= 0');
  });

  it('should return all products for tenant', async () => {
    (mockRepo.findAllProducts as jest.Mock).mockResolvedValue([{ id: 'prod-1' }]);
    const result = await service.findAll('tenant-1');
    expect(result).toHaveLength(1);
  });

  it('should find product by id', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue({ id: 'prod-1', tenantId: 'tenant-1', name: 'Test' });
    const result = await service.findById('tenant-1', 'prod-1');
    expect(result).toHaveProperty('id', 'prod-1');
  });

  it('should throw when product not found by id', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue(null);
    await expect(service.findById('tenant-1', 'missing')).rejects.toThrow('Product not found');
  });

  it('should throw when updating non-existent product', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue(null);
    await expect(service.update('tenant-1', 'missing', { name: 'New' })).rejects.toThrow('Product not found');
  });

  it('should soft delete product', async () => {
    (mockRepo.findProductById as jest.Mock).mockResolvedValue({ id: 'prod-1', tenantId: 'tenant-1' });
    (mockRepo.softDeleteProduct as jest.Mock).mockResolvedValue(undefined);
    await service.softDelete('tenant-1', 'prod-1');
    expect(mockRepo.softDeleteProduct).toHaveBeenCalledWith('prod-1', 'tenant-1');
  });
});
