export class Commission {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly invoiceId: string,
    public readonly salespersonId: string,
    public readonly invoiceTotal: number,
    public readonly commissionRate: number,
    public readonly commissionAmount: number,
    public readonly currency: string,
    public readonly status: string,
    public readonly notes: string | null,
    public readonly paidAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
