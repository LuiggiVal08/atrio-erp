import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { InventoryRepository } from '../domain/inventory.repository.interface';
import { ProductCategory } from '../domain/product-category.entity';
import { Product } from '../domain/product.entity';
import { Warehouse } from '../domain/warehouse.entity';
import { Branch } from '../domain/branch.entity';
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

  async countProductsByCategory(categoryId: string): Promise<number> {
    return this.prisma.product.count({ where: { categoryId } });
  }

  async countChildCategories(categoryId: string): Promise<number> {
    return this.prisma.productCategory.count({ where: { parentId: categoryId } });
  }

  async createProduct(data: {
    tenantId: string; sku: string; barcode?: string; name: string; description?: string;
    categoryId?: string; unitPrice: number; costPrice: number;
    taxId?: string; isService: boolean;
    brandId?: string; baseUnit?: string; purchaseUnit?: string; conversionFactor?: number;
    minStock?: number; maxStock?: number; reorderPoint?: number;
    primarySupplierId?: string; supplierSku?: string;
  }): Promise<Product> {
    const record = await this.prisma.product.create({
      data: {
        tenantId: data.tenantId, sku: data.sku, barcode: data.barcode ?? null, name: data.name,
        description: data.description ?? null, categoryId: data.categoryId ?? null,
        unitPrice: data.unitPrice, costPrice: data.costPrice,
        taxId: data.taxId ?? null, isService: data.isService,
        brandId: data.brandId ?? null, baseUnit: data.baseUnit ?? 'unidad',
        purchaseUnit: data.purchaseUnit ?? null, conversionFactor: data.conversionFactor ?? 1,
        minStock: data.minStock ?? 0, maxStock: data.maxStock ?? null,
        reorderPoint: data.reorderPoint ?? 0,
        primarySupplierId: data.primarySupplierId ?? null, supplierSku: data.supplierSku ?? null,
      },
    });
    if (record.costPrice > 0) {
      await this.prisma.productCostHistory.create({
        data: { tenantId: data.tenantId, productId: record.id, unitCost: record.costPrice, supplierId: data.primarySupplierId ?? null, referenceId: record.sku },
      });
    }
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt, record.barcode);
  }

  async findAllProducts(tenantId: string, filter?: {
    categoryId?: string; isActive?: boolean; search?: string;
    page?: number; pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc';
  }): Promise<{ items: Product[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };
    if (filter?.categoryId) where.categoryId = filter.categoryId;
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { sku: { contains: filter.search, mode: 'insensitive' } },
        { barcode: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 50;
    const skip = (page - 1) * pageSize;
    const sortMap: Record<string, string> = {
      sku: 'sku', name: 'name', unitPrice: 'unitPrice',
      costPrice: 'costPrice', averageCost: 'costPrice',
    };
    const orderBy: any = {};
    const sf = filter?.sortBy;
    const sd = filter?.sortDir;
    const mapped = sf ? sortMap[sf] : null;
    if (mapped) {
      orderBy[mapped] = (sd === 'desc' ? 'desc' : 'asc');
    } else {
      orderBy.name = 'asc';
    }
    const [records, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          category: { select: { name: true } },
          stock: { select: { quantity: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);
    const items = records.map(r => {
      const stockQty = r.stock?.reduce?.((sum, s) => sum + s.quantity, 0) ?? 0;
      return Object.assign(new Product(r.id, r.tenantId, r.sku, r.name, r.description, r.categoryId, r.unitPrice, r.costPrice, r.taxId, r.isService, r.isActive, r.createdAt, r.updatedAt, r.deletedAt, r.barcode), {
        category: r.category?.name ?? '',
        stock: stockQty,
      });
    });
    return { items, total };
  }

  async findProductById(id: string): Promise<Product | null> {
    const record = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!record) return null;
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt, record.barcode);
  }

  async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt'>>): Promise<Product> {
    const record = await this.prisma.product.update({ where: { id }, data });
    if ((data as any).costPrice !== undefined && Number((data as any).costPrice) >= 0) {
      await this.prisma.productCostHistory.create({
        data: { tenantId: record.tenantId, productId: record.id, unitCost: record.costPrice, supplierId: record.primarySupplierId ?? null },
      });
    }
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt, record.barcode);
  }

  async generateProductBarcode(id: string): Promise<Product> {
    const current = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!current) throw new NotFoundException('Product not found');
    const record = await this.prisma.product.update({
      where: { id },
      data: { barcode: current.barcode ?? current.sku },
    });
    return new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt, record.barcode);
  }

  async softDeleteProduct(id: string): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async createWarehouse(data: { tenantId: string; name: string; code?: string; branchId?: string; aisle?: string; shelf?: string; level?: string; bin?: string }): Promise<Warehouse> {
    const record = await this.prisma.warehouse.create({ data: {
      tenantId: data.tenantId, name: data.name, code: data.code ?? null,
      branchId: data.branchId ?? null,
      aisle: data.aisle ?? null, shelf: data.shelf ?? null,
      level: data.level ?? null, bin: data.bin ?? null,
    } });
    return new Warehouse(record.id, record.tenantId, record.name, record.branchId, record.code, record.isActive, record.createdAt, record.aisle, record.shelf, record.level, record.bin);
  }

  async findAllWarehouses(tenantId: string): Promise<Warehouse[]> {
    const records = await this.prisma.warehouse.findMany({ where: { tenantId, isActive: true } });
    return records.map(r => new Warehouse(r.id, r.tenantId, r.name, r.branchId, r.code, r.isActive, r.createdAt, r.aisle, r.shelf, r.level, r.bin));
  }

  async updateWarehouse(id: string, data: { name?: string; code?: string | null; branchId?: string | null; isActive?: boolean; aisle?: string | null; shelf?: string | null; level?: string | null; bin?: string | null }): Promise<Warehouse> {
    const record = await this.prisma.warehouse.update({ where: { id }, data });
    return new Warehouse(record.id, record.tenantId, record.name, record.branchId, record.code, record.isActive, record.createdAt, record.aisle, record.shelf, record.level, record.bin);
  }

  async softDeleteWarehouse(id: string): Promise<void> {
    await this.prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  }

  async createBranch(data: { tenantId: string; name: string; code?: string; address?: string; phone?: string }): Promise<Branch> {
    const record = await this.prisma.branch.create({ data: {
      tenantId: data.tenantId, name: data.name, code: data.code ?? null,
      address: data.address ?? null, phone: data.phone ?? null,
    } });
    return new Branch(record.id, record.tenantId, record.name, record.code, record.address, record.phone, record.isActive, record.createdAt);
  }

  async findAllBranches(tenantId: string): Promise<Branch[]> {
    const records = await this.prisma.branch.findMany({ where: { tenantId, isActive: true }, orderBy: [{ name: 'asc' }] });
    return records.map(r => new Branch(r.id, r.tenantId, r.name, r.code, r.address, r.phone, r.isActive, r.createdAt));
  }

  async updateBranch(id: string, data: { name?: string; code?: string | null; address?: string | null; phone?: string | null; isActive?: boolean }): Promise<Branch> {
    const record = await this.prisma.branch.update({ where: { id }, data });
    return new Branch(record.id, record.tenantId, record.name, record.code, record.address, record.phone, record.isActive, record.createdAt);
  }

  async softDeleteBranch(id: string): Promise<void> {
    await this.prisma.branch.update({ where: { id }, data: { isActive: false } });
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

  async upsertStockLot(data: { tenantId: string; productId: string; warehouseId: string; lotNumber?: string; serialNumber?: string; expirationDate?: string; delta: number }): Promise<any> {
    const lotKey = data.lotNumber?.trim() || data.serialNumber?.trim() || 'SIN_LOTE';
    const record = await this.prisma.stockLot.upsert({
      where: { productId_warehouseId_lotNumber: { productId: data.productId, warehouseId: data.warehouseId, lotNumber: lotKey } },
      update: { quantity: { increment: data.delta }, serialNumber: data.serialNumber ?? null, expirationDate: data.expirationDate ? new Date(data.expirationDate) : null },
      create: { tenantId: data.tenantId, productId: data.productId, warehouseId: data.warehouseId, lotNumber: lotKey, serialNumber: data.serialNumber ?? null, expirationDate: data.expirationDate ? new Date(data.expirationDate) : null, quantity: Math.max(0, data.delta) },
    });
    return record;
  }

  async findStockBalances(tenantId: string): Promise<any[]> {
    return this.prisma.stock.findMany({
      where: { product: { tenantId }, warehouse: { tenantId } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unitPrice: true,
            costPrice: true,
            minStock: true,
            maxStock: true,
            reorderPoint: true,
            baseUnit: true,
            purchaseUnit: true,
            conversionFactor: true,
            supplierSku: true,
          },
        },
        warehouse: { select: { id: true, name: true, code: true, branchId: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });
  }

  async createMovement(data: {
    productId: string; warehouseId: string; type: string;
    quantity: number; referenceId?: string; referenceType?: string; userId?: string;
    balanceBefore?: number; balanceAfter?: number; lotId?: string;
  }): Promise<StockMovement> {
    const record = await this.prisma.stockMovement.create({
      data: {
        productId: data.productId, warehouseId: data.warehouseId,
        type: data.type, quantity: data.quantity,
        referenceId: data.referenceId ?? null, referenceType: data.referenceType ?? null,
        userId: data.userId ?? null,
        lotId: data.lotId ?? null,
        balanceBefore: data.balanceBefore ?? null,
        balanceAfter: data.balanceAfter ?? null,
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

  async findAllMovements(tenantId: string): Promise<any[]> {
    const [products, warehouses, users] = await Promise.all([
      this.prisma.product.findMany({ where: { tenantId, deletedAt: null }, select: { id: true, name: true, sku: true } }),
      this.prisma.warehouse.findMany({ where: { tenantId }, select: { id: true, name: true, code: true, branchId: true } }),
      this.prisma.user.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    ]);
    const productIds = products.map((product) => product.id);
    const warehouseIds = warehouses.map((warehouse) => warehouse.id);
    const records = await this.prisma.stockMovement.findMany({
      where: { productId: { in: productIds }, warehouseId: { in: warehouseIds } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const productMap = new Map(products.map((product) => [product.id, product]));
    const warehouseMap = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));
    const userMap = new Map(users.map((user) => [user.id, user]));
    return records.map((record) => ({
      ...record,
      product: productMap.get(record.productId) ?? null,
      warehouse: warehouseMap.get(record.warehouseId) ?? null,
      userName: record.userId ? userMap.get(record.userId)?.name ?? record.userId : 'Sistema',
    }));
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
    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({ where: { id } });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be completed');

      const pendingClaim = await tx.stockTransfer.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'processing' },
      });
      if (pendingClaim.count !== 1) {
        throw new BadRequestException('Only pending transfers can be completed');
      }

      const sourceStockUpdate = await tx.stock.updateMany({
        where: {
          productId: transfer.productId,
          warehouseId: transfer.fromWarehouseId,
          quantity: { gte: transfer.quantity },
        },
        data: { quantity: { decrement: transfer.quantity } },
      });
      if (sourceStockUpdate.count !== 1) {
        throw new BadRequestException('Insufficient stock in source warehouse');
      }
      await tx.stock.upsert({
        where: { productId_warehouseId: { productId: transfer.productId, warehouseId: transfer.toWarehouseId } },
        update: { quantity: { increment: transfer.quantity } },
        create: { productId: transfer.productId, warehouseId: transfer.toWarehouseId, quantity: transfer.quantity },
      });
      await tx.stockMovement.createMany({
        data: [
          {
            productId: transfer.productId,
            warehouseId: transfer.fromWarehouseId,
            type: 'out',
            quantity: transfer.quantity,
            referenceType: 'transfer',
            referenceId: transfer.id,
          },
          {
            productId: transfer.productId,
            warehouseId: transfer.toWarehouseId,
            type: 'in',
            quantity: transfer.quantity,
            referenceType: 'transfer',
            referenceId: transfer.id,
          },
        ],
      });
      const completed = await tx.stockTransfer.update({
        where: { id },
        data: { status: 'completed', completedAt: new Date() },
      });
      return new StockTransfer(
        completed.id,
        completed.tenantId,
        completed.fromWarehouseId,
        completed.toWarehouseId,
        completed.productId,
        completed.quantity,
        completed.status,
        completed.notes,
        completed.createdAt,
        completed.completedAt,
      );
    });
  }

  async cancelTransfer(id: string): Promise<StockTransfer> {
    const r = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.stockTransfer.updateMany({
        where: { id, status: 'pending' },
        data: { status: 'cancelled' },
      });
      if (cancelled.count !== 1) {
        throw new BadRequestException('Only pending transfers can be cancelled');
      }
      return tx.stockTransfer.findUniqueOrThrow({ where: { id } });
    });
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
