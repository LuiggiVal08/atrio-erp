export class Position {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly departmentId: string | null,
    public readonly name: string,
    public readonly code: string | null,
    public readonly description: string | null,
    public readonly isLeadership: boolean,
    public readonly active: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
