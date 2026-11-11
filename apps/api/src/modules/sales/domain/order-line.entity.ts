import { Money } from './money.vo';

export interface OrderLineProps {
  id: string;
  lineNumber: number;
  productId: string;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: Money;
  lineTotal: Money;
  createdAt: Date;
}

export class OrderLine {
  constructor(
    public readonly id: string,
    public readonly lineNumber: number,
    public readonly productId: string,
    public readonly productName: string,
    public readonly productSku: string | null,
    public readonly quantity: number,
    public readonly unitPrice: Money,
    public readonly lineTotal: Money,
    public readonly createdAt: Date,
  ) {
    if (quantity <= 0) throw new Error('INV-SALE-003: Line quantity must be greater than zero');
    if (!unitPrice.currency) throw new Error('Currency is required on unitPrice');
  }

  static create(props: Omit<OrderLineProps, 'id' | 'lineNumber' | 'createdAt' | 'lineTotal'> & { id?: string; lineNumber?: number; createdAt?: Date }): OrderLine {
    const lineTotal = props.unitPrice.multiply(props.quantity);
    return new OrderLine(
      props.id ?? crypto.randomUUID(),
      props.lineNumber ?? 1,
      props.productId,
      props.productName,
      props.productSku ?? null,
      props.quantity,
      props.unitPrice,
      lineTotal,
      props.createdAt ?? new Date(),
    );
  }

  withQuantity(newQty: number): OrderLine {
    return new OrderLine(
      this.id,
      this.lineNumber,
      this.productId,
      this.productName,
      this.productSku,
      newQty,
      this.unitPrice,
      this.unitPrice.multiply(newQty),
      this.createdAt,
    );
  }

  equals(other: OrderLine): boolean {
    return this.id === other.id;
  }
}
