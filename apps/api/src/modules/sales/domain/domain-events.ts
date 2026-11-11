export interface SaleDomainEvent {
  eventType: string;
  saleId: string;
  tenantId: string;
  timestamp: string;
  triggeredBy: string;
  data?: Record<string, unknown>;
}

export function saleCreated(saleId: string, tenantId: string, triggeredBy: string): SaleDomainEvent {
  return {
    eventType: 'sale.created',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
  };
}

export function saleUpdated(saleId: string, tenantId: string, triggeredBy: string, changes: string[]): SaleDomainEvent {
  return {
    eventType: 'sale.updated',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
    data: { changes },
  };
}

export function saleDeleted(saleId: string, tenantId: string, triggeredBy: string): SaleDomainEvent {
  return {
    eventType: 'sale.deleted',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
  };
}

export function saleLineAdded(saleId: string, tenantId: string, triggeredBy: string, productName: string, quantity: number): SaleDomainEvent {
  return {
    eventType: 'sale.line_added',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
    data: { productName, quantity },
  };
}

export function saleLineRemoved(saleId: string, tenantId: string, triggeredBy: string, productName: string): SaleDomainEvent {
  return {
    eventType: 'sale.line_removed',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
    data: { productName },
  };
}

export function saleLineUpdated(saleId: string, tenantId: string, triggeredBy: string, productName: string, previousQty: number, newQty: number): SaleDomainEvent {
  return {
    eventType: 'sale.line_updated',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
    data: { productName, previousQty, newQty },
  };
}

export function saleCheckoutCompleted(saleId: string, tenantId: string, triggeredBy: string, documentId: string, grandTotal: number): SaleDomainEvent {
  return {
    eventType: 'sale.checkout_completed',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
    data: { documentId, grandTotal },
  };
}

export function salePaymentCompleted(saleId: string, tenantId: string, triggeredBy: string, documentId: string, paymentMethodId: string, totalPaid: number): SaleDomainEvent {
  return {
    eventType: 'sale.payment_completed',
    saleId,
    tenantId,
    timestamp: new Date().toISOString(),
    triggeredBy,
    data: { documentId, paymentMethodId, totalPaid },
  };
}
