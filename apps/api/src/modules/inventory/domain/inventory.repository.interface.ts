import { ProductCategory } from './product-category.entity';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';
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

  // Products
  createProduct(data: {
    tenantId: string; sku: string; name: string; description?: string;
    categoryId?: string; unitPrice: number; costPrice: number;
    taxId?: string; isService: boolean;
  }): Promise<Product>;
  findAllProducts(tenantId: string, filter?: { categoryId?: string; isActive?: boolean; search?: string }): Promise<Product[]>;
  findProductById(id: string): Promise<Product | null>;
  updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt'>>): Promise<Product>;
  softDeleteProduct(id: string): Promise<void>;

  // Warehouses
  createWarehouse(data: { tenantId: string; name: string }): Promise<Warehouse>;
  findAllWarehouses(tenantId: string): Promise<Warehouse[]>;
  softDeleteWarehouse(id: string): Promise<void>;

  // Stock
  getStock(productId: string, warehouseId: string): Promise<Stock | null>;
  adjustStock(productId: string, warehouseId: string, quantity: number): Promise<Stock>;
  createMovement(data: {
    productId: string; warehouseId: string; type: string;
    quantity: number; referenceId?: string; referenceType?: string; userId?: string;
  }): Promise<StockMovement>;
  findMovements(productId: string, warehouseId: string): Promise<StockMovement[]>;

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
