import type { SupplierSnapshot } from './supplier-snapshot.vo';
import type { PurchasingOrderLine } from './purchasing-order-line.entity';
import type { PurchasingOrderStatus } from './purchasing-order-status';
import { purchasingOrderStateMachine } from './purchasing-order-status';

export interface PurchasingOrderProps {
  id: string;
  tenantId: string;
  status: PurchasingOrderStatus;
  supplierSnapshot: SupplierSnapshot;
  lines: PurchasingOrderLine[];
  notes: string | null;
  completedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchasingOrder {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly status: PurchasingOrderStatus;
  public readonly supplierSnapshot: SupplierSnapshot;
  public readonly lines: ReadonlyArray<PurchasingOrderLine>;
  public readonly notes: string | null;
  public readonly completedAt: Date | null;
  public readonly version: number;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: PurchasingOrderProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.status = props.status;
    this.supplierSnapshot = props.supplierSnapshot;
    this.lines = Object.freeze([...props.lines]);
    this.notes = props.notes;
    this.completedAt = props.completedAt;
    this.version = props.version;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static draft(props: {
    id?: string;
    tenantId: string;
    supplierSnapshot: SupplierSnapshot;
    lines: PurchasingOrderLine[];
    notes?: string | null;
    createdAt?: Date;
  }): PurchasingOrder {
    return new PurchasingOrder({
      id: props.id ?? crypto.randomUUID(),
      tenantId: props.tenantId,
      status: 'DRAFT',
      supplierSnapshot: props.supplierSnapshot,
      lines: props.lines,
      notes: props.notes ?? null,
      completedAt: null,
      version: 1,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.createdAt ?? new Date(),
    });
  }

  static fromPersistence(props: PurchasingOrderProps): PurchasingOrder {
    return new PurchasingOrder(props);
  }

  // --- Invariants ---

  checkTenant(tenantId: string): void {
    if (this.tenantId !== tenantId) {
      throw new Error('INV-PO-005: Purchase order does not belong to this tenant');
    }
  }

  // --- State transitions ---

  approve(): PurchasingOrder {
    purchasingOrderStateMachine.assertValidTransition(this.status, 'APPROVED');
    return new PurchasingOrder({
      ...this.toProps(),
      status: 'APPROVED',
      updatedAt: new Date(),
    });
  }

  startReceiving(): PurchasingOrder {
    purchasingOrderStateMachine.assertValidTransition(this.status, 'RECEIVING');
    return new PurchasingOrder({
      ...this.toProps(),
      status: 'RECEIVING',
      updatedAt: new Date(),
    });
  }

  complete(lines: PurchasingOrderLine[]): PurchasingOrder {
    purchasingOrderStateMachine.assertValidTransition(this.status, 'COMPLETED');
    return new PurchasingOrder({
      ...this.toProps(),
      status: 'COMPLETED',
      lines,
      completedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // --- Helpers ---

  private toProps(): PurchasingOrderProps {
    return {
      id: this.id,
      tenantId: this.tenantId,
      status: this.status,
      supplierSnapshot: this.supplierSnapshot,
      lines: [...this.lines],
      notes: this.notes,
      completedAt: this.completedAt,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
