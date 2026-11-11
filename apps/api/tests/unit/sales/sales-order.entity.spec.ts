import { SalesOrder } from '../../../src/modules/sales/domain/sales-order.entity';
import { SalesOrderStatus } from '../../../src/modules/sales/domain/sales-order-status';
import { CustomerSnapshot } from '../../../src/modules/sales/domain/customer-snapshot.vo';
import { CurrencySnapshot } from '../../../src/modules/sales/domain/currency-snapshot.vo';
import { Money } from '../../../src/modules/sales/domain/money.vo';
import { OrderLine } from '../../../src/modules/sales/domain/order-line.entity';

function makeSnapshot(): CustomerSnapshot {
  return new CustomerSnapshot('p1', 'Juan Pérez', 'J-123', 'Av 1', 'j@e.com', '0412');
}

function makeLine(overrides?: Partial<{ id: string; qty: number; price: number; name: string }>): OrderLine {
  return OrderLine.create({
    id: overrides?.id ?? 'line-1',
    productId: 'prod-1',
    productName: overrides?.name ?? 'Laptop',
    productSku: 'LAP001',
    quantity: overrides?.qty ?? 2,
    unitPrice: new Money(overrides?.price ?? 100, 'VED'),
  });
}

describe('SalesOrder (Aggregate)', () => {
  describe('draft()', () => {
    it('should create a draft sale', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      expect(sale.status).toBe(SalesOrderStatus.DRAFT);
      expect(sale.tenantId).toBe('t1');
      expect(sale.type).toBe('pos');
      expect(sale.documentId).toBeNull();
      expect(sale.lines).toHaveLength(0);
      expect(sale.total).toBe(0);
    });

    it('should assign a UUID if no id provided', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      expect(sale.id).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('INV-SALE-001: tenant', () => {
    it('should validate tenant ownership', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      expect(() => sale.checkTenant('t2')).toThrow('INV-SALE-001');
      expect(() => sale.checkTenant('t1')).not.toThrow();
    });
  });

  describe('INV-SALE-004: cannot modify after PendingPayment', () => {
    it('should allow modification in Draft', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      expect(() => sale.ensureCanModify()).not.toThrow();
    });

    it('should reject modification after checkout', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const checkedOut = sale.requestCheckout();
      expect(checkedOut.status).toBe(SalesOrderStatus.PENDING_PAYMENT);
      expect(() => checkedOut.ensureCanModify()).toThrow('INV-SALE-004');
    });
  });

  describe('line management', () => {
    it('should add a line and recalculate', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const withLine = sale.addLine(makeLine({ qty: 3, price: 100 }));
      expect(withLine.lines).toHaveLength(1);
      expect(withLine.subtotal).toBe(300);
      expect(withLine.total).toBe(300);
    });

    it('should remove a line', () => {
      const line1 = makeLine({ id: 'l1', qty: 2, price: 100 });
      const line2 = makeLine({ id: 'l2', qty: 1, price: 50 });
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot(), lines: [line1, line2] });
      const withoutLine2 = sale.removeLine('l2');
      expect(withoutLine2.lines).toHaveLength(1);
      expect(withoutLine2.subtotal).toBe(200);
    });

    it('should update line quantity', () => {
      const line = makeLine({ id: 'l1', qty: 2, price: 100 });
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot(), lines: [line] });
      const updated = sale.updateLineQuantity('l1', 5);
      expect(updated.lines[0].quantity).toBe(5);
      expect(updated.subtotal).toBe(500);
    });

    it('should replace all lines', () => {
      const line = makeLine({ id: 'l1', qty: 2, price: 100 });
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot(), lines: [line] });
      const newLine = makeLine({ id: 'l2', qty: 1, price: 999 });
      const replaced = sale.replaceLines([newLine]);
      expect(replaced.lines).toHaveLength(1);
      expect(replaced.subtotal).toBe(999);
    });

    it('should reject addLine after checkout', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const checkedOut = sale.requestCheckout();
      expect(() => checkedOut.addLine(makeLine())).toThrow('INV-SALE-004');
    });
  });

  describe('checkout() extension point', () => {
    it('should throw NotImplemented', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      expect(() => sale.checkout()).toThrow('Not implemented');
    });
  });

  describe('requestCheckout()', () => {
    it('should transition from DRAFT to PENDING_PAYMENT', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const checkedOut = sale.requestCheckout();
      expect(checkedOut.status).toBe(SalesOrderStatus.PENDING_PAYMENT);
    });
  });

  describe('customer snapshot update', () => {
    it('should update snapshot and return new instance', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const newSnapshot = makeSnapshot().update({ name: 'María García' });
      const updated = sale.updateCustomerSnapshot(newSnapshot);
      expect(updated.customerSnapshot.name).toBe('María García');
      expect(sale.customerSnapshot.name).toBe('Juan Pérez');
    });
  });

  describe('immutability', () => {
    it('should not mutate lines array', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const lines = sale.lines as any[];
      expect(() => lines.push(makeLine())).toThrow();
    });

    it('should create new instances on mutations', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      const updated = sale.addLine(makeLine());
      expect(sale.lines).toHaveLength(0);
      expect(updated.lines).toHaveLength(1);
    });
  });

  describe('fromPersistence', () => {
    it('should restore from stored props', () => {
      const customer = makeSnapshot();
      const currency = new CurrencySnapshot('VED', null);
      const line = makeLine();
      const sale = SalesOrder.fromPersistence({
        id: 'ord-1',
        tenantId: 't1',
        status: SalesOrderStatus.DRAFT,
        customerSnapshot: customer,
        currencySnapshot: currency,
        lines: [line],
        subtotal: 200,
        taxAmount: 0,
        total: 200,
        notes: null,
        type: 'pos',
        documentId: null,
        deliveredWarehouseId: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });
      expect(sale.id).toBe('ord-1');
      expect(sale.lines).toHaveLength(1);
      expect(sale.total).toBe(200);
    });
  });

  describe('type default', () => {
    it('should default to pos type', () => {
      const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: makeSnapshot() });
      expect(sale.type).toBe('pos');
    });
  });
});
