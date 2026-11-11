export interface PurchasingDomainEvent {
  eventType: string;
  purchaseOrderId: string;
  tenantId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export function purchaseOrderCreated(purchaseOrderId: string, tenantId: string): PurchasingDomainEvent {
  return {
    eventType: 'purchasing.order.created',
    purchaseOrderId,
    tenantId,
    timestamp: new Date().toISOString(),
  };
}

export function purchaseOrderApproved(purchaseOrderId: string, tenantId: string): PurchasingDomainEvent {
  return {
    eventType: 'purchasing.order.approved',
    purchaseOrderId,
    tenantId,
    timestamp: new Date().toISOString(),
  };
}

export function goodsReceiptStarted(purchaseOrderId: string, goodsReceiptId: string, tenantId: string): PurchasingDomainEvent {
  return {
    eventType: 'purchasing.receiving.started',
    purchaseOrderId,
    tenantId,
    timestamp: new Date().toISOString(),
    data: { goodsReceiptId },
  };
}

export function goodsReceiptCompleted(
  purchaseOrderId: string,
  goodsReceiptId: string,
  tenantId: string,
  lines: Array<{ productId: string; warehouseId: string | null; receivedQuantity: number; damagedQuantity: number }>,
): PurchasingDomainEvent {
  return {
    eventType: 'purchasing.receiving.completed',
    purchaseOrderId,
    tenantId,
    timestamp: new Date().toISOString(),
    data: { goodsReceiptId, lines },
  };
}
