export class PaymentMethod {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly type: 'cash' | 'transfer' | 'card' | 'check' | 'other',
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
