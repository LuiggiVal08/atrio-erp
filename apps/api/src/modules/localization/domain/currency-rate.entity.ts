export class CurrencyRate {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly fromCurrency: string,
    public readonly toCurrency: string,
    public readonly rate: number,
    public readonly date: Date,
    public readonly createdAt: Date,
    public readonly source: string = 'manual',
    public readonly provider: string | null = null,
  ) {}
}
