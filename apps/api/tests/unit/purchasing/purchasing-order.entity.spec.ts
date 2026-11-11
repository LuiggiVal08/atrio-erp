import { PurchasingOrder } from '../../../src/modules/purchasing/domain/purchasing-order.entity';
import { PurchasingOrderLine } from '../../../src/modules/purchasing/domain/purchasing-order-line.entity';
import { SupplierSnapshot } from '../../../src/modules/purchasing/domain/supplier-snapshot.vo';
import { ProductSnapshot } from '../../../src/modules/purchasing/domain/product-snapshot.vo';

function makeSupplier(): SupplierSnapshot {
  return new SupplierSnapshot('s1', 'Supplier A', 'J-123', null, null);
}

function makeProduct(): ProductSnapshot {
  return new ProductSnapshot('p1', 'SKU-001', 'Widget', 'unidad', 'w1');
}

function makeLine(overrides?: Partial<{ orderedQuantity: number; unitCost: number }>): PurchasingOrderLine {
  return PurchasingOrderLine.create({
    productSnapshot: makeProduct(),
    orderedQuantity: overrides?.orderedQuantity ?? 10,
    unitCost: overrides?.unitCost ?? 15.50,
    taxRate: 0.16,
    discountRate: 0.05,
  });
}

function makeOrder(overrides?: Partial<{ status: string }>): PurchasingOrder {
  const lines = [makeLine()];
  return PurchasingOrder.fromPersistence({
    id: 'po-1',
    tenantId: 't1',
    status: (overrides?.status ?? 'DRAFT') as any,
    supplierSnapshot: makeSupplier(),
    lines,
    notes: null,
    completedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('PurchasingOrder', () => {
  describe('draft', () => {
    it('should create in DRAFT status', () => {
      const lines = [makeLine()];
      const order = PurchasingOrder.draft({
        tenantId: 't1',
        supplierSnapshot: makeSupplier(),
        lines,
      });
      expect(order.status).toBe('DRAFT');
      expect(order.tenantId).toBe('t1');
      expect(order.completedAt).toBeNull();
      expect(order.version).toBe(1);
    });
  });

  describe('approve', () => {
    it('should transition from DRAFT to APPROVED', () => {
      const order = makeOrder({ status: 'DRAFT' });
      const approved = order.approve();
      expect(approved.status).toBe('APPROVED');
    });

    it('should throw if not DRAFT', () => {
      const order = makeOrder({ status: 'APPROVED' });
      expect(() => order.approve()).toThrow('Cannot transition');
    });
  });

  describe('startReceiving', () => {
    it('should transition from APPROVED to RECEIVING', () => {
      const order = makeOrder({ status: 'APPROVED' });
      const receiving = order.startReceiving();
      expect(receiving.status).toBe('RECEIVING');
    });

    it('should throw if not APPROVED', () => {
      const order = makeOrder({ status: 'DRAFT' });
      expect(() => order.startReceiving()).toThrow('Cannot transition');
    });
  });

  describe('complete', () => {
    it('should transition from RECEIVING to COMPLETED', () => {
      const order = makeOrder({ status: 'RECEIVING' });
      const lines = order.lines.map(l => l.withReceivedQuantity(10));
      const completed = order.complete(lines);
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeInstanceOf(Date);
    });

    it('should update lines with received quantities', () => {
      const order = makeOrder({ status: 'RECEIVING' });
      const lines = order.lines.map(l => l.withReceivedQuantity(10));
      const completed = order.complete(lines);
      expect(completed.lines[0].receivedQuantity).toBe(10);
    });

    it('should throw if not RECEIVING', () => {
      const order = makeOrder({ status: 'DRAFT' });
      expect(() => order.complete([...order.lines])).toThrow('Cannot transition');
    });
  });

  describe('checkTenant', () => {
    it('should not throw for matching tenant', () => {
      const order = makeOrder();
      expect(() => order.checkTenant('t1')).not.toThrow();
    });

    it('should throw for mismatched tenant', () => {
      const order = makeOrder();
      expect(() => order.checkTenant('t2')).toThrow('INV-PO-005');
    });
  });
});
