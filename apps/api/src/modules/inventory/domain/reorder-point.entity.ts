export class ReorderPoint {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly productId: string,
    public readonly warehouseId: string,
    public readonly minQuantity: number,
    public readonly maxQuantity: number,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
