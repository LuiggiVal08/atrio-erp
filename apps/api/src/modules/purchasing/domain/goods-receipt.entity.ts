import type { GoodsReceiptStatus } from './goods-receipt-status';
import { goodsReceiptStateMachine } from './goods-receipt-status';
import type { GoodsReceiptLine } from './goods-receipt-line.entity';
import type { PurchasingOrderLine } from './purchasing-order-line.entity';

export interface GoodsReceiptProps {
  id: string;
  purchasingOrderId: string;
  tenantId: string;
  status: GoodsReceiptStatus;
  receivedAt: Date;
  lines: GoodsReceiptLine[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GoodsReceipt {
  public readonly id: string;
  public readonly purchasingOrderId: string;
  public readonly tenantId: string;
  public readonly status: GoodsReceiptStatus;
  public readonly receivedAt: Date;
  public readonly lines: ReadonlyArray<GoodsReceiptLine>;
  public readonly notes: string | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: GoodsReceiptProps) {
    this.id = props.id;
    this.purchasingOrderId = props.purchasingOrderId;
    this.tenantId = props.tenantId;
    this.status = props.status;
    this.receivedAt = props.receivedAt;
    this.lines = Object.freeze([...props.lines]);
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    id?: string;
    purchasingOrderId: string;
    tenantId: string;
    receivedAt: Date;
    lines?: GoodsReceiptLine[];
    notes?: string | null;
    createdAt?: Date;
  }): GoodsReceipt {
    return new GoodsReceipt({
      id: props.id ?? crypto.randomUUID(),
      purchasingOrderId: props.purchasingOrderId,
      tenantId: props.tenantId,
      status: 'PENDING',
      receivedAt: props.receivedAt,
      lines: props.lines ?? [],
      notes: props.notes ?? null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.createdAt ?? new Date(),
    });
  }

  static fromPersistence(props: GoodsReceiptProps): GoodsReceipt {
    return new GoodsReceipt(props);
  }

  // --- State transitions ---

  receive(): GoodsReceipt {
    goodsReceiptStateMachine.assertValidTransition(this.status, 'RECEIVED');
    return new GoodsReceipt({
      ...this.toProps(),
      status: 'RECEIVED',
      updatedAt: new Date(),
    });
  }

  replaceLines(lines: GoodsReceiptLine[]): GoodsReceipt {
    return new GoodsReceipt({
      ...this.toProps(),
      lines,
      updatedAt: new Date(),
    });
  }

  // --- Helpers ---

  private toProps(): GoodsReceiptProps {
    return {
      id: this.id,
      purchasingOrderId: this.purchasingOrderId,
      tenantId: this.tenantId,
      status: this.status,
      receivedAt: this.receivedAt,
      lines: [...this.lines],
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Build purchase order line with updated receivedQuantity from this receipt.
   */
  buildUpdatedPOLines(poLines: PurchasingOrderLine[]): PurchasingOrderLine[] {
    return poLines.map(poLine => {
      const grLine = this.lines.find(l => l.purchasingOrderLineId === poLine.id);
      if (!grLine) return poLine;
      return poLine.withReceivedQuantity(grLine.receivedQuantity);
    });
  }
}
