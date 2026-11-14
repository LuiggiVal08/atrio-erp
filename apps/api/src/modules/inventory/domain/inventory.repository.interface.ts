import { ProductCategory } from './product-category.entity';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';
import { Branch } from './branch.entity';
import { Stock } from './stock.entity';
import { StockMovement } from './stock-movement.entity';
import { StockTransfer } from './stock-transfer.entity';
import { ReorderPoint } from './reorder-point.entity';

export interface InventoryRepository {
  // Categories
  createCategory(data: { tenantId: string; name: string; parentId?: string }): Promise<ProductCategory>;
  findAllCategories(tenantId: string): Promise<ProductCategory[]>;
  updateCategory(id: string, data: { name?: string; parentId?: string }): Promise<ProductCategory>;
  deleteCategory(id: string): Promise<void>;
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
  findProductById(id: string): Promise<Product | null>;
  updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt'>> & Record<string, any>): Promise<Product>;
  generateProductBarcode(tenantId: string, id: string): Promise<Product>;
  softDeleteProduct(id: string): Promise<void>;

  // Warehouses
  createWarehouse(data: { tenantId: string; name: string; code?: string; branchId?: string; aisle?: string; shelf?: string; level?: string; bin?: string }): Promise<Warehouse>;
  findAllWarehouses(tenantId: string): Promise<Warehouse[]>;
  updateWarehouse(id: string, data: { name?: string; code?: string | null; branchId?: string | null; isActive?: boolean; aisle?: string | null; shelf?: string | null; level?: string | null; bin?: string | null }): Promise<Warehouse>;
  softDeleteWarehouse(id: string): Promise<void>;

  // Branches
  createBranch(data: { tenantId: string; name: string; code?: string; address?: string; phone?: string }): Promise<Branch>;
  findAllBranches(tenantId: string): Promise<Branch[]>;
  updateBranch(id: string, data: { name?: string; code?: string | null; address?: string | null; phone?: string | null; isActive?: boolean }): Promise<Branch>;
  softDeleteBranch(id: string): Promise<void>;

  // Stock
  getStock(productId: string, warehouseId: string): Promise<Stock | null>;
  findStockBalances?(tenantId: string): Promise<any[]>;
  adjustStock(productId: string, warehouseId: string, quantity: number): Promise<Stock>;
  upsertStockLot?(data: { tenantId: string; productId: string; warehouseId: string; lotNumber?: string; serialNumber?: string; expirationDate?: string; delta: number }): Promise<any>;
  createMovement(data: {
    productId: string; warehouseId: string; type: string;
    quantity: number; referenceId?: string; referenceType?: string; userId?: string;
    balanceBefore?: number; balanceAfter?: number; lotId?: string;
  }): Promise<StockMovement>;
  findMovements(productId: string, warehouseId: string): Promise<StockMovement[]>;
  findAllMovements?(tenantId: string): Promise<any[]>;

  // Transfers
  createTransfer(data: {
    tenantId: string; fromWarehouseId: string; toWarehouseId: string;
    productId: string; quantity: number; notes?: string;
  }): Promise<StockTransfer>;
  findTransfersByTenant(tenantId: string): Promise<StockTransfer[]>;
  findTransferById(id: string): Promise<StockTransfer | null>;
  completeTransfer(id: string): Promise<StockTransfer>;
  cancelTransfer(id: string): Promise<StockTransfer>;

  // Reorder Points
  setReorderPoint(data: {
    tenantId: string; productId: string; warehouseId: string;
    minQuantity: number; maxQuantity: number;
  }): Promise<ReorderPoint>;
  findReorderPointsByTenant(tenantId: string): Promise<ReorderPoint[]>;
  findReorderPoint(productId: string, warehouseId: string): Promise<ReorderPoint | null>;
  updateReorderPoint(id: string, data: Partial<{ minQuantity: number; maxQuantity: number; isActive: boolean }>): Promise<ReorderPoint>;
  deleteReorderPoint(id: string): Promise<void>;
  findLowStock(tenantId: string): Promise<Array<{ productId: string; warehouseId: string; currentQuantity: number; minQuantity: number }>>;
}
