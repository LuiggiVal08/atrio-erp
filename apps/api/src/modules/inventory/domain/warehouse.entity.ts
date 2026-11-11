export class Warehouse {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly branchId: string | null,
    public readonly code: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly aisle: string | null = null,
    public readonly shelf: string | null = null,
    public readonly level: string | null = null,
    public readonly bin: string | null = null,
  ) {}
}
