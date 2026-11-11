import type { FiscalStrategy } from './fiscal-strategy.interface';

export class FiscalRegistry {
  private strategies = new Map<string, FiscalStrategy>();

  register(strategy: FiscalStrategy): void {
    this.strategies.set(strategy.countryCode, strategy);
  }

  getStrategy(countryCode: string): FiscalStrategy {
    const strategy = this.strategies.get(countryCode);
    if (!strategy) {
      throw new Error(`No fiscal strategy registered for country: ${countryCode}`);
    }
    return strategy;
  }

  hasStrategy(countryCode: string): boolean {
    return this.strategies.has(countryCode);
  }

  getAllCountries(): string[] {
    return Array.from(this.strategies.keys());
  }
}
