export class ProductSnapshot {
  constructor(
    public readonly productId: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly unit: string | null,
    public readonly warehouseId: string | null,
  ) {
    if (!productId) throw new Error('productId is required');
    if (!sku || sku.trim().length === 0) throw new Error('Product SKU is required');
    if (!name || name.trim().length === 0) throw new Error('Product name is required');
  }
}
