import {
  purchaseOrderCreated,
  purchaseOrderApproved,
  goodsReceiptStarted,
  goodsReceiptCompleted,
} from '../../../src/modules/purchasing/domain/domain-events';

describe('PurchasingDomainEvents', () => {
  it('purchaseOrderCreated should have correct eventType', () => {
    const event = purchaseOrderCreated('po-1', 't1');
    expect(event.eventType).toBe('purchasing.order.created');
    expect(event.purchaseOrderId).toBe('po-1');
    expect(event.tenantId).toBe('t1');
    expect(event.timestamp).toBeDefined();
  });

  it('purchaseOrderApproved should have correct eventType', () => {
    const event = purchaseOrderApproved('po-1', 't1');
    expect(event.eventType).toBe('purchasing.order.approved');
  });

  it('goodsReceiptStarted should include goodsReceiptId in data', () => {
    const event = goodsReceiptStarted('po-1', 'gr-1', 't1');
    expect(event.eventType).toBe('purchasing.receiving.started');
    expect(event.data?.goodsReceiptId).toBe('gr-1');
  });

  it('goodsReceiptCompleted should include lines in data', () => {
    const lines = [
      { productId: 'p1', warehouseId: 'w1', receivedQuantity: 10, damagedQuantity: 1 },
    ];
    const event = goodsReceiptCompleted('po-1', 'gr-1', 't1', lines);
    expect(event.eventType).toBe('purchasing.receiving.completed');
    expect(event.data?.lines).toEqual(lines);
  });
});
