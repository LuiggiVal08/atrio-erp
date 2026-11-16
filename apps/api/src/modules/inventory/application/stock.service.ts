import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository, MovementFilter, StockAdjustmentInput } from '../domain/inventory.repository.interface';

@Injectable()
export class StockService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async getBalance(tenantId: string, productId: string, warehouseId: string) {
    await this.ensureResources(tenantId, productId, warehouseId);
    const stock = await this.repo.getStock(productId, warehouseId, tenantId);
    const quantity = stock?.quantity ?? 0;
    const committedQuantity = stock?.committedQuantity ?? 0;
    return { productId, warehouseId, quantity, committedQuantity, availableQuantity: Math.max(0, quantity - committedQuantity) };
  }

  async adjust(data: StockAdjustmentInput) {
    if (!data.tenantId) throw new BadRequestException('Tenant context is required');
    if (!Number.isFinite(data.quantity) || data.quantity <= 0) throw new BadRequestException('Quantity must be positive and finite');
    if (!['in', 'out'].includes(data.type)) throw new BadRequestException('Invalid adjustment type');
    if (data.expirationDate !== undefined && (!data.expirationDate || !Number.isFinite(Date.parse(data.expirationDate)))) throw new BadRequestException('Invalid expiration date');
    if (data.expectedQuantity !== undefined && (!Number.isFinite(data.expectedQuantity) || data.expectedQuantity < 0)) throw new BadRequestException('Expected quantity must be nonnegative and finite');
    if (data.operationId !== undefined && !data.operationId.trim()) throw new BadRequestException('Operation ID cannot be blank');
    // No legacy fallback: separate balance/lot/movement writes are unsafe.
    return this.repo.adjustStockAtomic(data);
  }

  async getMovements(tenantId: string, productId: string, warehouseId: string) {
    await this.ensureResources(tenantId, productId, warehouseId);
    return this.repo.findMovements(productId, warehouseId, tenantId);
  }

  async getBalances(tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    return this.repo.findStockBalances(tenantId);
  }

  async getAllMovements(tenantId: string, filter?: MovementFilter) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    return this.repo.findAllMovements(tenantId, filter);
  }

  private async ensureResources(tenantId: string, productId: string, warehouseId: string) {
    if (!tenantId) throw new BadRequestException('Tenant context is required');
    const [product, warehouse] = await Promise.all([this.repo.findProductById(productId, tenantId), this.repo.findWarehouseById(warehouseId)]);
    if (!product || product.tenantId !== tenantId) throw new NotFoundException('Product not found');
    if (!warehouse || warehouse.tenantId !== tenantId) throw new NotFoundException('Warehouse not found');
  }
}
