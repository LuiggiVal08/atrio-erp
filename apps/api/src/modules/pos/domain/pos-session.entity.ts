export class PosSession {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly cashRegisterId: string,
    public readonly userId: string,
    public readonly openingBalance: number,
    public readonly closingBalance: number | null,
    public readonly status: string,
    public readonly openedAt: Date,
    public readonly closedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
