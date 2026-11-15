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
    if (!stock || stock.quantity < data.quantity) {
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

  async complete(tenantId: string, id: string, userId?: string) {
    const transfer = await this.findById(tenantId, id);
    if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be completed');

    const sourceStock = await this.repo.getStock(transfer.productId, transfer.fromWarehouseId, tenantId);
    if (!sourceStock || sourceStock.quantity < transfer.quantity) {
      throw new BadRequestException('Insufficient stock in source warehouse');
    }

    return this.repo.completeTransfer(id, tenantId, userId);
  }

  async cancel(tenantId: string, id: string) {
    const transfer = await this.findById(tenantId, id);
    if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be cancelled');
    return this.repo.cancelTransfer(id, tenantId);
  }
}
