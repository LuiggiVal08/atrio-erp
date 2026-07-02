export class BankAccount {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly accountNumber: string,
    public readonly bankName: string,
    public readonly accountType: string,
    public readonly currency: string,
    public readonly balance: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
