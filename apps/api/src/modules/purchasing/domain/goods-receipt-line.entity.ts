export interface GoodsReceiptLineProps {
  id: string;
  purchasingOrderLineId: string;
  receivedQuantity: number;
  damagedQuantity: number;
  notes: string | null;
}

export class GoodsReceiptLine {
  constructor(
    public readonly id: string,
    public readonly purchasingOrderLineId: string,
    public readonly receivedQuantity: number,
    public readonly damagedQuantity: number,
    public readonly notes: string | null,
  ) {
    if (receivedQuantity <= 0) throw new Error('INV-GR-001: receivedQuantity must be greater than zero');
    if (damagedQuantity < 0) throw new Error('INV-GR-002: damagedQuantity cannot be negative');
  }

  static create(props: {
    id?: string;
    purchasingOrderLineId: string;
    receivedQuantity: number;
    damagedQuantity?: number;
    notes?: string | null;
  }): GoodsReceiptLine {
    return new GoodsReceiptLine(
      props.id ?? crypto.randomUUID(),
      props.purchasingOrderLineId,
      props.receivedQuantity,
      props.damagedQuantity ?? 0,
      props.notes ?? null,
    );
  }
}
