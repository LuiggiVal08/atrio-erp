import { ProductCategory } from './product-category.entity';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';
import { StorageLocation, StorageLocationType } from './storage-location.entity';
import { Branch } from './branch.entity';
import { Stock } from './stock.entity';
import { StockMovement } from './stock-movement.entity';
import { StockTransfer } from './stock-transfer.entity';
import { ReorderPoint } from './reorder-point.entity';

export interface WarehouseSummary {
  warehouseId: string;
  skuCount: number;
  totalUnits: number;
  totalValue: number;
  currency: string;
  health: { healthy: number; low: number; out: number; overstock: number };
  categories: Array<{ categoryId: string | null; name: string | null; units: number; value: number }>;
}

export interface StockAdjustmentInput {
  tenantId: string;
  productId: string; warehouseId: string; type: 'in' | 'out'; quantity: number;
  reason?: string; userId?: string; lotNumber?: string; serialNumber?: string; expirationDate?: string;
  operationId?: string; referenceType?: string; referenceId?: string; expectedQuantity?: number;
}

export interface MovementFilter {
  search?: string; productId?: string; warehouseId?: string; branchId?: string; type?: string;
  dateFrom?: string; dateTo?: string; page?: number; pageSize?: number;
}

export interface InventoryRepository {
  // Categories
  createCategory(data: { tenantId: string; name: string; parentId?: string | null }): Promise<ProductCategory>;
  findAllCategories(tenantId: string): Promise<ProductCategory[]>;
  updateCategory(id: string, data: { name?: string; parentId?: string | null }, tenantId: string): Promise<ProductCategory>;
  deleteCategory(id: string, tenantId: string): Promise<void>;
  countProductsByCategory(categoryId: string): Promise<number>;
  countChildCategories(categoryId: string): Promise<number>;

  // Products
  createProduct(data: {
    tenantId: string; sku: string; barcode?: string; name: string; description?: string;
    categoryId?: string; unitPrice: number; costPrice: number;
    taxId?: string; isService: boolean;
    brandId?: string; baseUnit?: string; purchaseUnit?: string; conversionFactor?: number;
    minStock?: number; maxStock?: number; reorderPoint?: number;
    primarySupplierId?: string; supplierSku?: string;
  }): Promise<Product>;
  findAllProducts(tenantId: string, filter?: {
    categoryId?: string; isActive?: boolean; search?: string;
    page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc';
  }): Promise<{ items: Product[]; total: number }>;
  findProductById(id: string, tenantId: string): Promise<Product | null>;
  updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt'>> & Record<string, any>, tenantId: string, userId?: string): Promise<Product>;
  generateProductBarcode(tenantId: string, id: string): Promise<Product>;
  softDeleteProduct(id: string, tenantId: string): Promise<void>;

  // Warehouses
  createWarehouse(data: { tenantId: string; name: string; code?: string; branchId?: string }): Promise<Warehouse>;
  findAllWarehouses(tenantId: string, includeInactive?: boolean): Promise<Warehouse[]>;
  findWarehouseById(id: string): Promise<Warehouse | null>;
  updateWarehouse(id: string, data: { name?: string; code?: string | null; branchId?: string | null; isActive?: boolean }): Promise<Warehouse>;
  softDeleteWarehouse(id: string): Promise<void>;
  setDefaultWarehouse(tenantId: string, warehouseId: string): Promise<void>;
  getDefaultWarehouse(tenantId: string): Promise<Warehouse | null>;
  getWarehouseSummary(tenantId: string, warehouseId: string): Promise<WarehouseSummary>;

