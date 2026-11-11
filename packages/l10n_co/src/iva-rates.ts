export const IVA_RATES = {
  GENERAL: 0.19,
  DIFFERENTIAL: 0.05,
  EXEMPT: 0.0,
  EXCLUDED: 0.0,
} as const;

export type IvaCategory = 'general' | 'differential' | 'exempt' | 'excluded';

export function getIvaRate(category: IvaCategory): number {
  switch (category) {
    case 'general': return IVA_RATES.GENERAL;
    case 'differential': return IVA_RATES.DIFFERENTIAL;
    case 'exempt': return IVA_RATES.EXEMPT;
    case 'excluded': return IVA_RATES.EXCLUDED;
  }
}

export function getIvaDescription(category: IvaCategory): string {
  switch (category) {
    case 'general': return 'IVA General 19%';
    case 'differential': return 'IVA Diferencial 5%';
    case 'exempt': return 'Exento (0%)';
    case 'excluded': return 'Excluido';
  }
}
