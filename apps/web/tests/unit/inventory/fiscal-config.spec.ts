import { describe, it, expect, beforeEach } from 'vitest';
import { useFiscalConfigStore } from '@/modules/inventory/store/fiscal-config-store';
import type { TaxRule } from '@/modules/inventory/store/fiscal-config-store';

describe('fiscal config store', () => {
  beforeEach(() => {
    useFiscalConfigStore.getState().reset();
  });

  it('adds a tax rule', () => {
    useFiscalConfigStore.getState().addTaxRule({
      name: 'IVA 16%',
      rate: 0.16,
      category: 'general',
      isExempt: false,
    });
    const { taxRules } = useFiscalConfigStore.getState();
    expect(taxRules).toHaveLength(1);
    expect(taxRules[0].name).toBe('IVA 16%');
    expect(taxRules[0].rate).toBe(0.16);
  });

  it('calculates total rate for a category', () => {
    useFiscalConfigStore.getState().addTaxRule({ name: 'IVA 16%', rate: 0.16, category: 'general', isExempt: false });
    useFiscalConfigStore.getState().addTaxRule({ name: 'Municipal 2%', rate: 0.02, category: 'general', isExempt: false });
    const rate = useFiscalConfigStore.getState().calculateRate('general');
    expect(rate).toBe(0.18);
  });

  it('returns 0 for an exempt category', () => {
    useFiscalConfigStore.getState().addTaxRule({ name: 'IVA 16%', rate: 0.16, category: 'food', isExempt: true });
    const rate = useFiscalConfigStore.getState().calculateRate('food');
    expect(rate).toBe(0);
  });

  it('does not apply exempt rules in non-exempt category total', () => {
    useFiscalConfigStore.getState().addTaxRule({ name: 'IVA 16%', rate: 0.16, category: 'general', isExempt: false });
    useFiscalConfigStore.getState().addTaxRule({ name: 'Exempt Item', rate: 0.16, category: 'general', isExempt: true });
    const rate = useFiscalConfigStore.getState().calculateRate('general');
    expect(rate).toBe(0.16);
  });
});