  // Storage Locations
  createStorageLocation(data: {
    tenantId: string; warehouseId: string; parentId: string | null;
    type: StorageLocationType; code: string; name?: string | null; path: string;
  }): Promise<StorageLocation>;
  findStorageLocationById(id: string): Promise<StorageLocation | null>;
  findStorageLocationByPath(warehouseId: string, path: string): Promise<StorageLocation | null>;
  findStorageLocationsByWarehouse(warehouseId: string): Promise<StorageLocation[]>;
  findStorageLocationSiblings(warehouseId: string, parentId: string | null): Promise<StorageLocation[]>;
  findStorageLocationChildren(parentId: string): Promise<StorageLocation[]>;
  updateStorageLocation(id: string, data: { code?: string; name?: string | null; isActive?: boolean; path?: string }): Promise<StorageLocation>;
  softDeleteStorageLocation(id: string): Promise<void>;
  generateStorageLocations(tenantId: string, warehouseId: string, input: { aisles: number; shelves: number; levels: number; bins: number }): Promise<{ created: number; total: number }>;
  rewriteStorageLocation(id: string, tenantId: string, data: { code?: string; name?: string | null; isActive?: boolean }): Promise<StorageLocation>;

  // Branches
  createBranch(data: { tenantId: string; name: string; code?: string; address?: string; city?: string; state?: string; phone?: string; managerEmployeeId?: string }): Promise<Branch>;
  findAllBranches(tenantId: string, includeInactive?: boolean): Promise<Branch[]>;
  findBranchById(id: string): Promise<Branch | null>;
  updateBranch(id: string, data: { name?: string; code?: string | null; address?: string | null; city?: string | null; state?: string | null; phone?: string | null; managerEmployeeId?: string | null; isActive?: boolean }): Promise<Branch>;
  softDeleteBranch(id: string): Promise<void>;
  countActiveWarehousesByBranch(branchId: string): Promise<number>;
  employeeBelongsToTenant(tenantId: string, employeeId: string): Promise<boolean>;

  // Stock: balances, lots and movement must commit together.
  getStock(productId: string, warehouseId: string, tenantId: string): Promise<Stock | null>;
  findStockBalances(tenantId: string): Promise<any[]>;
  adjustStockAtomic(data: StockAdjustmentInput): Promise<Stock>;
  findMovements(productId: string, warehouseId: string, tenantId: string): Promise<StockMovement[]>;
  findAllMovements(tenantId: string, filter?: MovementFilter): Promise<{ items: any[]; total: number; page: number; pageSize: number }>;

  // Transfers
  createTransfer(data: {
    tenantId: string; fromWarehouseId: string; toWarehouseId: string;
    productId: string; quantity: number; notes?: string; lotNumber?: string;
  }): Promise<StockTransfer>;
  findTransfersByTenant(tenantId: string): Promise<StockTransfer[]>;
  findTransferById(id: string): Promise<StockTransfer | null>;
  dispatchTransfer(id: string, tenantId: string, userId?: string): Promise<StockTransfer>;
  receiveTransfer(id: string, tenantId: string, data: {
    quantity: number; closeShortage?: boolean; userId?: string;
  }): Promise<StockTransfer>;
  cancelTransfer(id: string, tenantId: string): Promise<StockTransfer>;

  // Reorder Points
  setReorderPoint(data: {
    tenantId: string; productId: string; warehouseId: string;
    minQuantity: number; maxQuantity: number;
  }): Promise<ReorderPoint>;
  findReorderPointsByTenant(tenantId: string): Promise<ReorderPoint[]>;
  findReorderPoint(productId: string, warehouseId: string): Promise<ReorderPoint | null>;
  findReorderPointById(id: string, tenantId: string): Promise<ReorderPoint | null>;
  updateReorderPoint(id: string, data: Partial<{ minQuantity: number; maxQuantity: number; isActive: boolean }>, tenantId: string): Promise<ReorderPoint>;
  deleteReorderPoint(id: string, tenantId: string): Promise<void>;
  findLowStock(tenantId: string): Promise<Array<{ productId: string; warehouseId: string; currentQuantity: number; minQuantity: number; maxQuantity: number; suggestedQuantity: number; productName: string; productSku: string | null; warehouseName: string }>>;
}
