import {
  saleCreated, saleUpdated, saleDeleted,
  saleLineAdded, saleLineRemoved, saleLineUpdated,
} from '../../../src/modules/sales/domain/domain-events';

describe('Domain Events', () => {
  const saleId = 'sale-1';
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  it('saleCreated event', () => {
    const event = saleCreated(saleId, tenantId, userId);
    expect(event.eventType).toBe('sale.created');
    expect(event.saleId).toBe(saleId);
    expect(event.tenantId).toBe(tenantId);
    expect(event.triggeredBy).toBe(userId);
    expect(event.timestamp).toBeDefined();
  });

  it('saleUpdated event includes changes', () => {
    const event = saleUpdated(saleId, tenantId, userId, ['customer', 'lines']);
    expect(event.eventType).toBe('sale.updated');
    expect(event.data?.changes).toEqual(['customer', 'lines']);
  });

  it('saleDeleted event', () => {
    const event = saleDeleted(saleId, tenantId, userId);
    expect(event.eventType).toBe('sale.deleted');
  });

  it('saleLineAdded event', () => {
    const event = saleLineAdded(saleId, tenantId, userId, 'Laptop', 2);
    expect(event.eventType).toBe('sale.line_added');
    expect(event.data?.productName).toBe('Laptop');
    expect(event.data?.quantity).toBe(2);
  });

  it('saleLineRemoved event', () => {
    const event = saleLineRemoved(saleId, tenantId, userId, 'Mouse');
    expect(event.eventType).toBe('sale.line_removed');
    expect(event.data?.productName).toBe('Mouse');
  });

  it('saleLineUpdated event', () => {
    const event = saleLineUpdated(saleId, tenantId, userId, 'Laptop', 1, 3);
    expect(event.eventType).toBe('sale.line_updated');
    expect(event.data?.previousQty).toBe(1);
    expect(event.data?.newQty).toBe(3);
  });

  it('all events have required fields', () => {
    const events = [
      saleCreated(saleId, tenantId, userId),
      saleDeleted(saleId, tenantId, userId),
    ];
    for (const event of events) {
      expect(event.saleId).toBe(saleId);
      expect(event.tenantId).toBe(tenantId);
      expect(event.triggeredBy).toBe(userId);
      expect(event.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});
