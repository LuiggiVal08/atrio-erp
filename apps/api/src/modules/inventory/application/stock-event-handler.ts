import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { StockService } from './stock.service';

@Injectable()
export class StockEventHandler {
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
      await this.stockService.adjust({
        productId: line.productId,
        warehouseId: line.warehouseId,
        type: 'out',
        quantity: line.quantity || 0,
        userId: payload.metadata?.triggeredBy,
      });
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
      await this.stockService.adjust({
        productId: line.productId,
        warehouseId: line.warehouseId,
        type: 'in',
        quantity: line.quantity || 0,
        userId: payload.metadata?.triggeredBy,
      });
    }
  }

  @OnEvent('document.returned')
  async handleDocumentReturned(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    metadata?: any;
  }) {
    if (payload.documentType !== 'purchase_return') return;

    const lines = payload.metadata?.lines || [];
    for (const line of lines) {
      if (!line.productId || !line.warehouseId) continue;
      await this.stockService.adjust({
        productId: line.productId,
        warehouseId: line.warehouseId,
        type: 'out',
        quantity: line.quantity || 0,
        userId: payload.metadata?.triggeredBy,
      });
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
      await this.stockService.adjust({
        productId: line.productId,
        warehouseId: line.warehouseId,
        type: 'in',
        quantity: line.quantity || 0,
        userId: payload.metadata?.triggeredBy,
      });
    }
  }
}
