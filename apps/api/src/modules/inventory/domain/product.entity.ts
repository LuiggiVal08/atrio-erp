export class Product {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string | null,
    public readonly unitPrice: number,
    public readonly costPrice: number,
    public readonly taxId: string | null,
    public readonly isService: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
