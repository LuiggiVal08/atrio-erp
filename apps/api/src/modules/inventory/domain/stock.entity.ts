export class Stock {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly quantity: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly committedQuantity: number = 0,
  ) {}

  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.committedQuantity);
  }
}
