import { create } from 'zustand';

export interface TaxRule {
  id?: string;
  name: string;
  rate: number;
  category: string;
  isExempt: boolean;
}

export interface RetentionRule {
  id?: string;
  type: 'IGTF' | 'IVA' | 'ISLR';
  rate: number;
  threshold: number;
  appliesTo: ('sales' | 'purchases')[];
}

interface FiscalConfigState {
  taxRules: TaxRule[];
  retentionRules: RetentionRule[];
  addTaxRule: (rule: Omit<TaxRule, 'id'>) => void;
  setTaxRules: (rules: TaxRule[]) => void;
  removeTaxRule: (id: string) => void;
  addRetentionRule: (rule: Omit<RetentionRule, 'id'>) => void;
  calculateRate: (category: string) => number;
  reset: () => void;
}

const initialState = { taxRules: [], retentionRules: [] };

export const useFiscalConfigStore = create<FiscalConfigState>((set, get) => ({
  ...initialState,
  addTaxRule: (rule) =>
    set((s) => ({
      taxRules: [...s.taxRules, { ...rule, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }],
    })),
  setTaxRules: (rules) => set({ taxRules: rules }),
  removeTaxRule: (id) =>
    set((s) => ({ taxRules: s.taxRules.filter((r) => r.id !== id) })),
  addRetentionRule: (rule) =>
    set((s) => ({
      retentionRules: [...s.retentionRules, { ...rule, id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}` }],
    })),
  calculateRate: (category) => {
    const { taxRules } = get();
    return taxRules
      .filter((r) => r.category === category && !r.isExempt)
      .reduce((sum, r) => sum + r.rate, 0);
  },
  reset: () => set(initialState),
}));
