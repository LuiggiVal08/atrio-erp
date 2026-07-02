import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { InventoryRepository } from '../domain/inventory.repository.interface';
import { ProductCategory } from '../domain/product-category.entity';
import { Product } from '../domain/product.entity';
import { Warehouse } from '../domain/warehouse.entity';
import { Stock } from '../domain/stock.entity';
import { StockMovement } from '../domain/stock-movement.entity';
import { StockTransfer } from '../domain/stock-transfer.entity';
import { ReorderPoint } from '../domain/reorder-point.entity';

@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(data: { tenantId: string; name: string; parentId?: string }): Promise<ProductCategory> {
    const record = await this.prisma.productCategory.create({
      data: { tenantId: data.tenantId, name: data.name, parentId: data.parentId ?? null },
    });
    return new ProductCategory(record.id, record.tenantId, record.name, record.parentId, record.createdAt);
  }

  async findAllCategories(tenantId: string): Promise<ProductCategory[]> {
    const records = await this.prisma.productCategory.findMany({ where: { tenantId } });
    return records.map(r => new ProductCategory(r.id, r.tenantId, r.name, r.parentId, r.createdAt));
  }

  async updateCategory(id: string, data: { name?: string; parentId?: string }): Promise<ProductCategory> {
    const record = await this.prisma.productCategory.update({ where: { id }, data });
    return new ProductCategory(record.id, record.tenantId, record.name, record.parentId, record.createdAt);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.prisma.productCategory.delete({ where: { id } });
  }

  async createProduct(data: {
    tenantId: string; sku: string; name: string; description?: string;
    categoryId?: string; unitPrice: number; costPrice: number;
    taxId?: string; isService: boolean;
  }): Promise<Product> {
    const record = await this.prisma.product.create({
      data: {
        tenantId: data.tenantId, sku: data.sku, name: data.name,
        description: data.description ?? null, categoryId: data.categoryId ?? null,
        unitPrice: data.unitPrice, costPrice: data.costPrice,
        taxId: data.taxId ?? null, isService: data.isService,
      },
    });
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt);
  }

  async findAllProducts(tenantId: string, filter?: { categoryId?: string; isActive?: boolean; search?: string }): Promise<Product[]> {
    const where: any = { tenantId, deletedAt: null };
    if (filter?.categoryId) where.categoryId = filter.categoryId;
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    const records = await this.prisma.product.findMany({ where, orderBy: { name: 'asc' } });
    return records.map(r => new Product(r.id, r.tenantId, r.sku, r.name, r.description, r.categoryId, r.unitPrice, r.costPrice, r.taxId, r.isService, r.isActive, r.createdAt, r.updatedAt, r.deletedAt));
  }

  async findProductById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!record) return null;
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt);
  }

  async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt'>>): Promise<Product> {
    const record = await this.prisma.product.update({ where: { id }, data });
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt);
  }

  async softDeleteProduct(id: string): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async createWarehouse(data: { tenantId: string; name: string }): Promise<Warehouse> {
    const record = await this.prisma.warehouse.create({ data });
    return new Warehouse(record.id, record.tenantId, record.name, record.isActive, record.createdAt);
  }

  async findAllWarehouses(tenantId: string): Promise<Warehouse[]> {
    const records = await this.prisma.warehouse.findMany({ where: { tenantId, isActive: true } });
    return records.map(r => new Warehouse(r.id, r.tenantId, r.name, r.isActive, r.createdAt));
  }

  async softDeleteWarehouse(id: string): Promise<void> {
    await this.prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  }

  async getStock(productId: string, warehouseId: string): Promise<Stock | null> {
    const record = await this.prisma.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    if (!record) return null;
    return new Stock(record.id, record.productId, record.warehouseId, record.quantity, record.createdAt, record.updatedAt);
  }

  async adjustStock(productId: string, warehouseId: string, delta: number): Promise<Stock> {
    const record = await this.prisma.stock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { quantity: { increment: delta } },
      create: { productId, warehouseId, quantity: Math.max(0, delta) },
    });
    return new Stock(record.id, record.productId, record.warehouseId, record.quantity, record.createdAt, record.updatedAt);
  }

  async createMovement(data: {
    productId: string; warehouseId: string; type: string;
    quantity: number; referenceId?: string; referenceType?: string; userId?: string;
  }): Promise<StockMovement> {
    const record = await this.prisma.stockMovement.create({
      data: {
        productId: data.productId, warehouseId: data.warehouseId,
        type: data.type, quantity: data.quantity,
        referenceId: data.referenceId ?? null, referenceType: data.referenceType ?? null,
        userId: data.userId ?? null,
      },
    });
    return new StockMovement(record.id, record.productId, record.warehouseId, record.type as any, record.quantity, record.referenceId, record.referenceType, record.createdAt, record.userId);
  }

  async findMovements(productId: string, warehouseId: string): Promise<StockMovement[]> {
    const records = await this.prisma.stockMovement.findMany({
      where: { productId, warehouseId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => new StockMovement(r.id, r.productId, r.warehouseId, r.type as any, r.quantity, r.referenceId, r.referenceType, r.createdAt, r.userId));
  }

  // Transfers
  async createTransfer(data: { tenantId: string; fromWarehouseId: string; toWarehouseId: string; productId: string; quantity: number; notes?: string }): Promise<StockTransfer> {
    const r = await this.prisma.stockTransfer.create({
      data: { ...data, notes: data.notes ?? null },
    });
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt);
  }

  async findTransfersByTenant(tenantId: string): Promise<StockTransfer[]> {
    const records = await this.prisma.stockTransfer.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt));
  }

  async findTransferById(id: string): Promise<StockTransfer | null> {
    const r = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!r) return null;
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt);
  }

  async completeTransfer(id: string): Promise<StockTransfer> {
    const r = await this.prisma.stockTransfer.update({ where: { id }, data: { status: 'completed', completedAt: new Date() } });
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt);
  }

  async cancelTransfer(id: string): Promise<StockTransfer> {
    const r = await this.prisma.stockTransfer.update({ where: { id }, data: { status: 'cancelled' } });
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt);
  }

  // Reorder Points
  async setReorderPoint(data: { tenantId: string; productId: string; warehouseId: string; minQuantity: number; maxQuantity: number }): Promise<ReorderPoint> {
    const r = await this.prisma.reorderPoint.upsert({
      where: { productId_warehouseId: { productId: data.productId, warehouseId: data.warehouseId } },
      update: { minQuantity: data.minQuantity, maxQuantity: data.maxQuantity, isActive: true },
      create: data,
    });
    return new ReorderPoint(r.id, r.tenantId, r.productId, r.warehouseId, r.minQuantity, r.maxQuantity, r.isActive, r.createdAt, r.updatedAt);
  }

  async findReorderPointsByTenant(tenantId: string): Promise<ReorderPoint[]> {
    const records = await this.prisma.reorderPoint.findMany({ where: { tenantId, isActive: true } });
    return records.map(r => new ReorderPoint(r.id, r.tenantId, r.productId, r.warehouseId, r.minQuantity, r.maxQuantity, r.isActive, r.createdAt, r.updatedAt));
  }

  async findReorderPoint(productId: string, warehouseId: string): Promise<ReorderPoint | null> {
    const r = await this.prisma.reorderPoint.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    if (!r) return null;
    return new ReorderPoint(r.id, r.tenantId, r.productId, r.warehouseId, r.minQuantity, r.maxQuantity, r.isActive, r.createdAt, r.updatedAt);
  }

  async updateReorderPoint(id: string, data: Partial<{ minQuantity: number; maxQuantity: number; isActive: boolean }>): Promise<ReorderPoint> {
    const r = await this.prisma.reorderPoint.update({ where: { id }, data });
    return new ReorderPoint(r.id, r.tenantId, r.productId, r.warehouseId, r.minQuantity, r.maxQuantity, r.isActive, r.createdAt, r.updatedAt);
  }

  async deleteReorderPoint(id: string): Promise<void> {
    await this.prisma.reorderPoint.deleteMany({ where: { id } });
  }

  async findLowStock(tenantId: string): Promise<Array<{ productId: string; warehouseId: string; currentQuantity: number; minQuantity: number }>> {
    const reorderPoints = await this.prisma.reorderPoint.findMany({
      where: { tenantId, isActive: true },
    });
    const result: Array<{ productId: string; warehouseId: string; currentQuantity: number; minQuantity: number }> = [];
    for (const rp of reorderPoints) {
      const stock = await this.prisma.stock.findUnique({
        where: { productId_warehouseId: { productId: rp.productId, warehouseId: rp.warehouseId } },
      });
      const currentQuantity = stock ? stock.quantity : 0;
      if (currentQuantity < rp.minQuantity) {
        result.push({ productId: rp.productId, warehouseId: rp.warehouseId, currentQuantity, minQuantity: rp.minQuantity });
      }
    }
    return result;
  }
}
