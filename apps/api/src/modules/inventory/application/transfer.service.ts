import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class TransferService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: {
    tenantId: string; fromWarehouseId: string; toWarehouseId: string;
    productId: string; quantity: number; notes?: string; lotNumber?: string;
  }) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }
    if (!Number.isFinite(data.quantity) || data.quantity <= 0) throw new BadRequestException('Quantity must be positive');

    const [product, source, destination] = await Promise.all([
      this.repo.findProductById(data.productId, data.tenantId),
      this.repo.findWarehouseById(data.fromWarehouseId),
      this.repo.findWarehouseById(data.toWarehouseId),
    ]);
    if (!product || !product.isActive || product.isService || !source || !destination || source.tenantId !== data.tenantId || destination.tenantId !== data.tenantId || !source.isActive || !destination.isActive) {
      throw new NotFoundException('Active transfer resources not found');
    }
    const stock = await this.repo.getStock(data.productId, data.fromWarehouseId, data.tenantId);
    const available = stock ? (stock.availableQuantity ?? stock.quantity - (stock.committedQuantity ?? 0)) : 0;
    if (!stock || available < data.quantity) {
      throw new BadRequestException('Insufficient stock in source warehouse');
    }

    return this.repo.createTransfer(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findTransfersByTenant(tenantId);
  }

  async findById(tenantId: string, id: string) {
    const transfer = await this.repo.findTransferById(id);
    if (!transfer || transfer.tenantId !== tenantId) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  async dispatch(tenantId: string, id: string, userId?: string) {
    const transfer = await this.findById(tenantId, id);
    if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be dispatched');
    return this.repo.dispatchTransfer(id, tenantId, userId);
  }

  async receive(tenantId: string, id: string, data: { quantity: number; closeShortage?: boolean; userId?: string }) {
    const transfer = await this.findById(tenantId, id);
    if (transfer.status !== 'in_transit') throw new BadRequestException('Only in-transit transfers can be received');
    if (!Number.isFinite(data.quantity) || data.quantity < 0) throw new BadRequestException('Received quantity must be zero or positive');
    if (!data.closeShortage && data.quantity <= 0) throw new BadRequestException('Received quantity must be positive');
    if (data.quantity > transfer.pendingQuantity) {
      throw new BadRequestException('Received quantity exceeds the pending transfer quantity');
    }
    return this.repo.receiveTransfer(id, tenantId, data);
  }

  async cancel(tenantId: string, id: string) {
    const transfer = await this.findById(tenantId, id);
    if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be cancelled');
    return this.repo.cancelTransfer(id, tenantId);
  }
}
