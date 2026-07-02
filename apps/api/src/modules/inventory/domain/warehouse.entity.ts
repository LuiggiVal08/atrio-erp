export class Warehouse {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
