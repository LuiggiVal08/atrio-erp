export class PriceListItem {
  constructor(
    public readonly id: string,
    public readonly priceListId: string,
    public readonly productId: string,
    public readonly unitPrice: number,
    public readonly createdAt: Date,
  ) {}
}

export class PriceList {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly name: string,
    public readonly vendorId: string | null,
    public readonly validFrom: Date | null,
    public readonly validTo: Date | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly items?: PriceListItem[],
  ) {}
}
