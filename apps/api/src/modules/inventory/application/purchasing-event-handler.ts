import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StockService } from './stock.service';

@Injectable()
export class PurchasingEventHandler {
  private readonly logger = new Logger(PurchasingEventHandler.name);
  private readonly MAX_RETRIES = 3;

  constructor(private readonly stockService: StockService) {}

  @OnEvent('purchasing.receiving.completed')
  async handleGoodsReceiptCompleted(payload: {
    eventType: string;
    purchaseOrderId: string;
    tenantId: string;
    timestamp: string;
    data?: {
      goodsReceiptId: string;
      lines: Array<{
        productId: string;
        warehouseId: string | null;
        receivedQuantity: number;
        damagedQuantity: number;
      }>;
    };
  }) {
    const lines = payload.data?.lines ?? [];
    for (const line of lines) {
      if (!line.productId || !line.warehouseId) {
        this.logger.warn(`Skipping stock movement: missing productId or warehouseId for PO ${payload.purchaseOrderId}`);
        continue;
      }

      const netQuantity = line.receivedQuantity - line.damagedQuantity;
      if (netQuantity <= 0) {
        this.logger.warn(`Skipping stock movement: net quantity <= 0 for product ${line.productId}`);
        continue;
      }

      const productId = line.productId;
      const warehouseId = line.warehouseId;
      await this.withRetry(
        () =>
          this.stockService.adjust({
            tenantId: payload.tenantId,
            productId,
            warehouseId,
            type: 'in',
            quantity: netQuantity,
          }),
        `Stock receipt for product ${line.productId} (PO ${payload.purchaseOrderId})`,
      );
    }
  }

  private async withRetry(fn: () => Promise<any>, label: string): Promise<void> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await fn();
        return;
      } catch (err) {
        this.logger.warn(`[${label}] attempt ${attempt}/${this.MAX_RETRIES} failed: ${(err as Error).message}`);
        if (attempt === this.MAX_RETRIES) {
          this.logger.error(`[${label}] all ${this.MAX_RETRIES} attempts exhausted`);
          throw err;
        }
        await this.sleep(1000 * attempt);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
