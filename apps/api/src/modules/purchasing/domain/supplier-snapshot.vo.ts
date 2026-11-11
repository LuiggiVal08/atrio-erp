export class SupplierSnapshot {
  constructor(
    public readonly supplierId: string,
    public readonly name: string,
    public readonly taxId: string | null,
    public readonly email: string | null,
    public readonly phone: string | null,
  ) {
    if (!supplierId) throw new Error('supplierId is required');
    if (!name || name.trim().length === 0) throw new Error('Supplier name is required');
  }
}
