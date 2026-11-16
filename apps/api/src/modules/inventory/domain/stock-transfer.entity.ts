export class StockTransfer {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly fromWarehouseId: string,
    public readonly toWarehouseId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly status: string,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly completedAt: Date | null,
    public readonly lotNumber: string | null = null,
    public readonly receivedQuantity: number = 0,
    public readonly shortageQuantity: number = 0,
    public readonly reserved: boolean = false,
    public readonly dispatchedAt: Date | null = null,
    public readonly receivedAt: Date | null = null,
    public readonly cancelledAt: Date | null = null,
    public readonly lotSerialNumber: string | null = null,
    public readonly lotExpirationDate: Date | null = null,
  ) {}

  get pendingQuantity(): number {
    return Math.max(0, this.quantity - this.receivedQuantity - this.shortageQuantity);
  }
}
