export class CashMovement {
  constructor(
    public readonly id: string,
    public readonly registerId: string,
    public readonly type: 'in' | 'out',
    public readonly amount: number,
    public readonly referenceType: string | null,
    public readonly referenceId: string | null,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly userId: string,
    public readonly currency: string | null = null,
    public readonly exchangeRate: number | null = null,
    public readonly baseAmount: number | null = null,
    public readonly paymentMethod: string | null = null,
    public readonly category: string | null = null,
    public readonly receiptName: string | null = null,
  ) {}
}
