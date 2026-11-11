import type { ContributorType, TaxDetailLine } from '@atrio/core-accounting';

/**
 * Retención de IVA en Venezuela:
 * - Contribuyente Especial: retiene el 75% del IVA (o 100% según el caso)
 * - Contribuyente Ordinario/Formal: no se le retiene
 * - Entes públicos: retención del 100%
 */
export const RETE_IVA_RATES: Record<string, number> = {
  special: 0.75,
  public: 1.0,
};

export function calculateIvaWithholding(
  ivaAmount: number,
  contributorType: ContributorType | string | undefined | null,
  isPublicEntity = false,
): TaxDetailLine | null {
  if (!contributorType && !isPublicEntity) return null;

  const rate = isPublicEntity
    ? RETE_IVA_RATES.public
    : RETE_IVA_RATES[contributorType ?? ''];

  if (!rate) return null;

  const amount = ivaAmount * rate;

  return {
    taxType: 'RETE_IVA',
    baseImponible: ivaAmount,
    percentage: rate * 100,
    amount,
    isWithholding: true,
  };
}
