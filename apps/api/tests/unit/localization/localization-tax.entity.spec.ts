import { LocalizationTax } from '../../../src/modules/localization/domain/localization-tax.entity';

describe('LocalizationTax', () => {
  const now = new Date();

  it('should create a percentage tax', () => {
    const tax = new LocalizationTax(
      'tax-1', 'tenant-1', 'IVA 16%', 16.000, 'percentage', true, now, now,
    );
    expect(tax.name).toBe('IVA 16%');
    expect(tax.rate).toBe(16.000);
    expect(tax.type).toBe('percentage');
  });

  it('should create a fixed tax', () => {
    const tax = new LocalizationTax(
      'tax-2', 'tenant-1', 'IGTF 3%', 3.000, 'fixed', true, now, now,
    );
    expect(tax.type).toBe('fixed');
  });

  it('should support inactive taxes', () => {
    const tax = new LocalizationTax(
      'tax-3', 'tenant-1', 'Old Tax', 5.000, 'percentage', false, now, now,
    );
    expect(tax.isActive).toBe(false);
  });
});
