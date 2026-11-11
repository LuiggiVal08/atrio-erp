export const IVA_RATES = {
  GENERAL: 0.16,
  REDUCED: 0.08,
  LUXURY_ADDITIONAL: 0.15,
  EXEMPT: 0,
} as const;

export type IvaCategory = 'general' | 'reduced' | 'luxury' | 'exempt';

export function getIvaRate(category: IvaCategory): number {
  switch (category) {
    case 'general': return IVA_RATES.GENERAL;
    case 'reduced': return IVA_RATES.REDUCED;
    case 'luxury': return IVA_RATES.GENERAL + IVA_RATES.LUXURY_ADDITIONAL;
    case 'exempt': return IVA_RATES.EXEMPT;
  }
}

export function getIvaDescription(category: IvaCategory, rate: number): string {
  switch (category) {
    case 'general': return `IVA General ${(rate * 100).toFixed(0)}%`;
    case 'reduced': return `IVA Reducido ${(rate * 100).toFixed(0)}%`;
    case 'luxury': return `IVA Suntuario ${(rate * 100).toFixed(0)}%`;
    case 'exempt': return 'Exento de IVA';
  }
}
