import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StockService } from './stock.service';

@Injectable()
export class StockEventHandler {
  private readonly logger = new Logger(StockEventHandler.name);
  private readonly MAX_RETRIES = 3;

  constructor(private readonly stockService: StockService) {}

  @OnEvent('document.approved')
  async handleDocumentApproved(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    metadata?: any;
  }) {
    if (payload.documentType !== 'sales_invoice') return;

    const lines = payload.metadata?.lines || [];
    for (const line of lines) {
      if (!line.productId || !line.warehouseId) continue;
      await this.withRetry(() =>
        this.stockService.adjust({
          tenantId: payload.tenantId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          type: 'out',
          quantity: line.quantity || 0,
          userId: payload.metadata?.triggeredBy,
        }),
        `Stock deduct for product ${line.productId} (doc ${payload.documentId})`,
      );
    }
  }

  @OnEvent('document.deliver')
  async handleDocumentDelivered(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    metadata?: any;
  }) {
    if (payload.documentType !== 'purchase_order') return;

    const lines = payload.metadata?.lines || [];
    for (const line of lines) {
      if (!line.productId || !line.warehouseId) continue;
      await this.withRetry(() =>
        this.stockService.adjust({
          tenantId: payload.tenantId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          type: 'in',
          quantity: line.quantity || 0,
          userId: payload.metadata?.triggeredBy,
        }),
        `Stock add for product ${line.productId} (doc ${payload.documentId})`,
      );
    }
  }

  @OnEvent('document.returned')
  async handleDocumentReturned(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    metadata?: any;
    triggeredBy?: string;
  }) {
    const lines = payload.metadata?.lines || [];
    if (payload.documentType === 'sales_return') {
      const condition = payload.metadata?.productCondition ?? 'saleable';
      if (condition !== 'saleable') {
        this.logger.log(`Sales return ${payload.documentId}: product routed to ${payload.metadata?.destination ?? 'quarantine'}`);
        return;
      }
      for (const line of lines) {
        if (!line.productId || !line.warehouseId) continue;
        await this.withRetry(() =>
          this.stockService.adjust({
            tenantId: payload.tenantId,
            productId: line.productId,
            warehouseId: line.warehouseId,
            type: 'in',
            quantity: line.quantity || 0,
            reason: `Devolución de cliente ${payload.documentId}`,
            userId: payload.triggeredBy,
            lotNumber: line.lotNumber,
            serialNumber: line.serialNumber,
          }),
          `Stock return for product ${line.productId} (doc ${payload.documentId})`,
        );
      }
      return;
    }
    if (payload.documentType !== 'purchase_return') return;
    for (const line of lines) {
      if (!line.productId || !line.warehouseId) continue;
      await this.withRetry(() =>
        this.stockService.adjust({
          tenantId: payload.tenantId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          type: 'out',
          quantity: line.quantity || 0,
          reason: payload.metadata?.reasonCode
            ? `Devolución a proveedor: ${payload.metadata.reasonCode}`
            : `Devolución a proveedor ${payload.documentId}`,
          userId: payload.triggeredBy ?? payload.metadata?.triggeredBy,
        }),
        `Stock reverse for product ${line.productId} (doc ${payload.documentId})`,
      );
    }
  }

  @OnEvent('document.received')
  async handleDocumentReceived(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    metadata?: any;
  }) {
    if (payload.documentType !== 'purchase_order') return;

    const lines = payload.metadata?.lines || [];
    for (const line of lines) {
      if (!line.productId || !line.warehouseId) continue;
      await this.withRetry(() =>
        this.stockService.adjust({
          tenantId: payload.tenantId,
          productId: line.productId,
          warehouseId: line.warehouseId,
          type: 'in',
          quantity: line.quantity || 0,
          userId: payload.metadata?.triggeredBy,
        }),
        `Stock receipt for product ${line.productId} (doc ${payload.documentId})`,
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
