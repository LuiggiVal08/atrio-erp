export class PurchaseReturn {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly purchaseOrderId: string,
    public readonly reason: string,
    public readonly total: number,
    public readonly returnedAt: Date,
    public readonly createdAt: Date,
  ) {}
}
