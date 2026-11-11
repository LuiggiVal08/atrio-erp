import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryRepository } from '../domain/inventory.repository.interface';

@Injectable()
export class StockService {
  constructor(@Inject('InventoryRepository') private readonly repo: InventoryRepository) {}

  async getBalance(productId: string, warehouseId: string) {
    const stock = await this.repo.getStock(productId, warehouseId);
    return stock ? { productId, warehouseId, quantity: stock.quantity } : { productId, warehouseId, quantity: 0 };
  }

  async adjust(data: {
    tenantId?: string;
    productId: string; warehouseId: string; type: 'in' | 'out';
    quantity: number; reason?: string; userId?: string;
    lotNumber?: string; serialNumber?: string; expirationDate?: string;
  }) {
    if (data.quantity <= 0) throw new BadRequestException('Quantity must be positive');
    if (data.type === 'out') {
      const current = await this.repo.getStock(data.productId, data.warehouseId);
      if (!current || current.quantity < data.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }
    const delta = data.type === 'in' ? data.quantity : -data.quantity;
    const before = await this.repo.getStock(data.productId, data.warehouseId);
    const stock = await this.repo.adjustStock(data.productId, data.warehouseId, delta);
    let lotId: string | undefined;
    if (data.tenantId && this.repo.upsertStockLot && (data.lotNumber || data.serialNumber || data.expirationDate)) {
      const lot = await this.repo.upsertStockLot({
        tenantId: data.tenantId,
        productId: data.productId,
        warehouseId: data.warehouseId,
        lotNumber: data.lotNumber,
        serialNumber: data.serialNumber,
        expirationDate: data.expirationDate,
        delta,
      });
      lotId = lot.id;
    }
    await this.repo.createMovement({
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: data.type,
      quantity: data.quantity,
      referenceType: 'adjustment',
      referenceId: data.reason,
      userId: data.userId,
      balanceBefore: before?.quantity ?? 0,
      balanceAfter: stock.quantity,
      lotId,
    });
    return stock;
  }

  async getMovements(productId: string, warehouseId: string) {
    return this.repo.findMovements(productId, warehouseId);
  }

  async getBalances(tenantId: string) {
    return this.repo.findStockBalances ? this.repo.findStockBalances(tenantId) : [];
  }

  async getAllMovements(tenantId: string) {
    return this.repo.findAllMovements ? this.repo.findAllMovements(tenantId) : [];
  }
}
