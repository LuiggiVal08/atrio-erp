export class SalesOrder {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly documentId: string,
    public readonly clientId: string,
    public readonly status: string,
    public readonly subtotal: number,
    public readonly taxAmount: number,
    public readonly total: number,
    public readonly currency: string,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
