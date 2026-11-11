import type { ProductSnapshot } from './product-snapshot.vo';

export interface PurchasingOrderLineProps {
  id: string;
  productSnapshot: ProductSnapshot;
  orderedQuantity: number;
  unitCost: number;
  taxRate: number;
  discountRate: number;
  totalCost: number;
  receivedQuantity: number;
}

export class PurchasingOrderLine {
  constructor(
    public readonly id: string,
    public readonly productSnapshot: ProductSnapshot,
    public readonly orderedQuantity: number,
    public readonly unitCost: number,
    public readonly taxRate: number,
    public readonly discountRate: number,
    public readonly totalCost: number,
    public readonly receivedQuantity: number,
  ) {
    if (orderedQuantity <= 0) throw new Error('INV-PO-001: orderedQuantity must be greater than zero');
    if (unitCost <= 0) throw new Error('INV-PO-002: unitCost must be greater than zero');
    if (receivedQuantity < 0) throw new Error('INV-PO-003: receivedQuantity cannot be negative');
  }

  static create(props: {
    id?: string;
    productSnapshot: ProductSnapshot;
    orderedQuantity: number;
    unitCost: number;
    taxRate?: number;
    discountRate?: number;
  }): PurchasingOrderLine {
    const taxRate = props.taxRate ?? 0;
    const discountRate = props.discountRate ?? 0;
    const totalCost = props.unitCost * props.orderedQuantity * (1 - discountRate) * (1 + taxRate);
    return new PurchasingOrderLine(
      props.id ?? crypto.randomUUID(),
      props.productSnapshot,
      props.orderedQuantity,
      props.unitCost,
      taxRate,
      discountRate,
      totalCost,
      0,
    );
  }

  withReceivedQuantity(qty: number): PurchasingOrderLine {
    if (qty > this.orderedQuantity) {
      throw new Error('INV-PO-004: receivedQuantity cannot exceed orderedQuantity');
    }
    return new PurchasingOrderLine(
      this.id,
      this.productSnapshot,
      this.orderedQuantity,
      this.unitCost,
      this.taxRate,
      this.discountRate,
      this.totalCost,
      qty,
    );
  }
}
