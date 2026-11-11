export class CurrencySnapshot {
  constructor(
    public readonly code: string,
    public readonly exchangeRate: number | null,
  ) {
    if (!code || code.trim().length === 0) throw new Error('Currency code is required');
    if (exchangeRate !== null && exchangeRate <= 0) throw new Error('Exchange rate must be positive');
  }

  equals(other: CurrencySnapshot): boolean {
    return this.code === other.code && this.exchangeRate === other.exchangeRate;
  }

  isLocal(): boolean {
    return this.exchangeRate === null || this.exchangeRate === 1;
  }
}
