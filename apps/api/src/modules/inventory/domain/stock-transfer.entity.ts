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
  ) {}
}
