import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PurchaseReceiveEventHandler {
  @OnEvent('document.received')
  async handleDocumentReceived(payload: {
    eventType: string;
    tenantId: string;
    documentId: string;
    documentType: string;
    metadata?: any;
  }) {
    // Stock increment is handled by StockEventHandler listening to document.status-changed
    // This handler is reserved for future purchase-specific logic (e.g., vendor payment)
  }
}
