export class ProductBrand {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly logoFileId: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
  ) {}
}
