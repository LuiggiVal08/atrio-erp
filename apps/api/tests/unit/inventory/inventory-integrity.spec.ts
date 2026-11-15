import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { ProductService } from '../../../src/modules/inventory/application/product.service';
import { ProductCategoryService } from '../../../src/modules/inventory/application/product-category.service';
import { WarehouseService } from '../../../src/modules/inventory/application/warehouse.service';
import { StorageLocationService } from '../../../src/modules/inventory/application/storage-location.service';
import { AdjustStockDto, CreateProductDto, UpdateProductDto } from '../../../src/modules/inventory/infrastructure/dto/inventory.dto';

it('accepts fractional positive adjustments and rejects type/date/zero/nonfinite quantities', async () => {
  expect(await validate(Object.assign(new AdjustStockDto(), { type: 'in', quantity: 0.01 }))).toHaveLength(0);
  for (const fields of [{ type: 'bad', quantity: 1 }, { type: 'in', quantity: 0 }, { type: 'in', quantity: Infinity }, { type: 'in', quantity: 1, expirationDate: 'bad' }]) {
    expect((await validate(Object.assign(new AdjustStockDto(), fields))).length).toBeGreaterThan(0);
  }
});

it('rejects barcodes unsupported by CODE128 at both API write boundaries', async () => {
  const create = { sku: 'SKU', name: 'Producto', unitPrice: 1, costPrice: 0, isService: false };
  for (const barcode of ['PRODUCTO-Ñ', 'SKU\n001', '商品', '\u0000']) {
    const created = await validate(Object.assign(new CreateProductDto(), { ...create, barcode }));
    const updated = await validate(Object.assign(new UpdateProductDto(), { barcode }));
    expect(created.some(error => error.property === 'barcode')).toBe(true);
    expect(updated.some(error => error.property === 'barcode')).toBe(true);
  }
  for (const barcode of ['SKU-001', '2000000000015', '']) {
    expect(await validate(Object.assign(new CreateProductDto(), { ...create, barcode }))).toHaveLength(0);
    expect(await validate(Object.assign(new UpdateProductDto(), { barcode }))).toHaveLength(0);
  }
  expect(await validate(Object.assign(new UpdateProductDto(), { barcode: null }))).toHaveLength(0);
});

it('rejects null for required product thresholds', async () => {
  expect((await validate(Object.assign(new UpdateProductDto(), { minStock: null, reorderPoint: null }))).length).toBe(2);
});

it('rejects product belonging to a different tenant', async () => {
  const repo: any = { findProductById: jest.fn().mockResolvedValue({ id: 'p1', tenantId: 't2' }), updateProduct: jest.fn() };
  await expect(new ProductService(repo).update('t1', 'p1', { name: 'bad' })).rejects.toBeInstanceOf(NotFoundException);
  expect(repo.updateProduct).not.toHaveBeenCalled();
});

it('rejects a category cycle and accepts null to detach its parent', async () => {
  const repo: any = { findAllCategories: jest.fn().mockResolvedValue([{ id: 'c1', parentId: null }, { id: 'c2', parentId: 'c1' }]), updateCategory: jest.fn() };
  const service = new ProductCategoryService(repo);
  await expect(service.update('t1', 'c1', { parentId: 'c2' })).rejects.toBeInstanceOf(BadRequestException);
  await service.update('t1', 'c2', { parentId: null });
  expect(repo.updateCategory).toHaveBeenCalledWith('c2', { parentId: null }, 't1');
});

it('blocks PATCH deactivation of default warehouse', async () => {
  const repo: any = { findWarehouseById: jest.fn().mockResolvedValue({ id: 'w1', tenantId: 't1', isActive: true }), getDefaultWarehouse: jest.fn().mockResolvedValue({ id: 'w1' }), updateWarehouse: jest.fn() };
  await expect(new WarehouseService(repo).update('t1', 'w1', { isActive: false })).rejects.toBeInstanceOf(BadRequestException);
  expect(repo.updateWarehouse).not.toHaveBeenCalled();
});

it('blocks warehouse reactivation under inactive branch', async () => {
  const repo: any = { findWarehouseById: jest.fn().mockResolvedValue({ id: 'w1', tenantId: 't1', isActive: false, branchId: 'b1' }), findBranchById: jest.fn().mockResolvedValue({ id: 'b1', tenantId: 't1', isActive: false }), updateWarehouse: jest.fn() };
  await expect(new WarehouseService(repo).update('t1', 'w1', { isActive: true })).rejects.toBeInstanceOf(BadRequestException);
});

it('counts all generator nodes, not only bins', async () => {
  const repo: any = { findWarehouseById: jest.fn().mockResolvedValue({ id: 'w1', tenantId: 't1', isActive: true }), generateStorageLocations: jest.fn() };
  await expect(new StorageLocationService(repo).generate('t1', 'w1', { aisles: 20, shelves: 50, levels: 2, bins: 1 })).rejects.toBeInstanceOf(BadRequestException);
  expect(repo.generateStorageLocations).not.toHaveBeenCalled();
});
