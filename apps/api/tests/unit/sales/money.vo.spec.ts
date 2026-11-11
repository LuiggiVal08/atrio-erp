import { Money } from '../../../src/modules/sales/domain/money.vo';

describe('Money', () => {
  it('should create with valid amount and currency', () => {
    const m = new Money(100, 'VED');
    expect(m.amount).toBe(100);
    expect(m.currency).toBe('VED');
  });

  it('should reject negative amount', () => {
    expect(() => new Money(-1, 'VED')).toThrow('Money amount cannot be negative');
  });

  it('should reject empty currency', () => {
    expect(() => new Money(100, '')).toThrow('Currency is required');
  });

  it('should add two Money with same currency', () => {
    const a = new Money(100, 'VED');
    const b = new Money(50, 'VED');
    const result = a.add(b);
    expect(result.amount).toBe(150);
    expect(result.currency).toBe('VED');
  });

  it('should reject add with different currency', () => {
    const a = new Money(100, 'VED');
    const b = new Money(50, 'USD');
    expect(() => a.add(b)).toThrow('Currency mismatch');
  });

  it('should subtract two Money', () => {
    const a = new Money(100, 'VED');
    const b = new Money(30, 'VED');
    const result = a.subtract(b);
    expect(result.amount).toBe(70);
  });

  it('should multiply by factor', () => {
    const m = new Money(25, 'VED');
    const result = m.multiply(3);
    expect(result.amount).toBe(75);
    expect(result.currency).toBe('VED');
  });

  it('should check equality', () => {
    const a = new Money(100, 'VED');
    const b = new Money(100, 'VED');
    const c = new Money(100, 'USD');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it('should create with different amount same currency', () => {
    const m = new Money(100, 'VED');
    const m2 = m.withAmount(200);
    expect(m2.amount).toBe(200);
    expect(m2.currency).toBe('VED');
  });

  it('should detect zero', () => {
    expect(new Money(0, 'VED').isZero()).toBe(true);
    expect(new Money(1, 'VED').isZero()).toBe(false);
  });
});
