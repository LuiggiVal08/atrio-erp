import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class ReorderPointService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async set(data: { tenantId: string; productId: string; warehouseId: string; minQuantity: number; maxQuantity: number }) {
    this.validateRange(data.minQuantity, data.maxQuantity);
    const [product, warehouse] = await Promise.all([
      this.repo.findProductById(data.productId, data.tenantId),
      this.repo.findWarehouseById(data.warehouseId),
    ]);
    if (!product || product.tenantId !== data.tenantId || !product.isActive || product.isService || !warehouse || warehouse.tenantId !== data.tenantId || !warehouse.isActive) {
      throw new NotFoundException('Active stock resources not found');
    }
    return this.repo.setReorderPoint(data);
  }

  private validateRange(min: number, max: number) {
    if (!Number.isFinite(min) || min < 0) throw new BadRequestException('Minimum quantity must be >= 0');
    if (!Number.isFinite(max) || max <= min) throw new BadRequestException('Maximum quantity must be greater than minimum');
  }

  async findAll(tenantId: string) {
    return this.repo.findReorderPointsByTenant(tenantId);
  }

  async findOne(tenantId: string, productId: string, warehouseId: string) {
    const point = await this.repo.findReorderPoint(productId, warehouseId);
    if (!point || point.tenantId !== tenantId) throw new NotFoundException('Reorder point not found');
    return point;
  }

  async update(tenantId: string, id: string, data: { minQuantity?: number; maxQuantity?: number; isActive?: boolean }) {
    const point = await this.repo.findReorderPointById(id, tenantId);
    if (!point || point.tenantId !== tenantId) throw new NotFoundException('Reorder point not found');
    this.validateRange(data.minQuantity ?? point.minQuantity, data.maxQuantity ?? point.maxQuantity);
    return this.repo.updateReorderPoint(id, data, tenantId);
  }

  async delete(tenantId: string, id: string) {
    const point = await this.repo.findReorderPointById(id, tenantId);
    if (!point || point.tenantId !== tenantId) throw new NotFoundException('Reorder point not found');
    return this.repo.deleteReorderPoint(id, tenantId);
  }

  async findLowStock(tenantId: string) {
    return this.repo.findLowStock(tenantId);
  }
}
