import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class ReorderPointService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async set(data: { tenantId: string; productId: string; warehouseId: string; minQuantity: number; maxQuantity: number }) {
    if (data.minQuantity < 0) throw new BadRequestException('Minimum quantity must be >= 0');
    if (data.maxQuantity <= data.minQuantity) throw new BadRequestException('Maximum quantity must be greater than minimum');
    return this.repo.setReorderPoint(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findReorderPointsByTenant(tenantId);
  }

  async findOne(productId: string, warehouseId: string) {
    const point = await this.repo.findReorderPoint(productId, warehouseId);
    if (!point) throw new NotFoundException('Reorder point not found');
    return point;
  }

  async update(id: string, data: { minQuantity?: number; maxQuantity?: number; isActive?: boolean }) {
    if (data.minQuantity !== undefined && data.minQuantity < 0) throw new BadRequestException('Minimum quantity must be >= 0');
    return this.repo.updateReorderPoint(id, data);
  }

  async delete(id: string) {
    return this.repo.deleteReorderPoint(id);
  }

  async findLowStock(tenantId: string) {
    return this.repo.findLowStock(tenantId);
  }
}
