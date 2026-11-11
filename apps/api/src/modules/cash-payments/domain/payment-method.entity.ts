export class PaymentMethod {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly type: 'cash' | 'digital' | 'card' | 'other',
    public readonly currency: string,
    public readonly commissionRate: number | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
