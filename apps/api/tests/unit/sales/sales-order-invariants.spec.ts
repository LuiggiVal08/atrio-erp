import { SalesOrder } from '../../../src/modules/sales/domain/sales-order.entity';
import { SalesOrderStatus, salesOrderStateMachine } from '../../../src/modules/sales/domain/sales-order-status';
import { CustomerSnapshot } from '../../../src/modules/sales/domain/customer-snapshot.vo';
import { CurrencySnapshot } from '../../../src/modules/sales/domain/currency-snapshot.vo';
import { Money } from '../../../src/modules/sales/domain/money.vo';
import { OrderLine } from '../../../src/modules/sales/domain/order-line.entity';

function makeSale(overrides?: Partial<{ id: string; status: SalesOrderStatus; lines: OrderLine[] }>): SalesOrder {
  const customer = new CustomerSnapshot('p1', 'Test', null, null, null, null);
  const currency = new CurrencySnapshot('VED', null);
  const lines = overrides?.lines ?? [];
  return SalesOrder.fromPersistence({
    id: overrides?.id ?? 'sale-1',
    tenantId: 't1',
    status: overrides?.status ?? SalesOrderStatus.DRAFT,
    customerSnapshot: customer,
    currencySnapshot: currency,
    lines,
    subtotal: lines.reduce((s, l) => s + l.lineTotal.amount, 0),
    taxAmount: 0,
    total: lines.reduce((s, l) => s + l.lineTotal.amount, 0),
    notes: null,
    type: 'pos',
    documentId: null,
    deliveredWarehouseId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeLine(quantity: number, unitPrice: number = 100): OrderLine {
  return OrderLine.create({
    productId: 'prod-1',
    productName: 'Test Product',
    productSku: 'SKU-001',
    quantity,
    unitPrice: new Money(unitPrice, 'VED'),
  });
}

// ─────────────────────────────────────────────
//  POS Lifecycle Invariants
// ─────────────────────────────────────────────

describe('INV-SALE-004: No modification after PENDING_PAYMENT', () => {
  it('should allow modification in DRAFT', () => {
    const sale = makeSale({ status: SalesOrderStatus.DRAFT, lines: [makeLine(1)] });
    expect(() => sale.ensureCanModify()).not.toThrow();
  });

  it('should throw modification in PENDING_PAYMENT', () => {
    const sale = makeSale({ status: SalesOrderStatus.PENDING_PAYMENT, lines: [makeLine(1)] });
    expect(() => sale.ensureCanModify()).toThrow('INV-SALE-004');
  });

  it('should throw modification in PAID', () => {
    const sale = makeSale({ status: SalesOrderStatus.PAID, lines: [makeLine(1)] });
    expect(() => sale.ensureCanModify()).toThrow('INV-SALE-004');
  });

  it('should throw modification in COMPLETED', () => {
    const sale = makeSale({ status: SalesOrderStatus.COMPLETED, lines: [makeLine(1)] });
    expect(() => sale.ensureCanModify()).toThrow('INV-SALE-004');
  });

  it('should throw modification in CANCELLED', () => {
    const sale = makeSale({ status: SalesOrderStatus.CANCELLED, lines: [makeLine(1)] });
    expect(() => sale.ensureCanModify()).toThrow('INV-SALE-004');
  });
});

describe('INV-030: Sale cannot go back to DRAFT after being confirmed', () => {
  it('DRAFT → PENDING_PAYMENT is valid', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.DRAFT, SalesOrderStatus.PENDING_PAYMENT)).toBe(true);
  });

  it('PENDING_PAYMENT → DRAFT is NOT valid', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.DRAFT)).toBe(false);
  });

  it('PAID → DRAFT is NOT valid', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.PAID, SalesOrderStatus.DRAFT)).toBe(false);
  });

  it('assertValidTransition throws for invalid transitions', () => {
    expect(() => salesOrderStateMachine.assertValidTransition(SalesOrderStatus.PAID, SalesOrderStatus.DRAFT)).toThrow();
  });

  it('All irreversible transitions are correctly defined', () => {
    // A sale should never go backward: DRAFT → PENDING_PAYMENT → PAID → COMPLETED
    for (const later of [SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.PAID, SalesOrderStatus.COMPLETED]) {
      expect(salesOrderStateMachine.canTransition(later, SalesOrderStatus.DRAFT)).toBe(false);
    }
  });
});

describe('INV-SALE-002: Sale requires a customer', () => {
  it('should create with valid customer', () => {
    const sale = makeSale();
    expect(sale.customerSnapshot).toBeDefined();
    expect(sale.customerSnapshot.name).toBe('Test');
  });
});

describe('INV-SALE-003: Line quantity must be positive', () => {
  it('should allow quantity of 1', () => {
    const line = makeLine(1);
    expect(line.quantity).toBe(1);
  });

  it('should throw for quantity of 0', () => {
    expect(() => makeLine(0)).toThrow();
  });

  it('should throw for negative quantity', () => {
    expect(() => makeLine(-1)).toThrow();
  });
});

describe('INV-052: Cannot pay same sale twice', () => {
  it('PENDING_PAYMENT → PAID is valid (first payment)', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.PENDING_PAYMENT, SalesOrderStatus.PAID)).toBe(true);
  });

  it('PAID → PAID is NOT valid (second payment)', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.PAID, SalesOrderStatus.PAID)).toBe(false);
  });

  it('COMPLETED → PAID is NOT valid', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.COMPLETED, SalesOrderStatus.PAID)).toBe(false);
  });
});

describe('INV-SALE-001: Tenant ownership', () => {
  it('should reject access from different tenant', () => {
    const sale = makeSale();
    expect(() => sale.checkTenant('t1')).not.toThrow();
    expect(() => sale.checkTenant('t2')).toThrow('INV-SALE-001');
  });
});

describe('SalesOrderStatus: order consistency', () => {
  it('DRAFT is the initial state', () => {
    const sale = SalesOrder.draft({ tenantId: 't1', customerSnapshot: new CustomerSnapshot('p1', 'T', null, null, null, null), lines: [], notes: null, type: 'pos' });
    expect(sale.status).toBe(SalesOrderStatus.DRAFT);
  });

  it('PAID → COMPLETED is valid', () => {
    expect(salesOrderStateMachine.canTransition(SalesOrderStatus.PAID, SalesOrderStatus.COMPLETED)).toBe(true);
  });

  it('COMPLETED cannot transition anywhere', () => {
    for (const target of Object.values(SalesOrderStatus)) {
      if (target === SalesOrderStatus.CANCELLED) continue; // Cancelling a completed sale is a special operation
      expect(salesOrderStateMachine.canTransition(SalesOrderStatus.COMPLETED, target)).toBe(false);
    }
  });

  it('CANCELLED cannot transition anywhere', () => {
    for (const target of Object.values(SalesOrderStatus)) {
      expect(salesOrderStateMachine.canTransition(SalesOrderStatus.CANCELLED, target)).toBe(false);
    }
  });
});

describe('OrderLine: value integrity', () => {
  it('lineTotal should equal quantity * unitPrice', () => {
    const line = makeLine(3, 150);
    expect(line.lineTotal.amount).toBe(450);
  });

  it('multiple lines do not share identity', () => {
    const line1 = makeLine(1, 100);
    const line2 = makeLine(1, 100);
    expect(line1.id).not.toBe(line2.id);
  });
});
