export class StockMovement {
  constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly type: 'in' | 'out' | 'transfer',
    public readonly quantity: number,
    public readonly referenceId: string | null,
    public readonly referenceType: string | null,
    public readonly createdAt: Date,
    public readonly userId: string | null,
  ) {}
}
