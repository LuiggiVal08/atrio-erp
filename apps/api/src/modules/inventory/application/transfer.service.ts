import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class TransferService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async create(data: {
    tenantId: string; fromWarehouseId: string; toWarehouseId: string;
    productId: string; quantity: number; notes?: string;
  }) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouses must be different');
    }
    if (data.quantity <= 0) throw new BadRequestException('Quantity must be positive');

    const stock = await this.repo.getStock(data.productId, data.fromWarehouseId);
    if (!stock || stock.quantity < data.quantity) {
      throw new BadRequestException('Insufficient stock in source warehouse');
    }

    return this.repo.createTransfer(data);
  }

  async findAll(tenantId: string) {
    return this.repo.findTransfersByTenant(tenantId);
  }

  async findById(id: string) {
    const transfer = await this.repo.findTransferById(id);
    if (!transfer) throw new NotFoundException('Transfer not found');
    return transfer;
  }

  async complete(id: string) {
    const transfer = await this.repo.findTransferById(id);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be completed');

    await this.repo.adjustStock(transfer.productId, transfer.fromWarehouseId, -transfer.quantity);
    await this.repo.adjustStock(transfer.productId, transfer.toWarehouseId, transfer.quantity);

    await this.repo.createMovement({
      productId: transfer.productId, warehouseId: transfer.fromWarehouseId,
      type: 'out', quantity: transfer.quantity, referenceType: 'transfer', referenceId: id,
    });
    await this.repo.createMovement({
      productId: transfer.productId, warehouseId: transfer.toWarehouseId,
      type: 'in', quantity: transfer.quantity, referenceType: 'transfer', referenceId: id,
    });

    return this.repo.completeTransfer(id);
  }

  async cancel(id: string) {
    const transfer = await this.repo.findTransferById(id);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'pending') throw new BadRequestException('Only pending transfers can be cancelled');
    return this.repo.cancelTransfer(id);
  }
}
