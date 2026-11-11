import { Money } from './money.vo';
import { CustomerSnapshot } from './customer-snapshot.vo';
import { CurrencySnapshot } from './currency-snapshot.vo';
import { OrderLine } from './order-line.entity';
import { SalesOrderStatus, salesOrderStateMachine } from './sales-order-status';

export interface SalesOrderProps {
  id: string;
  tenantId: string;
  status: SalesOrderStatus;
  customerSnapshot: CustomerSnapshot;
  currencySnapshot: CurrencySnapshot;
  lines: OrderLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  type: string;
  documentId: string | null;
  deliveredWarehouseId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SalesOrder {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly status: SalesOrderStatus;
  public readonly customerSnapshot: CustomerSnapshot;
  public readonly currencySnapshot: CurrencySnapshot;
  public readonly lines: ReadonlyArray<OrderLine>;
  public readonly subtotal: number;
  public readonly taxAmount: number;
  public readonly total: number;
  public readonly notes: string | null;
  public readonly type: string;
  public readonly documentId: string | null;
  public readonly deliveredWarehouseId: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: SalesOrderProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.status = props.status;
    this.customerSnapshot = props.customerSnapshot;
    this.currencySnapshot = props.currencySnapshot;
    this.lines = Object.freeze([...props.lines]);
    this.subtotal = props.subtotal;
    this.taxAmount = props.taxAmount;
    this.total = props.total;
    this.notes = props.notes;
    this.type = props.type;
    this.documentId = props.documentId;
    this.deliveredWarehouseId = props.deliveredWarehouseId;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static draft(props: {
    id?: string;
    tenantId: string;
    customerSnapshot: CustomerSnapshot;
    currencySnapshot?: CurrencySnapshot;
    lines?: OrderLine[];
    notes?: string | null;
    type?: string;
    createdAt?: Date;
  }): SalesOrder {
    return new SalesOrder({
      id: props.id ?? crypto.randomUUID(),
      tenantId: props.tenantId,
      status: SalesOrderStatus.DRAFT,
      customerSnapshot: props.customerSnapshot,
      currencySnapshot: props.currencySnapshot ?? new CurrencySnapshot('VED', null),
      lines: props.lines ?? [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      notes: props.notes ?? null,
      type: props.type ?? 'pos',
      documentId: null,
      deliveredWarehouseId: null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.createdAt ?? new Date(),
    });
  }

  static fromPersistence(props: SalesOrderProps): SalesOrder {
    return new SalesOrder(props);
  }

  // --- Invariants ---

  ensureCanModify(): void {
    if (this.status !== SalesOrderStatus.DRAFT) {
      throw new Error('INV-SALE-004: Cannot modify a sale after PendingPayment');
    }
  }

  checkTenant(tenantId: string): void {
    if (this.tenantId !== tenantId) {
      throw new Error('INV-SALE-001: Sale does not belong to this tenant');
    }
  }

  // --- Line management ---

  addLine(line: OrderLine): SalesOrder {
    this.ensureCanModify();
    const newLines = [...this.lines, line];
    return this.recalculated(newLines);
  }

  removeLine(lineId: string): SalesOrder {
    this.ensureCanModify();
    const newLines = this.lines.filter(l => l.id !== lineId);
    return this.recalculated(newLines);
  }

  updateLineQuantity(lineId: string, newQty: number): SalesOrder {
    this.ensureCanModify();
    const newLines = this.lines.map(l => l.id === lineId ? l.withQuantity(newQty) : l);
    return this.recalculated(newLines);
  }

  replaceLines(lines: OrderLine[]): SalesOrder {
    this.ensureCanModify();
    return this.recalculated(lines);
  }

  // --- Snapshot update ---

  updateCustomerSnapshot(snapshot: CustomerSnapshot): SalesOrder {
    this.ensureCanModify();
    return new SalesOrder({
      ...this.toProps(),
      customerSnapshot: snapshot,
      updatedAt: new Date(),
    });
  }

  // --- State transitions ---

  requestCheckout(): SalesOrder {
    salesOrderStateMachine.assertValidTransition(this.status, SalesOrderStatus.PENDING_PAYMENT);
    return new SalesOrder({
      ...this.toProps(),
      status: SalesOrderStatus.PENDING_PAYMENT,
      updatedAt: new Date(),
    });
  }

  // --- Extension point for Slice 2 ---

  checkout(): never {
    throw new Error('Not implemented: checkout will be added in Slice 2');
  }

  // --- Helpers ---

  private recalculated(lines: OrderLine[]): SalesOrder {
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal.amount, 0);
    return new SalesOrder({
      ...this.toProps(),
      lines,
      subtotal,
      total: subtotal + this.taxAmount,
      updatedAt: new Date(),
    });
  }

  private toProps(): SalesOrderProps {
    return {
      id: this.id,
      tenantId: this.tenantId,
      status: this.status,
      customerSnapshot: this.customerSnapshot,
      currencySnapshot: this.currencySnapshot,
      lines: [...this.lines],
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      total: this.total,
      notes: this.notes,
      type: this.type,
      documentId: this.documentId,
      deliveredWarehouseId: this.deliveredWarehouseId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
