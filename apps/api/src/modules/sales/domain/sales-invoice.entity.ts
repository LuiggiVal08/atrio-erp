export class SalesInvoice {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly documentId: string,
    public readonly salesOrderId: string | null,
    public readonly clientId: string,
    public readonly status: string,
    public readonly subtotal: number,
    public readonly taxAmount: number,
    public readonly total: number,
    public readonly currency: string,
    public readonly currencyRate: number | null,
    public readonly notes: string | null,
    public readonly salespersonId: string | null,
    public readonly commissionRate: number | null,
    public readonly paidAt: Date | null,
    public readonly paymentMethodId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
