import { CurrencySnapshot } from '../../../src/modules/sales/domain/currency-snapshot.vo';

describe('CurrencySnapshot', () => {
  it('should create with currency code only', () => {
    const cs = new CurrencySnapshot('VED', null);
    expect(cs.code).toBe('VED');
    expect(cs.exchangeRate).toBeNull();
  });

  it('should create with exchange rate', () => {
    const cs = new CurrencySnapshot('USD', 40.5);
    expect(cs.code).toBe('USD');
    expect(cs.exchangeRate).toBe(40.5);
  });

  it('should reject empty code', () => {
    expect(() => new CurrencySnapshot('', null)).toThrow('Currency code is required');
  });

  it('should reject non-positive exchange rate', () => {
    expect(() => new CurrencySnapshot('USD', 0)).toThrow('Exchange rate must be positive');
    expect(() => new CurrencySnapshot('USD', -1)).toThrow('Exchange rate must be positive');
  });

  it('should detect local currency', () => {
    expect(new CurrencySnapshot('VED', null).isLocal()).toBe(true);
    expect(new CurrencySnapshot('VED', 1).isLocal()).toBe(true);
    expect(new CurrencySnapshot('USD', 40.5).isLocal()).toBe(false);
  });

  it('should check equality', () => {
    const a = new CurrencySnapshot('VED', null);
    const b = new CurrencySnapshot('VED', null);
    const c = new CurrencySnapshot('USD', 40);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
