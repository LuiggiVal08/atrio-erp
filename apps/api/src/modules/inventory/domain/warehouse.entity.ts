export class Warehouse {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly branchId: string | null,
    public readonly code: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
