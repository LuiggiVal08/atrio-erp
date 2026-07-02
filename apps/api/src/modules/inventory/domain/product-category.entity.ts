export class ProductCategory {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly parentId: string | null,
    public readonly createdAt: Date,
  ) {}
}
