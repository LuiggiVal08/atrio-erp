export class PurchaseReturn {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly purchaseOrderId: string,
    public readonly reason: string,
    public readonly subtotal: number,
    public readonly taxAmount: number,
    public readonly total: number,
    public readonly status: string,
    public readonly returnedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
