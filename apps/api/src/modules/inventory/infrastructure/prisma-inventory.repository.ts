import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { InventoryRepository, WarehouseSummary, StockAdjustmentInput, MovementFilter } from '../domain/inventory.repository.interface';
import { ProductCategory } from '../domain/product-category.entity';
import { Product } from '../domain/product.entity';
import { Warehouse } from '../domain/warehouse.entity';
import { StorageLocation, StorageLocationType } from '../domain/storage-location.entity';
import { Branch } from '../domain/branch.entity';
import { Stock } from '../domain/stock.entity';
import { StockMovement } from '../domain/stock-movement.entity';
import { StockTransfer } from '../domain/stock-transfer.entity';
import { ReorderPoint } from '../domain/reorder-point.entity';
import { buildInternalEan13 } from '../domain/internal-barcode';

const productInclude = {
  brand: { select: { name: true } },
  category: { select: { name: true } },
  tax: { select: { name: true } },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(data: { tenantId: string; name: string; parentId?: string | null }): Promise<ProductCategory> {
    this.requireTenant(data.tenantId);
    const record = await this.serialTransaction(async tx => {
      if (data.parentId && !await tx.productCategory.findFirst({ where: { id: data.parentId, tenantId: data.tenantId } })) throw new BadRequestException('Parent category must belong to tenant');
      return tx.productCategory.create({ data: { tenantId: data.tenantId, name: data.name, parentId: data.parentId ?? null } });
    });
    return new ProductCategory(record.id, record.tenantId, record.name, record.parentId, record.createdAt);
  }

  async findAllCategories(tenantId: string): Promise<ProductCategory[]> {
    const records = await this.prisma.productCategory.findMany({ where: { tenantId } });
    return records.map(r => new ProductCategory(r.id, r.tenantId, r.name, r.parentId, r.createdAt));
  }

  async updateCategory(id: string, data: { name?: string; parentId?: string | null }, tenantId: string): Promise<ProductCategory> {
    this.requireTenant(tenantId);
    const record = await this.serialTransaction(async tx => {
      const categories = await tx.productCategory.findMany({ where: { tenantId } });
      if (!categories.some(c => c.id === id)) throw new NotFoundException('Category not found');
      const visited = new Set([id]);
      let parentId = data.parentId;
      while (parentId) {
        if (visited.has(parentId)) throw new BadRequestException('Category hierarchy must be acyclic');
        visited.add(parentId);
        const parent = categories.find(c => c.id === parentId);
        if (!parent) throw new BadRequestException('Parent category must belong to tenant');
        parentId = parent.parentId;
      }
      return tx.productCategory.update({ where: { id, tenantId }, data });
    });
    return new ProductCategory(record.id, record.tenantId, record.name, record.parentId, record.createdAt);
  }

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    this.requireTenant(tenantId);
    await this.prisma.productCategory.delete({ where: { id, tenantId } });
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
    const barcode = data.barcode?.trim();
    let record: Prisma.ProductGetPayload<{}>;
    for (let attempt = 0; ; attempt++) {
      try {
        record = await this.serialTransaction(async tx => {
          await this.assertProductLinks(tx, data.tenantId, data);
          const created = await tx.product.create({
          data: {
            tenantId: data.tenantId, sku: data.sku, barcode: barcode || await this.nextInternalBarcode(), name: data.name,
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
          if (created.costPrice > 0) await tx.productCostHistory.create({
            data: { tenantId: data.tenantId, productId: created.id, unitCost: created.costPrice, supplierId: data.primarySupplierId ?? null, referenceId: created.sku },
          });
          return created;
        });
        break;
      } catch (error) {
        const barcodeConflict = error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('barcode');
        if (barcode || !barcodeConflict || attempt >= 9) throw error;
      }
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
    const orderBy: any[] = [];
    const sf = filter?.sortBy;
    const sd = filter?.sortDir;
    const mapped = sf ? sortMap[sf] : null;
    orderBy.push(mapped ? { [mapped]: sd === 'desc' ? 'desc' : 'asc' } : { name: 'asc' });
    orderBy.push({ id: 'asc' });
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

  async findProductById(id: string, tenantId: string): Promise<Product | null> {
    this.requireTenant(tenantId);
    const record = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: productInclude,
    });
    if (!record) return null;
    return this.toProduct(record);
  }

  async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt'>> & Record<string, any>, tenantId: string, userId?: string): Promise<Product> {
    this.requireTenant(tenantId);
    const record = await this.serialTransaction(async tx => {
      const before = await tx.product.findFirst({ where: { id, tenantId, deletedAt: null } });
      if (!before) throw new NotFoundException('Product not found');
      await this.assertProductLinks(tx, tenantId, data);
      const updated = await tx.product.update({ where: { id, tenantId }, data: data as Prisma.ProductUncheckedUpdateInput, include: productInclude });
      if (data.costPrice !== undefined && Number(before.costPrice) !== Number(updated.costPrice)) await tx.productCostHistory.create({
        data: { tenantId, productId: id, unitCost: updated.costPrice, supplierId: updated.primarySupplierId ?? null, createdById: userId ?? null },
      });
      return updated;
    });
    return this.toProduct(record);
  }

  private async assertProductLinks(tx: Prisma.TransactionClient, tenantId: string, data: Record<string, any>) {
    this.requireTenant(tenantId);
    if (data.categoryId && !await tx.productCategory.findFirst({ where: { id: data.categoryId, tenantId } })) throw new BadRequestException('Category must belong to tenant');
    if (data.brandId && !await tx.productBrand.findFirst({ where: { id: data.brandId, tenantId, isActive: true } })) throw new BadRequestException('Brand must be active and belong to tenant');
    if (data.taxId && !await tx.localizationTax.findFirst({ where: { id: data.taxId, tenantId, isActive: true } })) throw new BadRequestException('Tax must be active and belong to tenant');
    if (data.primarySupplierId && !await tx.partner.findFirst({ where: { id: data.primarySupplierId, tenantId, status: 'ACTIVE', deletedAt: null, roles: { some: { role: 'SUPPLIER' } } } })) throw new BadRequestException('Supplier must be active and belong to tenant');
  }

  async generateProductBarcode(tenantId: string, id: string): Promise<Product> {
    const where = { id, tenantId, deletedAt: null };
    for (let attempt = 0; attempt < 10; attempt++) {
      const current = await this.prisma.product.findFirst({ where, include: productInclude });
      if (!current) throw new NotFoundException('Product not found');
      if (current.barcode?.trim()) return this.toProduct(current);
      try {
        const { count } = await this.prisma.product.updateMany({
          where: { ...where, barcode: current.barcode },
          data: { barcode: await this.nextInternalBarcode() },
        });
        if (count === 0) continue;
        const record = await this.prisma.product.findFirst({ where, include: productInclude });
        if (!record) throw new NotFoundException('Product not found');
        if (record.barcode?.trim()) return this.toProduct(record);
      } catch (error) {
        const barcodeConflict = error instanceof Prisma.PrismaClientKnownRequestError
          && error.code === 'P2002' && Array.isArray(error.meta?.target) && error.meta.target.includes('barcode');
        if (!barcodeConflict || attempt >= 9) throw error;
      }
    }
    throw new ConflictException('Product changed while generating barcode; try again');
  }

  private async nextInternalBarcode(): Promise<string> {
    try {
      const [row] = await this.prisma.$queryRaw<{ nextval: bigint }[]>`SELECT nextval('internal_barcode_seq')`;
      return buildInternalEan13(Number(row.nextval));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2010' && error.meta?.code === '2200H') {
        throw new ConflictException('Internal barcode sequence exhausted');
      }
      throw error;
    }
  }

  private toProduct(record: ProductRecord): Product {
    return Object.assign(new Product(record.id, record.tenantId, record.sku, record.name, record.description, record.categoryId, record.unitPrice, record.costPrice, record.taxId, record.isService, record.isActive, record.createdAt, record.updatedAt, record.deletedAt, record.barcode), {
      brandId: record.brandId,
      brand: record.brand?.name ?? '',
      category: record.category?.name ?? '',
      taxName: record.tax?.name ?? '',
      baseUnit: record.baseUnit,
      purchaseUnit: record.purchaseUnit,
      conversionFactor: record.conversionFactor,
      minStock: record.minStock,
      maxStock: record.maxStock,
      reorderPoint: record.reorderPoint,
      supplierSku: record.supplierSku,
      primarySupplierId: record.primarySupplierId,
      imageUrl: record.imageUrl,
    });
  }

  async softDeleteProduct(id: string, tenantId: string): Promise<void> {
    this.requireTenant(tenantId);
    await this.prisma.product.update({ where: { id, tenantId }, data: { deletedAt: new Date(), isActive: false } });
  }

  async createWarehouse(data: { tenantId: string; name: string; code?: string; branchId?: string }): Promise<Warehouse> {
    const record = await this.prisma.warehouse.create({ data: {
      tenantId: data.tenantId, name: data.name, code: data.code ?? null,
      branchId: data.branchId ?? null,
    } });
    return this.toWarehouse(record);
  }

  async findAllWarehouses(tenantId: string, includeInactive = false): Promise<Warehouse[]> {
    const records = await this.prisma.warehouse.findMany({
      where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: [{ name: 'asc' }],
    });
    return records.map((r) => this.toWarehouse(r));
  }

  async findWarehouseById(id: string): Promise<Warehouse | null> {
    const record = await this.prisma.warehouse.findUnique({ where: { id } });
    return record ? this.toWarehouse(record) : null;
  }

  async updateWarehouse(id: string, data: { name?: string; code?: string | null; branchId?: string | null; isActive?: boolean }): Promise<Warehouse> {
    const record = await this.prisma.warehouse.update({ where: { id }, data });
    return this.toWarehouse(record);
  }

  async softDeleteWarehouse(id: string): Promise<void> {
    await this.prisma.warehouse.update({ where: { id }, data: { isActive: false } });
  }

  async setDefaultWarehouse(tenantId: string, warehouseId: string): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { defaultWarehouseId: warehouseId },
    });
  }

  async getDefaultWarehouse(tenantId: string): Promise<Warehouse | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { defaultWarehouse: true },
    });
    return tenant?.defaultWarehouse ? this.toWarehouse(tenant.defaultWarehouse) : null;
  }

  async getWarehouseSummary(tenantId: string, warehouseId: string): Promise<WarehouseSummary> {
    const [warehouse, tenant, products] = await Promise.all([
      this.prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId }, select: { id: true } }),
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { baseCurrency: true } }),
      this.prisma.product.findMany({
        where: { tenantId, deletedAt: null, isActive: true, isService: false },
        select: {
          id: true, categoryId: true, costPrice: true,
          minStock: true, maxStock: true, reorderPoint: true,
          category: { select: { name: true } },
          stock: { where: { warehouseId }, select: { quantity: true } },
          reorderPoints: {
            where: { warehouseId, isActive: true },
            select: { minQuantity: true, maxQuantity: true },
          },
        },
      }),
    ]);

    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const health = { healthy: 0, low: 0, out: 0, overstock: 0 };
    const categoryMap = new Map<string | null, { categoryId: string | null; name: string | null; units: number; value: number }>();
    let skuCount = 0;
    let totalUnits = 0;
    let totalValue = 0;

    for (const product of products) {
      if (product.stock.length === 0) continue;
      const quantity = Math.max(0, product.stock.reduce((sum, s) => sum + s.quantity, 0));

      const local = product.reorderPoints[0];
      const minThreshold = local ? local.minQuantity : Math.max(product.minStock, product.reorderPoint);
      const maxThreshold = local ? local.maxQuantity : product.maxStock;

      if (quantity <= 0) health.out += 1;
      else if (maxThreshold !== null && quantity > maxThreshold) health.overstock += 1;
      else if (quantity <= minThreshold) health.low += 1;
      else health.healthy += 1;

      const value = quantity * product.costPrice;
      skuCount += 1;
      totalUnits = new Prisma.Decimal(totalUnits).plus(quantity).toNumber();
      totalValue += value;

      const entry = categoryMap.get(product.categoryId) ?? {
        categoryId: product.categoryId,
        name: product.category?.name ?? null,
        units: 0,
        value: 0,
      };
      entry.units = new Prisma.Decimal(entry.units).plus(quantity).toNumber();
      entry.value += value;
      categoryMap.set(product.categoryId, entry);
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;

    return {
      warehouseId,
      skuCount,
      totalUnits,
      totalValue: round2(totalValue),
      currency: tenant.baseCurrency,
      health,
      categories: Array.from(categoryMap.values())
        .map((c) => ({ ...c, value: round2(c.value) }))
        .sort((a, b) => b.value - a.value),
    };
  }

  async createStorageLocation(data: {
    tenantId: string; warehouseId: string; parentId: string | null;
    type: StorageLocationType; code: string; name?: string | null; path: string;
  }): Promise<StorageLocation> {
    const record = await this.serialTransaction(async tx => {
      await this.assertActiveWarehouse(tx, data.tenantId, data.warehouseId);
      const parent = data.parentId ? await tx.storageLocation.findFirst({ where: { id: data.parentId, tenantId: data.tenantId, warehouseId: data.warehouseId, isActive: true } }) : null;
      if (data.parentId && !parent) throw new BadRequestException('Parent location must be active and belong to warehouse');
      try { StorageLocation.assertValidParent(data.type, parent?.type ?? null); } catch (error) { throw new BadRequestException((error as Error).message); }
      if (!data.code.trim() || data.code.includes('/')) throw new BadRequestException('Invalid location code');
      return tx.storageLocation.create({ data: { ...data, path: StorageLocation.buildPath(parent?.path ?? null, data.code), name: data.name ?? null } });
    });
    return this.toStorageLocation(record);
  }

  async findStorageLocationById(id: string): Promise<StorageLocation | null> {
    const record = await this.prisma.storageLocation.findUnique({ where: { id } });
    return record ? this.toStorageLocation(record) : null;
  }

  async findStorageLocationByPath(warehouseId: string, path: string): Promise<StorageLocation | null> {
    const record = await this.prisma.storageLocation.findUnique({
      where: { warehouseId_path: { warehouseId, path } },
    });
    return record ? this.toStorageLocation(record) : null;
  }

  async findStorageLocationsByWarehouse(warehouseId: string): Promise<StorageLocation[]> {
    const records = await this.prisma.storageLocation.findMany({
      where: { warehouseId },
      orderBy: [{ path: 'asc' }],
    });
    return records.map((r) => this.toStorageLocation(r));
  }

  async findStorageLocationSiblings(
    warehouseId: string,
    parentId: string | null,
  ): Promise<StorageLocation[]> {
    const records = await this.prisma.storageLocation.findMany({
      where: { warehouseId, parentId },
      orderBy: [{ path: 'asc' }],
    });
    return records.map((r) => this.toStorageLocation(r));
  }

  async findStorageLocationChildren(parentId: string): Promise<StorageLocation[]> {
    const records = await this.prisma.storageLocation.findMany({
      where: { parentId },
      orderBy: [{ path: 'asc' }],
    });
    return records.map((r) => this.toStorageLocation(r));
  }

  async updateStorageLocation(id: string, data: { code?: string; name?: string | null; isActive?: boolean; path?: string }): Promise<StorageLocation> {
    const record = await this.prisma.storageLocation.update({ where: { id }, data });
    return this.toStorageLocation(record);
  }

  async softDeleteStorageLocation(id: string): Promise<void> {
    await this.prisma.storageLocation.update({ where: { id }, data: { isActive: false } });
  }

  private async assertActiveWarehouse(tx: Prisma.TransactionClient, tenantId: string, id: string) {
    this.requireTenant(tenantId);
    const warehouse = await tx.warehouse.findFirst({ where: { id, tenantId, isActive: true } });
    if (!warehouse) throw new BadRequestException('Warehouse must be active and belong to tenant');
    if (warehouse.branchId && !await tx.branch.findFirst({ where: { id: warehouse.branchId, tenantId, isActive: true } })) throw new BadRequestException('Branch must be active and belong to tenant');
    return warehouse;
  }

  async rewriteStorageLocation(id: string, tenantId: string, data: { code?: string; name?: string | null; isActive?: boolean }): Promise<StorageLocation> {
    this.requireTenant(tenantId);
    return this.serialTransaction(async tx => {
      const location = await tx.storageLocation.findFirst({ where: { id, tenantId } });
      if (!location) throw new NotFoundException('Storage location not found');
      const nodes = await tx.storageLocation.findMany({ where: { tenantId, warehouseId: location.warehouseId } });
      if (data.isActive === false && nodes.some(node => node.parentId === id && node.isActive)) throw new BadRequestException('No se puede desactivar una ubicación con hijos activos');
      if (data.isActive === true || data.code !== undefined) {
        await this.assertActiveWarehouse(tx, tenantId, location.warehouseId);
        let parentId = location.parentId;
        const visited = new Set([id]);
        while (parentId) {
          const parent = nodes.find(node => node.id === parentId);
          if (!parent || !parent.isActive || visited.has(parentId)) throw new BadRequestException('All parent locations must be active');
          visited.add(parentId); parentId = parent.parentId;
        }
      }
      const parent = nodes.find(node => node.id === location.parentId);
      const code = data.code?.trim() ?? location.code;
      if (!code || code.includes('/')) throw new BadRequestException('Invalid location code');
      const path = StorageLocation.buildPath(parent?.path ?? null, code);
      const updated = await tx.storageLocation.update({ where: { id, tenantId }, data: { ...data, code, path } });
      if (path !== location.path) {
        for (const node of nodes.filter(node => node.path.startsWith(`${location.path}/`))) {
          await tx.storageLocation.update({ where: { id: node.id, tenantId }, data: { path: `${path}${node.path.slice(location.path.length)}` } });
        }
      }
      return this.toStorageLocation(updated);
    });
  }

  async generateStorageLocations(tenantId: string, warehouseId: string, input: { aisles: number; shelves: number; levels: number; bins: number }): Promise<{ created: number; total: number }> {
    this.requireTenant(tenantId);
    const shelfCount = input.aisles * input.shelves;
    const levelCount = shelfCount * input.levels;
    if (![input.aisles, input.shelves, input.levels, input.bins].every(n => Number.isSafeInteger(n) && n > 0) || input.aisles + shelfCount + levelCount + levelCount * input.bins > 5000) throw new BadRequestException('Location generation exceeds 5000 nodes or contains invalid counts');
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.serialTransaction(async tx => {
          await this.assertActiveWarehouse(tx, tenantId, warehouseId);
          const existing = await tx.storageLocation.findMany({ where: { tenantId, warehouseId } });
          const byPath = new Map(existing.map(node => [node.path, { id: node.id, path: node.path, type: node.type, isActive: node.isActive }]));
          const added: Prisma.StorageLocationCreateManyInput[] = [];
          const ensure = (type: StorageLocationType, index: number, parent: { id: string; path: string } | null) => {
            const code = StorageLocation.codeForIndex(type, index);
            const path = StorageLocation.buildPath(parent?.path ?? null, code);
            const found = byPath.get(path);
            if (found) {
              if (!found.isActive || found.type !== type) throw new BadRequestException('Existing generated location must be active and have the expected type');
              return found;
            }
            const node = { id: crypto.randomUUID(), path, type, isActive: true };
            added.push({ ...node, code, tenantId, warehouseId, parentId: parent?.id ?? null });
            byPath.set(path, node);
            return node;
          };
          for (let a = 0; a < input.aisles; a++) {
            const aisle = ensure('AISLE', a, null);
            for (let s = 0; s < input.shelves; s++) {
              const shelf = ensure('SHELF', s, aisle);
              for (let l = 0; l < input.levels; l++) {
                const level = ensure('LEVEL', l, shelf);
                for (let b = 0; b < input.bins; b++) ensure('BIN', b, level);
              }
            }
          }
          if (added.length) await tx.storageLocation.createMany({ data: added });
          return { created: added.length, total: existing.length + added.length };
        });
      } catch (error: any) {
        if (error?.code !== 'P2002' || attempt >= 3) throw error;
      }
    }
  }

  private toWarehouse(record: {
    id: string; tenantId: string; name: string; branchId: string | null;
    code: string | null; isActive: boolean; createdAt: Date;
  }): Warehouse {
    return new Warehouse(record.id, record.tenantId, record.name, record.branchId, record.code, record.isActive, record.createdAt);
  }

  private toStorageLocation(record: {
    id: string; tenantId: string; warehouseId: string; parentId: string | null;
    type: StorageLocationType; code: string; name: string | null; path: string;
    isActive: boolean; createdAt: Date; updatedAt: Date;
  }): StorageLocation {
    return new StorageLocation(
      record.id, record.tenantId, record.warehouseId, record.parentId,
      record.type, record.code, record.name, record.path,
      record.isActive, record.createdAt, record.updatedAt,
    );
  }

  async createBranch(data: { tenantId: string; name: string; code?: string; address?: string; city?: string; state?: string; phone?: string; managerEmployeeId?: string }): Promise<Branch> {
    const record = await this.prisma.branch.create({ data: {
      tenantId: data.tenantId, name: data.name, code: data.code ?? null,
      address: data.address ?? null, city: data.city ?? null, state: data.state ?? null,
      phone: data.phone ?? null, managerEmployeeId: data.managerEmployeeId ?? null,
    } });
    return new Branch(record.id, record.tenantId, record.name, record.code, record.address, record.city, record.state, record.phone, record.managerEmployeeId, record.isActive, record.createdAt);
  }

  async findAllBranches(tenantId: string, includeInactive = false): Promise<Branch[]> {
    const records = await this.prisma.branch.findMany({
      where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: [{ name: 'asc' }],
    });
    return records.map(r => new Branch(r.id, r.tenantId, r.name, r.code, r.address, r.city, r.state, r.phone, r.managerEmployeeId, r.isActive, r.createdAt));
  }

  async findBranchById(id: string): Promise<Branch | null> {
    const record = await this.prisma.branch.findUnique({ where: { id } });
    if (!record) return null;
    return new Branch(record.id, record.tenantId, record.name, record.code, record.address, record.city, record.state, record.phone, record.managerEmployeeId, record.isActive, record.createdAt);
  }

  async updateBranch(id: string, data: { name?: string; code?: string | null; address?: string | null; city?: string | null; state?: string | null; phone?: string | null; managerEmployeeId?: string | null; isActive?: boolean }): Promise<Branch> {
    const record = await this.prisma.branch.update({ where: { id }, data });
    return new Branch(record.id, record.tenantId, record.name, record.code, record.address, record.city, record.state, record.phone, record.managerEmployeeId, record.isActive, record.createdAt);
  }

  async softDeleteBranch(id: string): Promise<void> {
    await this.prisma.branch.update({ where: { id }, data: { isActive: false } });
  }

  async countActiveWarehousesByBranch(branchId: string): Promise<number> {
    return this.prisma.warehouse.count({ where: { branchId, isActive: true } });
  }

  async employeeBelongsToTenant(tenantId: string, employeeId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId, deletedAt: null },
      select: { id: true },
    });
    return employee !== null;
  }

  async getStock(productId: string, warehouseId: string, tenantId: string): Promise<Stock | null> {
    this.requireTenant(tenantId);
    const record = await this.prisma.stock.findFirst({
      where: { productId, warehouseId, product: { tenantId }, warehouse: { tenantId } },
    });
    return record ? this.toStock(record) : null;
  }

  private requireTenant(tenantId: string): void {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
  }

  private toStock(record: { id: string; productId: string; warehouseId: string; quantity: number; createdAt: Date; updatedAt: Date }): Stock {
    return new Stock(record.id, record.productId, record.warehouseId, record.quantity, record.createdAt, record.updatedAt);
  }

  private async assertStockResources(tx: Prisma.TransactionClient, tenantId: string, productId: string, warehouseId: string): Promise<void> {
    this.requireTenant(tenantId);
    const product = await tx.product.findFirst({ where: { id: productId, tenantId, deletedAt: null, isActive: true, isService: false } });
    if (!product) throw new NotFoundException('Active stock product not found');
    const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, tenantId, isActive: true } });
    if (!warehouse) throw new NotFoundException('Active warehouse not found');
    if (warehouse.branchId) {
      const branch = await tx.branch.findFirst({ where: { id: warehouse.branchId, tenantId, isActive: true } });
      if (!branch) throw new BadRequestException('Warehouse branch must be active and belong to tenant');
    }
  }

  private async serialTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
      } catch (error: any) {
        if (error?.code !== 'P2034' || attempt >= 3) throw error;
      }
    }
  }

  async adjustStockAtomic(data: StockAdjustmentInput): Promise<Stock> {
    this.requireTenant(data.tenantId);
    if (!Number.isFinite(data.quantity) || data.quantity <= 0) throw new BadRequestException('Quantity must be positive and finite');
    if (!['in', 'out'].includes(data.type)) throw new BadRequestException('Invalid adjustment type');
    const operationKey = data.operationId ? JSON.stringify([data.tenantId, data.operationId]) : null;
    const replay = (movement: Prisma.StockMovementGetPayload<{}>): Stock => {
      if (movement.productId !== data.productId || movement.warehouseId !== data.warehouseId || movement.type !== data.type || movement.quantity !== data.quantity
        || movement.referenceType !== (data.referenceType ?? 'adjustment') || movement.referenceId !== (data.referenceId ?? data.reason ?? null)) {
        throw new ConflictException('Operation ID already used for a different stock effect');
      }
      return new Stock(movement.id, movement.productId, movement.warehouseId, movement.balanceAfter!, movement.createdAt, movement.createdAt);
    };
    try {
      return await this.serialTransaction(async (tx) => {
        await this.assertStockResources(tx, data.tenantId, data.productId, data.warehouseId);
        if (operationKey) {
          const existing = await tx.stockMovement.findUnique({ where: { operationKey } });
          if (existing) return replay(existing);
        }
        const where = { productId: data.productId, warehouseId: data.warehouseId };
        await tx.stock.upsert({ where: { productId_warehouseId: where }, update: {}, create: { ...where, quantity: 0 } });
        const delta = data.type === 'in' ? data.quantity : -data.quantity;
        const updated = await tx.stock.updateMany({
          where: { ...where, quantity: data.expectedQuantity !== undefined ? data.expectedQuantity : data.type === 'out' ? { gte: data.quantity } : undefined },
          data: { quantity: { increment: delta } },
        });
        if (updated.count !== 1) {
          if (data.expectedQuantity !== undefined) throw new ConflictException('Stock changed since physical count; reload and recount');
          throw new BadRequestException('Insufficient stock');
        }
        const stock = await tx.stock.findUniqueOrThrow({ where: { productId_warehouseId: where } });
        if (stock.quantity < 0) throw new BadRequestException('Insufficient stock');
        const lotId = await this.applyLotDelta(tx, data, delta, stock.quantity);
        await tx.stockMovement.create({ data: {
          ...where, type: data.type, quantity: data.quantity, operationKey,
          referenceType: data.referenceType ?? 'adjustment', referenceId: data.referenceId ?? data.reason ?? null,
          userId: data.userId ?? null, lotId,
          balanceBefore: stock.quantity - delta, balanceAfter: stock.quantity,
        } });
        return this.toStock(stock);
      });
    } catch (error: any) {
      // A concurrent attempt may win the unique key. Its loser rolls back all effects.
      if (operationKey && error?.code === 'P2002') {
        const existing = await this.prisma.stockMovement.findUnique({ where: { operationKey } });
        if (existing) return replay(existing);
      }
      throw error;
    }
  }

  private async applyLotDelta(tx: Prisma.TransactionClient, data: StockAdjustmentInput, delta: number, balanceAfter: number): Promise<string | null> {
    const tracked = !!(data.lotNumber || data.serialNumber || data.expirationDate);
    const where = { tenantId: data.tenantId, productId: data.productId, warehouseId: data.warehouseId };
    if (!tracked) {
      if (delta < 0) {
        const lots = await tx.stockLot.findMany({ where: { ...where, quantity: { gt: 0 } }, select: { quantity: true } });
        if (lots.reduce((sum, lot) => sum + lot.quantity, 0) > balanceAfter) throw new BadRequestException('Select a lot: unallocated stock is insufficient');
      }
      return null;
    }
    const lotNumber = data.lotNumber?.trim() || data.serialNumber?.trim() || 'SIN_LOTE';
    const metadata = {
      ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
      ...(data.expirationDate !== undefined ? { expirationDate: new Date(data.expirationDate) } : {}),
    };
    if (delta < 0) {
      const updated = await tx.stockLot.updateMany({ where: { ...where, lotNumber, quantity: { gte: -delta } }, data: { quantity: { increment: delta }, ...metadata } });
      if (updated.count !== 1) throw new BadRequestException('Insufficient stock in selected lot');
      const lot = await tx.stockLot.findFirstOrThrow({ where: { ...where, lotNumber } });
      return lot.id;
    }
    const lot = await tx.stockLot.upsert({
      where: { productId_warehouseId_lotNumber: { productId: data.productId, warehouseId: data.warehouseId, lotNumber } },
      update: { quantity: { increment: delta }, ...metadata },
      create: { ...where, lotNumber, quantity: delta, ...metadata },
    });
    if (lot.tenantId !== data.tenantId) throw new BadRequestException('Lot does not belong to tenant');
    return lot.id;
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

  async findMovements(productId: string, warehouseId: string, tenantId: string): Promise<StockMovement[]> {
    this.requireTenant(tenantId);
    const [product, warehouse] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: productId, tenantId } }),
      this.prisma.warehouse.findFirst({ where: { id: warehouseId, tenantId } }),
    ]);
    if (!product || !warehouse) throw new NotFoundException('Stock resource not found');
    const records = await this.prisma.stockMovement.findMany({
      where: { productId, warehouseId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(r => new StockMovement(r.id, r.productId, r.warehouseId, r.type as any, r.quantity, r.referenceId, r.referenceType, r.createdAt, r.userId));
  }

  async findAllMovements(tenantId: string, filter: MovementFilter = {}): Promise<{ items: any[]; total: number; page: number; pageSize: number }> {
    this.requireTenant(tenantId);
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 50;
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 500) throw new BadRequestException('Invalid pagination');
    const from = filter.dateFrom ? new Date(filter.dateFrom) : undefined;
    const to = filter.dateTo ? new Date(filter.dateTo) : undefined;
    if ((from && !Number.isFinite(from.getTime())) || (to && !Number.isFinite(to.getTime()))) throw new BadRequestException('Invalid movement date filter');
    // Date-only upper bounds include the entire day.
    if (to && /^\d{4}-\d{2}-\d{2}$/.test(filter.dateTo!)) to.setUTCHours(23, 59, 59, 999);
    if (from && to && from > to) throw new BadRequestException('Invalid movement date range');
    const [products, warehouses, users] = await Promise.all([
      this.prisma.product.findMany({ where: { tenantId }, select: { id: true, name: true, sku: true } }),
      this.prisma.warehouse.findMany({ where: { tenantId }, select: { id: true, name: true, code: true, branchId: true } }),
      this.prisma.user.findMany({ where: { tenantId }, select: { id: true, name: true } }),
    ]);
    const productIds = products.filter(p => !filter.productId || p.id === filter.productId).map(p => p.id);
    const warehouseIds = warehouses.filter(w => (!filter.warehouseId || w.id === filter.warehouseId) && (!filter.branchId || w.branchId === filter.branchId)).map(w => w.id);
    const search = filter.search?.trim();
    const matchingProducts = search ? products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())).map(p => p.id) : [];
    const where: Prisma.StockMovementWhereInput = {
      productId: { in: productIds }, warehouseId: { in: warehouseIds },
      ...(filter.type ? { type: filter.type } : {}),
      ...(from || to ? { createdAt: { gte: from, lte: to } } : {}),
      ...(search ? { OR: [{ productId: { in: matchingProducts } }, { referenceId: { contains: search, mode: 'insensitive' } }, { referenceType: { contains: search, mode: 'insensitive' } }] } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.stockMovement.count({ where }),
    ]);
    const productMap = new Map(products.map(p => [p.id, p]));
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    const userMap = new Map(users.map(u => [u.id, u]));
    return { items: records.map(record => ({ ...record, product: productMap.get(record.productId) ?? null, warehouse: warehouseMap.get(record.warehouseId) ?? null, userName: record.userId ? userMap.get(record.userId)?.name ?? record.userId : 'Sistema' })), total, page, pageSize };
  }

  // Transfers
  async createTransfer(data: { tenantId: string; fromWarehouseId: string; toWarehouseId: string; productId: string; quantity: number; notes?: string; lotNumber?: string }): Promise<StockTransfer> {
    const r = await this.prisma.stockTransfer.create({
      data: { ...data, notes: data.notes ?? null },
    });
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt, r.lotNumber);
  }

  async findTransfersByTenant(tenantId: string): Promise<StockTransfer[]> {
    const records = await this.prisma.stockTransfer.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt, r.lotNumber));
  }

  async findTransferById(id: string): Promise<StockTransfer | null> {
    const r = await this.prisma.stockTransfer.findUnique({ where: { id } });
    if (!r) return null;
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt, r.lotNumber);
  }

  async completeTransfer(id: string, tenantId: string, userId?: string): Promise<StockTransfer> {
    this.requireTenant(tenantId);
    return this.serialTransaction(async (tx) => {
      const transfer = await tx.stockTransfer.findFirst({ where: { id, tenantId } });
      if (!transfer) throw new NotFoundException('Transfer not found');
      if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be completed');
      await this.assertStockResources(tx, tenantId, transfer.productId, transfer.fromWarehouseId);
      await this.assertStockResources(tx, tenantId, transfer.productId, transfer.toWarehouseId);

      const pendingClaim = await tx.stockTransfer.updateMany({
        where: { id, tenantId, status: 'pending' },
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
      const source = await tx.stock.findUniqueOrThrow({ where: { productId_warehouseId: { productId: transfer.productId, warehouseId: transfer.fromWarehouseId } } });
      const destination = await tx.stock.upsert({
        where: { productId_warehouseId: { productId: transfer.productId, warehouseId: transfer.toWarehouseId } },
        update: { quantity: { increment: transfer.quantity } },
        create: { productId: transfer.productId, warehouseId: transfer.toWarehouseId, quantity: transfer.quantity },
      });
      const sourceLotId = await this.applyLotDelta(tx, {
        tenantId, productId: transfer.productId, warehouseId: transfer.fromWarehouseId, type: 'out', quantity: transfer.quantity,
        lotNumber: transfer.lotNumber ?? undefined,
      }, -transfer.quantity, source.quantity);
      const sourceLot = sourceLotId ? await tx.stockLot.findUniqueOrThrow({ where: { id: sourceLotId } }) : null;
      const destinationLotId = sourceLot ? await this.applyLotDelta(tx, {
        tenantId, productId: transfer.productId, warehouseId: transfer.toWarehouseId, type: 'in', quantity: transfer.quantity,
        lotNumber: sourceLot.lotNumber ?? undefined, serialNumber: sourceLot.serialNumber ?? undefined, expirationDate: sourceLot.expirationDate?.toISOString(),
      }, transfer.quantity, destination.quantity) : null;
      await tx.stockMovement.createMany({
        data: [
          {
            productId: transfer.productId,
            warehouseId: transfer.fromWarehouseId,
            type: 'out',
            quantity: transfer.quantity,
            userId, lotId: sourceLotId, balanceBefore: source.quantity + transfer.quantity, balanceAfter: source.quantity,
            referenceType: 'transfer',
            referenceId: transfer.id,
          },
          {
            productId: transfer.productId,
            warehouseId: transfer.toWarehouseId,
            type: 'in',
            quantity: transfer.quantity,
            userId, lotId: destinationLotId, balanceBefore: destination.quantity - transfer.quantity, balanceAfter: destination.quantity,
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
        completed.lotNumber,
      );
    });
  }

  async cancelTransfer(id: string, tenantId: string): Promise<StockTransfer> {
    this.requireTenant(tenantId);
    const r = await this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.stockTransfer.updateMany({
        where: { id, tenantId, status: 'pending' },
        data: { status: 'cancelled' },
      });
      if (cancelled.count !== 1) {
        throw new BadRequestException('Only pending transfers can be cancelled');
      }
      return tx.stockTransfer.findUniqueOrThrow({ where: { id } });
    });
    return new StockTransfer(r.id, r.tenantId, r.fromWarehouseId, r.toWarehouseId, r.productId, r.quantity, r.status, r.notes, r.createdAt, r.completedAt, r.lotNumber);
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

  async findReorderPointById(id: string, tenantId: string): Promise<ReorderPoint | null> {
    this.requireTenant(tenantId);
    const r = await this.prisma.reorderPoint.findFirst({ where: { id, tenantId } });
    return r ? new ReorderPoint(r.id, r.tenantId, r.productId, r.warehouseId, r.minQuantity, r.maxQuantity, r.isActive, r.createdAt, r.updatedAt) : null;
  }

  async updateReorderPoint(id: string, data: Partial<{ minQuantity: number; maxQuantity: number; isActive: boolean }>, tenantId: string): Promise<ReorderPoint> {
    this.requireTenant(tenantId);
    const r = await this.prisma.reorderPoint.update({ where: { id, tenantId }, data });
    return new ReorderPoint(r.id, r.tenantId, r.productId, r.warehouseId, r.minQuantity, r.maxQuantity, r.isActive, r.createdAt, r.updatedAt);
  }

  async deleteReorderPoint(id: string, tenantId: string): Promise<void> {
    this.requireTenant(tenantId);
    await this.prisma.reorderPoint.deleteMany({ where: { id, tenantId } });
  }

  async findLowStock(tenantId: string): Promise<Array<{ productId: string; warehouseId: string; currentQuantity: number; minQuantity: number; maxQuantity: number; suggestedQuantity: number; productName: string; productSku: string | null; warehouseName: string }>> {
    this.requireTenant(tenantId);
    const reorderPoints = await this.prisma.reorderPoint.findMany({
      where: { tenantId, isActive: true },
      include: {
        product: { select: { name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
    });
    const result: Array<{ productId: string; warehouseId: string; currentQuantity: number; minQuantity: number; maxQuantity: number; suggestedQuantity: number; productName: string; productSku: string | null; warehouseName: string }> = [];
    for (const rp of reorderPoints) {
      const stock = await this.prisma.stock.findUnique({
        where: { productId_warehouseId: { productId: rp.productId, warehouseId: rp.warehouseId } },
      });
      const currentQuantity = stock ? stock.quantity : 0;
      if (currentQuantity <= rp.minQuantity) {
        result.push({
          productId: rp.productId,
          warehouseId: rp.warehouseId,
          currentQuantity,
          minQuantity: rp.minQuantity,
          maxQuantity: rp.maxQuantity,
          suggestedQuantity: Math.max(0, rp.maxQuantity - currentQuantity),
          productName: rp.product.name,
          productSku: rp.product.sku,
          warehouseName: rp.warehouse.name,
        });
      }
    }
    return result.sort((a, b) => a.productName.localeCompare(b.productName) || a.warehouseName.localeCompare(b.warehouseName));
  }
}
