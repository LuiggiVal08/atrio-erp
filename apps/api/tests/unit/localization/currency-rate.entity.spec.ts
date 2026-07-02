import { CurrencyRate } from '../../../src/modules/localization/domain/currency-rate.entity';

describe('CurrencyRate', () => {
  const now = new Date();

  it('should create a currency rate', () => {
    const rate = new CurrencyRate(
      'rate-1', 'tenant-1', 'USD', 'VES', 89.50, now, now,
    );
    expect(rate.fromCurrency).toBe('USD');
    expect(rate.toCurrency).toBe('VES');
    expect(rate.rate).toBe(89.50);
  });

  it('should support different currency pairs', () => {
    const rate = new CurrencyRate(
      'rate-2', 'tenant-1', 'EUR', 'USD', 1.08, now, now,
    );
    expect(rate.fromCurrency).toBe('EUR');
    expect(rate.toCurrency).toBe('USD');
  });
});
